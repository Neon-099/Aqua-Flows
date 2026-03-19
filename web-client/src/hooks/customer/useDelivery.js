import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiRequest } from '../../utils/api';
import { listConversations } from '../../utils/chatApi';
import { 
  CheckCircle2, Package, RefreshCw, Truck, Home, Clock, Timer
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';


const ACTIVE_ORDER_STATUSES = ['CONFIRMED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PENDING_PAYMENT'];
const HISTORY_STATUSES = ['COMPLETED', 'CANCELLED'];

const PRICE_PER_GALLON = 15;
const DELIVERY_FEE = 5;
const ETA_FALLBACK_TEXT = 'Waiting to assign rider';

const normalizeNullableText = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return '';
  return text;
};

const STATUS_LABEL = {
  PENDING: 'Pending',
  CONFIRMED: 'Accepted',
  PICKED_UP: 'In Process',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  PENDING_PAYMENT: 'Pending Payment',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const money = (n) => `₱${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const sortByRecent = (arr) =>
  [...arr].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

const getDisplayEtaText = (order) => {
  if (!order) return ETA_FALLBACK_TEXT;
  const etaText = normalizeNullableText(order.eta_text);
  if(order.status === 'OUT_FOR_DELIVERY'){
    return etaText || order?.eta_text
  } else if (order.status === 'GALLON_PICKUP'){
    return etaText || order?.etaText
  }
};

const getProgressSteps = (status) => {
  const steps = [
     {
      label: 'Pending',
      icon: Timer,
      activeClasses: 'from-sky-200 to-sky-400 ring-sky-100',
      textActiveClass: 'text-sky-600',
      progressClass: 'bg-sky-300',
    },
    {
      label: 'Confirmed',
      icon: CheckCircle2,
      activeClasses: 'from-emerald-500 to-emerald-600 ring-emerald-200',
      textActiveClass: 'text-emerald-600',
      progressClass: 'bg-emerald-500',
    },
    {
      label: 'Gallon Pickup',
      icon: Package,
      activeClasses: 'from-sky-500 to-sky-600 ring-sky-200',
      textActiveClass: 'text-sky-600',
      progressClass: 'bg-sky-500',
    },
    {
      label: 'Refilling in Progress',
      icon: RefreshCw,
      activeClasses: 'from-violet-500 to-violet-600 ring-violet-200',
      textActiveClass: 'text-violet-600',
      progressClass: 'bg-violet-500',
    },
    {
      label: 'Delivery in Progress',
      icon: Truck,
      activeClasses: 'from-amber-500 to-amber-600 ring-amber-200',
      textActiveClass: 'text-amber-600',
      progressClass: 'bg-amber-500',
    },
    {
      label: 'Pending Payment',
      icon: Clock,
      activeClasses: 'from-rose-500 to-rose-600 ring-rose-200',
      textActiveClass: 'text-rose-600',
      progressClass: 'bg-rose-500',
    },
    {
      label: 'Completed',
      icon: CheckCircle2,
      activeClasses: 'from-emerald-600 to-emerald-700 ring-emerald-300',
      textActiveClass: 'text-emerald-700',
      progressClass: 'bg-emerald-600',
    },
  ];

  const currentIndex = (() => {
    if(status === 'PENDING') return 0
    if (status === 'CONFIRMED') return 1;
    if (status === 'PICKED_UP') return 2;
    if (status === 'GALLON_PICKUP') return 3
    if (status === 'OUT_FOR_DELIVERY') return 4;
    if (status === 'PENDING_PAYMENT') return 5;
    if (status === 'COMPLETED') return 6;
    return 0;
  })();

  return steps.map((step, index) => ({
    ...step,
    active: index <= currentIndex,
    current: index === currentIndex,
  }));
};

const useDelivery = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState('');
  const HISTORY_PER_PAGE = 4;

  const navigate = useNavigate();


  useEffect(() => {
    let mounted = true;

    const load = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      setError('');
      try {
        const [ordersRes, convoRows] = await Promise.all([
          apiRequest('/orders'),
          listConversations(50),
        ]);
        if (!mounted) return;
        setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
        setConversations(Array.isArray(convoRows) ? convoRows : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load delivery data');
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };

    load(true);
    const interval = setInterval(() => {
      load(false);
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeOrders = useMemo(() => {
    return sortByRecent(orders).filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  }, [orders]);

  const latestActiveOrder = activeOrders[0] || null;

  useEffect(() => {
    if (activeOrders.length === 0) {
      if (selectedActiveOrderId) setSelectedActiveOrderId('');
      return;
    }
    if (!selectedActiveOrderId || !activeOrders.some((o) => o._id === selectedActiveOrderId)) {
      setSelectedActiveOrderId(activeOrders[0]._id);
    }
  }, [activeOrders, selectedActiveOrderId]);

  const recentHistory = useMemo(() => {
    return sortByRecent(orders).filter((o) => HISTORY_STATUSES.includes(o.status));
  }, [orders]);

  const latestSummaryOrder = useMemo(() => {
    if (latestActiveOrder) return latestActiveOrder;
    return sortByRecent(orders)[0] || null;
  }, [orders, latestActiveOrder]);

  const riderConversation = useMemo(() => {
    const riderConvos = (conversations || []).filter(
      (c) => c?.counterpartyRole === 'rider' && !c?.archivedAt
    );
    if (!riderConvos.length) return null;

    if (latestActiveOrder?._id) {
      const exact = riderConvos.find((c) => c?.orderId === latestActiveOrder._id);
      if (exact) return exact;
    }
    return riderConvos[0];
  }, [conversations, latestActiveOrder]);

  const selectedActiveOrder = activeOrders.find((o) => o._id === selectedActiveOrderId) || latestActiveOrder;
  const progressSteps = selectedActiveOrder ? getProgressSteps(selectedActiveOrder.status) : getProgressSteps('CONFIRMED');
  const orderQty = Number(latestSummaryOrder?.water_quantity || 0);
  const subtotal = orderQty * PRICE_PER_GALLON;
  const total = Number(latestSummaryOrder?.total_amount ?? subtotal + DELIVERY_FEE);
  const etaText = getDisplayEtaText(selectedActiveOrder);
  const isInitialLoading = loading && orders.length === 0;
  const totalHistoryPages = Math.max(1, Math.ceil(recentHistory.length / HISTORY_PER_PAGE));
  const historyStart = (historyPage - 1) * HISTORY_PER_PAGE;
  const paginatedHistory = recentHistory.slice(historyStart, historyStart + HISTORY_PER_PAGE);

  useEffect(() => {
    setHistoryPage((prev) => Math.min(prev, totalHistoryPages));
  }, [totalHistoryPages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const riderName = selectedActiveOrder?.assigned_rider_name;
  const initials = useMemo(() => {
    if (!riderName) return 'CF';
    return riderName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [riderName]);

  return {
    user,
    loading,
    error,
    latestActiveOrder,
    activeOrders,
    selectedActiveOrder,
    selectedActiveOrderId,
    setSelectedActiveOrderId,
    latestSummaryOrder,
    recentHistory,
    riderConversation,
    progressSteps,
    subtotal,
    total,
    etaText,
    isInitialLoading,
    totalHistoryPages,
    historyPage,
    setHistoryPage,
    paginatedHistory,
    getGreeting,
    initials,
    money,
    fmtDate,
    STATUS_LABEL,
    riderName,
    orderQty,
    HISTORY_PER_PAGE,
    ACTIVE_ORDER_STATUSES,
    HISTORY_STATUSES,
    navigate
  };
};

export default useDelivery;
