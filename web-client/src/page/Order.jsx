import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Truck,
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthProvider';
import Header from '../components/Header'
import { Skeleton } from '../components/WireframeSkeleton';
import OrderFormModal from '../components/OrderFormModal';

const getOrderStatusLabel = (status) => {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'Delivered';
  if (status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP') return 'In Transit';
  if (status === 'PENDING' || status === 'CONFIRMED') return 'Pending';
  return status || 'Pending';
};

const getDisplayEtaText = (order) => {
  if (!order) return null;
  //TO RETURN AND NOT DISPLAY ETA
  if (order.status === 'PENDING_PAYMENT') return null;
  if (order.eta_text) return order.eta_text;
  if (order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY') {
    return 'ETA will appear once rider picks up';
  }
  return null;
};

const PRICE_PER_GALLON = 15;
const DELIVERY_FEE = 5;
const GCASH_VAT_FEE = 3;
const GCASH_PENDING_KEY = 'gcashPendingIntent';

const Order = () => {
  const ORDERS_PER_PAGE = 4;
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentChannel, setPaymentChannel] = useState('gcash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [schedule, setSchedule] = useState('round-gallon');
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const autoFinalizeTriedRef = useRef(false);

  const gallonType = schedule === 'slim-gallon' ? 'SLIM' : 'ROUND';
  const gallonLabel =
    gallonType === 'SLIM' ? `Gallon Slim (Refill)` : `Gallon Round (Refill)`;

  const subtotal = quantity * PRICE_PER_GALLON;
  const deliveryFee = DELIVERY_FEE;
  const vatFee = paymentMethod === 'gcash' ? GCASH_VAT_FEE : 0;
  const total = subtotal + deliveryFee + vatFee;

  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const res = await apiRequest('/orders');
        const mapped = (res?.data || []).map((order) => {
          const createdAt = order.created_at ? new Date(order.created_at) : new Date();
          const status = getOrderStatusLabel(order.status);
          return {
            id: order._id,
            orderCode: order.order_code || order._id,
            date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            items: order.gallon_type === 'SLIM' ? `${order.water_quantity} Gallon Slim (Refill)` : `5 Gallon Round (Refill)`,
            qty: order.water_quantity,
            total: order.total_amount,
            status,
            name: user?.name || user.name,
            address: user?.address || user.address || 'Address unavailable',
            eta: getDisplayEtaText(order),
          };
        });
        if (!mounted) return;
        setOrders(mapped);
      } catch (err) {
        if (!mounted) return;
        setOrdersError(err?.message || 'Failed to load orders');
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.address, user?.name]);

  console.log('Ordering: ', orders);

  const changeQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      return next < 1 ? 1 : next > 10 ? 10 : next;
    });
  };

  const finalizePaidGcashOrder = async (pending) => {
    const pendingQty = Number(pending?.quantity || 0);
    const pendingGallonType = pending?.gallon_type;
    const pendingTotal = Number(pending?.total_amount || 0);
    if (!pending?.payment_intent_id || !pendingQty || !pendingGallonType || !pendingTotal) {
      throw new Error('Missing pending GCash checkout details');
    }

    const pendingSubtotal = pendingQty * PRICE_PER_GALLON;
    const res = await apiRequest('/orders', 'POST', {
      water_quantity: pendingQty,
      subtotal_amount: pendingSubtotal,
      delivery_fee: DELIVERY_FEE,
      vat_fee: GCASH_VAT_FEE,
      total_amount: pendingTotal,
      payment_method: 'GCASH',
      gallon_type: pendingGallonType,
      gcash_payment_intent_id: pending.payment_intent_id,
    });

    localStorage.removeItem(GCASH_PENDING_KEY);
    const created = res?.data?.order || res?.data;
    if (!created) return;

    const createdAt = created.created_at ? new Date(created.created_at) : new Date();
    const status = getOrderStatusLabel(created.status);
    const itemLabel =
      pendingGallonType === 'SLIM' ? 'Gallon Slim (Refill)' : 'Gallon Round (Refill)';
    const newOrder = {
      id: created._id,
      orderCode: created.order_code || created._id,
      date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: itemLabel,
      qty: created.water_quantity,
      total: created.total_amount,
      status,
      eta: getDisplayEtaText(created),
      address: user?.address || 'Address unavailable',
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === 'gcash') {
        const pendingRaw = localStorage.getItem(GCASH_PENDING_KEY);
        const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
        const canFinalize =
          pending &&
          pending.payment_intent_id &&
          pending.quantity === quantity &&
          pending.gallon_type === gallonType &&
          Number(pending.total_amount) === Number(total);

        if (!canFinalize) {
          const prepRes = await apiRequest('/orders/gcash_prepare', 'POST', {
            water_quantity: quantity,
            total_amount: total,
            payment_method: 'GCASH',
            gallon_type: gallonType,
            payment_channel: paymentChannel,
          });

          const paymentIntentId = prepRes?.data?.payment_intent_id;
          const checkoutUrl = prepRes?.data?.checkout_url;
          if (!paymentIntentId || !checkoutUrl) {
            setPaymentError('Unable to start GCash checkout. Please try again.');
            return;
          }

          localStorage.setItem(
            GCASH_PENDING_KEY,
            JSON.stringify({
              payment_intent_id: paymentIntentId,
              quantity,
              gallon_type: gallonType,
              total_amount: total,
              payment_channel: paymentChannel,
            })
          );
          window.location.assign(checkoutUrl);
          return;
        }

        await finalizePaidGcashOrder(pending);
        setIsModalOpen(false);
        return;
      }

      const res = await apiRequest('/orders', 'POST', {
        water_quantity: quantity,
        subtotal_amount: subtotal,
        delivery_fee: deliveryFee,
        vat_fee: vatFee,
        total_amount: total,
        payment_method: paymentMethod.toUpperCase(),
        gallon_type: gallonType,
      });

      const created = res?.data?.order || res?.data;
      if (created) {
        const createdAt = created.created_at ? new Date(created.created_at) : new Date();
        const status =
          getOrderStatusLabel(created.status);
        const newOrder = {
          id: created._id,
          orderCode: created.order_code || created._id,
          date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: gallonLabel,
          qty: created.water_quantity,
          total: created.total_amount,
          status,
          eta: getDisplayEtaText(created),
          address: user?.address || 'Address unavailable',
        };
        setOrders((prev) => [newOrder, ...prev]);
        setCurrentPage(1);
      }

      setIsProcessingPayment(false);
      setIsModalOpen(false);
    } catch (err) {
      setPaymentError(err?.message || 'Failed to create order');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const statusStyles = (status) => {
    if (status === 'Delivered') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'In Transit') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const isInitialLoading = ordersLoading && orders.length === 0;
  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (autoFinalizeTriedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const gcashStatus = params.get('gcash');
    if (!gcashStatus) return;

    const clearGcashQueryParam = () => {
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('gcash');
      const nextSearch = cleaned.searchParams.toString();
      const nextUrl = `${cleaned.pathname}${nextSearch ? `?${nextSearch}` : ''}${cleaned.hash}`;
      window.history.replaceState({}, '', nextUrl);
    };

    autoFinalizeTriedRef.current = true;

    if (gcashStatus === 'cancelled') {
      setPaymentError('Payment was cancelled. You can retry checkout.');
      clearGcashQueryParam();
      return;
    }
    if (gcashStatus !== 'success') {
      clearGcashQueryParam();
      return;
    }

    const pendingRaw = localStorage.getItem(GCASH_PENDING_KEY);
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
    if (!pending?.payment_intent_id) {
      setPaymentError('Missing pending checkout data. Please start checkout again.');
      clearGcashQueryParam();
      return;
    }

    setIsProcessingPayment(true);
    finalizePaidGcashOrder(pending)
      .catch((err) => {
        setPaymentError(err?.message || 'Failed to finalize GCash order');
      })
      .finally(() => {
        setIsProcessingPayment(false);
        clearGcashQueryParam();
      });
  }, [user?.address]);

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Standardized Navigation */}
      <Header 
        name={user?.name || 'customer'}
        image={user?.image || 'customer'}/>

      {/* Background + Card Layout */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* soft gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />
        <div className="relative z-10 max-w-6xl mx-auto px-12 py-8 grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          {/* Left column: intro + CTA card */}
          <section className="space-y-8">
            {isInitialLoading ? (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                  <Skeleton className="h-7 w-44 rounded-full" />
                  <Skeleton className="h-12 w-full max-w-[560px]" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <div className="flex flex-wrap gap-4 items-center pt-2">
                    <Skeleton className="h-12 w-52 rounded-xl" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-56" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <div className="pt-3 flex items-center justify-between">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-7 w-56" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-52" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-52" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
                    <Truck size={14} />
                    Same-day delivery in your area
                  </p>

                  <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
                    Order water refills, without the hassle.
                  </h1>
                  <p className="text-slate-500 text-lg leading-relaxed mb-6">
                    Choose your gallons, confirm your address, and pick a delivery window.
                    Our riders handle the pickup and refill so you never run out of clean water.
                  </p>

                  <div className="flex flex-wrap gap-4 items-center">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-[0.16em] uppercase shadow-md"
                    >
                      Place New Order
                    </button>
                    <span className="text-sm text-slate-500">
                      Next available window:{' '}
                      <span className="font-semibold text-slate-800">Today, 1PM – 5PM</span>
                    </span>
                  </div>
                </div>

                {/* Address summary card */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-600/90 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                          Delivery address
                        </p>
                        <p className="font-black text-lg text-slate-900">Maple Residence · Dagupan City</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Unit 4B, Maple Residence, Phase 2, Brgy. San Miguel, Dagupan City, Pangasinan.
                    </p>
                  </div>

                  <div className="bg-blue-600 text-blue-50 rounded-[2.5rem] p-10 shadow-md shadow-blue-200 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100 mb-2">
                        Active plan
                      </p>
                      <p className="text-xl font-black">Household Refill</p>
                      <p className="text-sm text-blue-100 mt-1">
                        Up to <span className="font-semibold">10 gallons</span> per day with priority routing.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-blue-100">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} /> Last delivery: Yesterday, 3:45 PM
                      </span>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="underline font-semibold hover:text-white"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                        Recent Orders
                      </p>
                      <h3 className="text-xl font-black text-slate-900">Your latest deliveries</h3>
                    </div>
                    <Link to="/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      View all
                    </Link>
                  </div>
                  <div className="grid gap-4">
                    {ordersError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-semibold">
                        {ordersError}
                      </div>
                    )}
                    {paginatedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                              {order.orderCode} • {order.date}
                            </p>
                            <p className="font-black text-slate-900 mt-1">{order.items}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              Qty {order.qty} · {order.address}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-bold uppercase tracking-[0.18em] border px-2.5 py-1 rounded-full ${statusStyles(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          {order.eta ? (
                            <span className="inline-flex items-center gap-2">
                              <Clock size={16} /> {order.eta}
                            </span>
                          ) : <span />}
                          <span className="font-black text-slate-900">₱{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    {!orders.length && (
                      <p className="text-sm text-slate-400">No recent orders yet.</p>
                    )}
                    {orders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <OrderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        quantity={quantity}
        onChangeQuantity={changeQuantity}
        schedule={schedule}
        onScheduleChange={setSchedule}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentChannel={paymentChannel}
        onPaymentChannelChange={setPaymentChannel}
        paymentError={paymentError}
        isProcessingPayment={isProcessingPayment}
        gallonLabel={gallonLabel}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        vatFee={vatFee}
        total={total}
      />
    </div>
  );
};

export default Order;
