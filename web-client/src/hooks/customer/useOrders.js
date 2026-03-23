import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../contexts/AuthProvider';

const PRICE_PER_GALLON = 15;
const DELIVERY_FEE = 5;
const GCASH_VAT_FEE = 3;
const GCASH_PENDING_KEY = 'gcashPendingIntent';
const ORDERS_PER_PAGE = 4;
const ETA_FALLBACK_TEXT = 'Waiting to assign rider';

const normalizeNullableText = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return '';
  return text;
};

const getOrderStatusLabel = (status) => {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'Delivered';
  if (status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP') return 'In Transit';
  if (status === 'PENDING' || status === 'CONFIRMED') return 'Pending';
  return status || 'Pending';
};

const getDisplayEtaText = (order) => {
  if (order.status === 'PENDING') {
    return ETA_FALLBACK_TEXT;
  }
  else if (order.status === 'DELIVERED'){
    return 'Delivered'
  }
};

const statusStyles = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Confirmed':
      return 'bg-emerald-50 text-emerald-500 border-emerald-100';
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Transit':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const useOrders = () => {
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
  const [cancellingOrderId, setCancellingOrderId] = useState('');
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const autoFinalizeTriedRef = useRef(false);

  const gallonType = schedule === 'slim-gallon' ? 'SLIM' : 'ROUND';
  const gallonLabel = gallonType === 'SLIM' ? 'Gallon Slim (Refill)' : 'Gallon Round (Refill)';

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
            rawStatus: order.status,
            date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            items: order.gallon_type === 'SLIM' ? `${order.water_quantity} Gallon Slim (Refill)` : '5 Gallon Round (Refill)',
            qty: order.water_quantity,
            total: order.total_amount,
            status,
            name: user?.name || user?.name,
            address: normalizeNullableText(user?.address) || 'Address unavailable',
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

  const changeQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      return next < 1 ? 1 : next > 10 ? 10 : next;
    });
  };

  const requirePhoneForGcash = () => {
    const phone = normalizeNullableText(user?.phone);
    if (!phone) {
      const message = 'Phone number is required for GCash payments. Please update your profile.';
      setPaymentError(message);
      toast.error(message);
      return false;
    }
    return true;
  };

  const finalizePaidGcashOrder = async (pending) => {
    if (!requirePhoneForGcash()) {
      throw new Error('Phone number is required for GCash payments.');
    }
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
    const itemLabel = pendingGallonType === 'SLIM' ? 'Gallon Slim (Refill)' : 'Gallon Round (Refill)';
    const newOrder = {
      id: created._id,
      orderCode: created.order_code || created._id,
      rawStatus: created.status,
      date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: itemLabel,
      qty: created.water_quantity,
      total: created.total_amount,
      status,
      eta: getDisplayEtaText(created),
      address: normalizeNullableText(user?.address) || 'Address unavailable',
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCurrentPage(1);
    toast.success('GCash order finalized.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === 'gcash') {
        if (!requirePhoneForGcash()) {
          return;
        }
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
        const status = getOrderStatusLabel(created.status);
        const newOrder = {
          id: created._id,
          orderCode: created.order_code || created._id,
          rawStatus: created.status,
          date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: gallonLabel,
          qty: created.water_quantity,
          total: created.total_amount,
          status,
          eta: getDisplayEtaText(created),
          address: normalizeNullableText(user?.address) || 'Address unavailable',
        };
        setOrders((prev) => [newOrder, ...prev]);
        setCurrentPage(1);
        toast.success('Order placed successfully.');
      }

      setIsProcessingPayment(false);
      setIsModalOpen(false);
    } catch (err) {
      setPaymentError(err?.message || 'Failed to create order');
      toast.error(err?.message || 'Failed to create order');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelOrder = (order) => {
    setCancelTargetOrder(order);
  };

  const closeCancelModal = () => {
    if (cancellingOrderId) return;
    setCancelTargetOrder(null);
  };

  const confirmCancelOrder = async () => {
    if (!cancelTargetOrder?.id) return;
    const orderId = cancelTargetOrder.id;
    setOrdersError('');
    setCancellingOrderId(orderId);
    try {
      const res = await apiRequest(`/orders/${orderId}/cancel`, 'PUT');
      const updated = res?.data;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                rawStatus: updated?.status || 'CANCELLED',
                status: getOrderStatusLabel(updated?.status || 'CANCELLED'),
                eta: null,
              }
            : order
        )
      );
      setCancelTargetOrder(null);
      toast.success('Order cancelled.');
    } catch (err) {
      setOrdersError(err?.message || 'Failed to cancel order');
      toast.error(err?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId('');
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE)), [orders.length]);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [currentPage, orders]);

   const safeAddress = (() => {
    const value = String(user?.address ?? '').trim();
    if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
      return 'Address unavailable';
    }
    return value;
  })();

  const statusSortRank = {
    Pending: 1,
    Confirmed: 2,
    'In Transit': 3,
    Delivered: 4,
    Completed: 98,
    CANCELLED: 99,
  };
  const sortedRecentOrders = [...paginatedOrders].sort((a, b) => {
    const rankA = statusSortRank[a.status] ?? 50;
    const rankB = statusSortRank[b.status] ?? 50;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });

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
      toast.error('Payment was cancelled.');
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
      toast.error('Missing pending checkout data. Please start checkout again.');
      clearGcashQueryParam();
      return;
    }

    setIsProcessingPayment(true);
    finalizePaidGcashOrder(pending)
      .catch((err) => {
        setPaymentError(err?.message || 'Failed to finalize GCash order');
        toast.error(err?.message || 'Failed to finalize GCash order');
      })
      .finally(() => {
        setIsProcessingPayment(false);
        clearGcashQueryParam();
      });
  }, [user?.address]);

  const isInitialLoading = ordersLoading && orders.length === 0;

  return {
    user,
    isModalOpen,
    setIsModalOpen,
    quantity,
    changeQuantity,
    paymentMethod,
    setPaymentMethod,
    paymentChannel,
    setPaymentChannel,
    isProcessingPayment,
    paymentError,
    schedule,
    setSchedule,
    orders,
    currentPage,
    setCurrentPage,
    ordersLoading,
    ordersError,
    cancellingOrderId,
    cancelTargetOrder,
    handleCancelOrder,
    closeCancelModal,
    confirmCancelOrder,
    gallonLabel,
    subtotal,
    deliveryFee,
    vatFee,
    total,
    totalPages,
    paginatedOrders,
    isInitialLoading,
    handleSubmit,
    statusStyles,
    ORDERS_PER_PAGE,
    safeAddress,
    sortedRecentOrders
  };
};

export default useOrders;
