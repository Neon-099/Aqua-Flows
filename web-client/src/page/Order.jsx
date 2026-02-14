import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  MapPin,
  Clock,
  Wallet,
  CreditCard,
  Info,
  Truck,
  CalendarRange,
  X,
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthProvider';

const Order = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [schedule, setSchedule] = useState('round-gallon');
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');

  const gallonType = schedule === 'slim-gallon' ? 'SLIM' : 'ROUND';
  const gallonLabel =
    gallonType === 'SLIM' ? `Gallon Slim (Refill)` : `Gallon Round (Refill)`;

  const subtotal = quantity * 15; // sample pricing in pesos
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setOrdersError('');
        const res = await apiRequest('/orders');
        const mapped = (res?.data || []).map((order) => {
          const createdAt = order.created_at ? new Date(order.created_at) : new Date();
          const status =
            order.status === 'DELIVERED' || order.status === 'COMPLETED'
              ? 'Delivered'
              : order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP'
              ? 'In Transit'
              : order.status === 'PENDING' || order.status === 'CONFIRMED'
          return {
            id: order._id,
            date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            items: order.gallon_type === 'SLIM' ? `${order.water_quantity} Gallon Slim (Refill)` : `5 Gallon Round (Refill)`,
            qty: order.water_quantity,
            total: order.total_amount,
            status,
            name: user?.name || user.name,
            address: user?.address || user.address || 'Address unavailable',
          };
        });
        setOrders(mapped);
      } catch (err) {
        setOrdersError(err?.message || 'Failed to load orders');
      }
    };

    loadOrders();
  }, [user?.address, user?.name]);

  console.log('Order: ', orders);

  const changeQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      return next < 1 ? 1 : next > 10 ? 10 : next;
    });
  };

  const runGcashPayment = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        // mock success rate; wire to real gateway later
        Math.random() < 0.95 ? resolve(true) : reject(new Error('GCash payment failed.'));
      }, 1400);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (paymentMethod === 'gcash') {
      try {
        setIsProcessingPayment(true);
        await runGcashPayment();
      } catch (error) {
        setPaymentError(error?.message || 'GCash payment failed.');
        setIsProcessingPayment(false);
        return;
      }
    }

    try {
      const res = await apiRequest('/orders', 'POST', {
        water_quantity: quantity,
        total_amount: total,
        payment_method: paymentMethod.toUpperCase(),
        gallon_type: gallonType,
      });

      const created = res?.data?.order || res?.data;
      if (created) {
        const createdAt = created.created_at ? new Date(created.created_at) : new Date();
        const status =
          created.status === 'DELIVERED' || created.status === 'COMPLETED'
            ? 'Delivered'
            : created.status === 'OUT_FOR_DELIVERY' || created.status === 'PICKED_UP'
            ? 'In Transit'
            : '';
        const newOrder = {
          id: created._id,
          date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: gallonLabel,
          qty: created.water_quantity,
          total: created.total_amount,
          status,
          eta: created.eta_text || status,
          address: user?.address || 'Address unavailable',
        };
        setOrders((prev) => [newOrder, ...prev]);
      }

      setIsProcessingPayment(false);
      setIsModalOpen(false);
    } catch (err) {
      setPaymentError(err?.message || 'Failed to create order');
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

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>

        <div className="hidden md:flex gap-4">
          <Link to="/home">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </Link>
          <Link to="/orders">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/messages">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Household Account
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden">
            <img src="/api/placeholder/40/40" alt="Sarah" />
          </div>
        </div>
      </nav>

      {/* Background + Card Layout */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* soft gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-16 grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          {/* Left column: intro + CTA card */}
          <section className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-slate-100">
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
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
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

              <div className="bg-blue-600 text-blue-50 rounded-3xl p-6 shadow-md shadow-blue-200 flex flex-col justify-between">
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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
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
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                          {order.id} • {order.date}
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
                      <span className="inline-flex items-center gap-2">
                        <Clock size={16} /> {order.eta}
                      </span>
                      <span className="font-black text-slate-900">₱{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Modal - Order Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2.2rem] shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/60">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  New order
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Schedule your water refill
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal content */}
            <form onSubmit={handleSubmit} className="grid md:grid-cols-[1.4fr,1fr] gap-0">
              {/* Left: form fields */}
              <div className="p-8 space-y-7 border-r border-slate-100">

                {/* Quantity & schedule */}
                <section className="grid md:grid-cols-2 gap-5">
                  {/* Quantity */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Quantity
                      </p>
                      <p className="font-black text-lg text-slate-900">How many gallons?</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => changeQuantity(-1)}
                        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-500 hover:bg-slate-100"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-3xl font-black text-slate-900 leading-none">{quantity}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                          Gallons
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeQuantity(1)}
                        className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black hover:bg-blue-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* GALLON TYPE */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-inner">
                        <CalendarRange size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          Gallon Type
                        </p>
                        <p className="font-black text-lg text-slate-900">What type of gallon?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'round-gallon', label: 'Round Gallon' },
                        { id: 'slim-gallon', label: 'Slim Gallon'},
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSchedule(slot.id)}
                          className={`rounded-xl px-3 py-2 text-left border text-[11px] font-bold leading-tight ${
                            schedule === slot.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block uppercase tracking-[0.18em] text-[10px]">
                            {slot.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
                        
              {/* Right: summary + payment */}
              <aside className="p-8 space-y-6 bg-slate-50/60">
                {/* PAYMENT METHOD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-500" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Payment method
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
                      { id: 'gcash', label: 'GCash', icon: CreditCard },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
                          paymentMethod === id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Icon size={18} className="text-blue-500" />
                        </div>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold flex items-start gap-2">
                    <Info size={14} className="mt-[2px] text-slate-300" />
                    {paymentMethod === 'gcash'
                      ? 'GCash payments must be completed before we create your order.'
                      : 'Your rider will confirm the amount and payment upon delivery.'}
                  </p>
                  {paymentError && (
                    <p className="text-[11px] font-semibold text-rose-600">{paymentError}</p>
                  )}
                </div>
                
                {/* ORDER SUMMARY */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.22em] mb-4 text-center">
                    Order Summary
                  </h3>
                  <div className="flex gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                      <Droplet fill="currentColor" size={26} />
                    </div>
                    <div>
                      <p className="font-black text-base text-slate-900">
                        {gallonLabel}
                      </p>
                      <p className="text-[12px] text-slate-400 font-semibold mt-1">
                        Qty {quantity} •{' '}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Subtotal</span>
                      <span className="text-slate-800">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Delivery fee</span>
                      <span className="text-slate-800">₱{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-xl pt-3">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.22em] hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProcessingPayment ? 'Processing GCash…' : 'Confirm Order'}
                </button>
              </aside>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
