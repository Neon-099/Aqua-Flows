import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, MessageSquare, MapPin, Droplet,
  CheckCircle2, Package, RefreshCw, Truck, Home, Phone, Clock,
  CircleDot
} from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { apiRequest } from '../utils/api';
import { listConversations } from '../utils/chatApi';

import Header from '../components/Header'
import { Skeleton, SkeletonGroup } from '../components/WireframeSkeleton';

const ACTIVE_ORDER_STATUSES = ['CONFIRMED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PENDING_PAYMENT'];
const HISTORY_STATUSES = ['COMPLETED', 'CANCELLED'];

const PRICE_PER_GALLON = 15;
const DELIVERY_FEE = 5;

const STATUS_LABEL = {
  PENDING: 'Pending',
  CONFIRMED: 'Accepted',
  PICKED_UP: 'In Process',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
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
  if (!order) return 'Wait for confirmation';
  if (order.status === 'PENDING_PAYMENT' || order.status === 'COMPLETED') return 'No active ETA';
  if (order.eta_text) return order.eta_text;
  if (order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY') {
    return 'ETA will appear once rider picks up';
  }
  return 'Wait for confirmation';
};

const getProgressSteps = (status) => {
  const steps = [
    { label: "Confirmed", icon: CheckCircle2 },
    { label: "Gallon Pickup", icon: Package },
    { label: "Refilling in Progress", icon: RefreshCw },
    { label: "Delivery in Progress", icon: Truck },
    { label: "Delivered", icon: Home },
    { label: "Pending Payment", icon: Clock },
    { label: "Completed", icon: CheckCircle2 },
  ];

  const currentIndex = (() => {
    if (status === 'CONFIRMED') return 0;
    if (status === 'PICKED_UP') return 2;
    if (status === 'OUT_FOR_DELIVERY') return 3;
    if (status === 'DELIVERED') return 4;
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

const Delivery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const latestActiveOrder = useMemo(() => {
    const active = sortByRecent(orders).filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
    return active[0] || null;
  }, [orders]);

  const recentHistory = useMemo(() => {
    return sortByRecent(orders)
      .filter((o) => HISTORY_STATUSES.includes(o.status))
      .slice(0, 5);
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

  const progressSteps = latestActiveOrder ? getProgressSteps(latestActiveOrder.status) : getProgressSteps('CONFIRMED');
  const orderQty = Number(latestSummaryOrder?.water_quantity || 0);
  const subtotal = orderQty * PRICE_PER_GALLON;
  const total = Number(latestSummaryOrder?.total_amount ?? subtotal + DELIVERY_FEE);
  const etaText = getDisplayEtaText(latestActiveOrder);
  const isInitialLoading = loading && orders.length === 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Standardized Navigation */}
      <Header 
        name={user?.name || 'customer'}
        image={user?.image || 'customer'}/>

      {/* Main Content Area */}
      <div className="flex-1 w-full px-12 py-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            {`${getGreeting()}, ${user?.name || 'Customer'}!`}
          </h1>
          <p className="text-slate-500 text-lg mt-2">
            {latestActiveOrder 
              ? 'Your water refill is on its way. Stay hydrated!'
              : 'No active delivery. Place an order to get started.'}
          </p>
        </header>

        {/* Grid System: 12-column layout */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* Main Column (Spans 8 of 12 columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            
            {isInitialLoading && (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <SkeletonGroup className="space-y-8">
                  <div className="flex justify-between items-start">
                    <SkeletonGroup>
                      <Skeleton className="h-8 w-56" />
                      <Skeleton className="h-4 w-40" />
                    </SkeletonGroup>
                    <Skeleton className="h-9 w-32 rounded-full" />
                  </div>
                  <Skeleton className="h-40 w-full rounded-3xl" />
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-44" />
                      </SkeletonGroup>
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-24 rounded-2xl" />
                      <Skeleton className="h-12 w-28 rounded-2xl" />
                    </div>
                  </div>
                </SkeletonGroup>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2.5rem]">
                <p className="text-rose-600 font-semibold">{error}</p>
              </div>
            )}

            {!loading && !error && latestActiveOrder && (
              /* Enhanced Status Card */
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">
                      Order #{latestActiveOrder.order_code || String(latestActiveOrder._id).slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-slate-400 font-medium mt-1">
                      {fmtDate(latestActiveOrder.created_at)}
                    </p>
                  </div>
                  <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-emerald-100 animate-pulse">
                    {STATUS_LABEL[latestActiveOrder.status] || 'In Transit'}
                  </span>
                </div>

                {/* Enhanced Progress Bar with Icons */}
                <div className="relative mb-24 px-4">
                  {/* Background line */}
                  <div className="absolute top-6 left-0 w-full h-2 bg-slate-100 z-0 rounded-full"></div>
                  {/* Progress line with gradient */}
                  <div 
                    className="absolute top-6 left-0 h-2 bg-gradient-to-r from-blue-500 to-blue-600 z-0 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(progressSteps.filter(s => s.active).length / progressSteps.length) * 100}%` 
                    }}
                  ></div>
                  
                  <div className="relative flex justify-between items-start">
                    {progressSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-lg ${
                            step.active 
                              ? step.current
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-110 animate-pulse ring-4 ring-blue-200' 
                                : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-105'
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}>
                            <Icon size={20} className={step.active ? 'text-white' : 'text-slate-300'} />
                          </div>
                          <span className={`text-xs font-bold text-center w-28 leading-tight ${
                            step.active ? 'text-blue-600' : 'text-slate-300'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Driver Contact Section */}
                {latestActiveOrder.assigned_rider_name && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between border-2 border-blue-200/50 mt-16 shadow-sm">
                    <div className="flex items-center gap-6 mb-4 sm:mb-0">
                      <div className="relative">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${latestActiveOrder.assigned_rider_name}`}
                          className="w-20 h-20 rounded-full border-4 border-white shadow-lg" 
                          alt="driver" 
                        />
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-slate-800 text-xl">{latestActiveOrder.assigned_rider_name}</p>
                          <CircleDot size={16} className="text-emerald-500" fill="currentColor" />
                        </div>
                        <p className="text-blue-600 font-bold tracking-wide flex items-center gap-2">
                          <Truck size={16} />
                          {latestActiveOrder.assigned_rider_name} • Active
                        </p>
                        {etaText && (
                          <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-1">
                            <Clock size={14} />
                            ETA: {etaText}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate('/messages')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                      >
                        <MessageSquare size={18} /> Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && !latestActiveOrder && (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-black text-2xl text-slate-800 mb-2">No Active Delivery</h3>
                  <p className="text-slate-500 mb-6">You don't have any active orders at the moment.</p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    Place New Order
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              {isInitialLoading ? (
                <SkeletonGroup className="space-y-5">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-44" />
                        <Skeleton className="h-4 w-56" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-52" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                </SkeletonGroup>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl text-slate-800">Recent Activity</h3>
                    <button
                      onClick={() => navigate('/orders')}
                      className="text-blue-600 font-bold hover:underline text-sm"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentHistory.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-8">No order history yet.</p>
                    )}
                    {recentHistory.map((o) => (
                      <div key={o._id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <ClipboardList size={22} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-black text-lg text-slate-800">
                              {STATUS_LABEL[o.status] || o.status}
                            </p>
                            <p className="text-slate-400 text-sm font-semibold mt-1">
                              {fmtDate(o.created_at)} • Qty {o.water_quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-xl text-slate-700">{money(o.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar (Spans 4 of 12 columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* Reorder Card */}
            {isInitialLoading ? (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <SkeletonGroup>
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                </SkeletonGroup>
              </div>
            ) : (
              <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-black text-3xl mb-3">Running Low?</h3>
                  <p className="text-blue-100 text-base leading-relaxed mb-10 font-medium">
                    Reorder your usual refill with one tap.
                  </p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full bg-slate-900 text-blue-500 py-5 rounded-[1.5rem] font-black text-lg hover:bg-slate-800 transition-all"
                  >
                    + Order Water
                  </button>
                </div>
                <div className="absolute -top-10 -right-10 text-white/10 text-[12rem] rotate-12">💧</div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              
              {isInitialLoading ? (
                <SkeletonGroup>
                  <Skeleton className="h-6 w-40 mx-auto" />
                  <div className="flex gap-6 mb-3">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <SkeletonGroup className="flex-1">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </SkeletonGroup>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-28 ml-auto" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </SkeletonGroup>
              ) : (
                <>
                  <h3 className="font-black text-xl text-slate-800 mb-8 uppercase tracking-widest text-center">
                    Order Summary
                  </h3>
                  {!latestSummaryOrder && <p className="text-slate-400 text-sm text-center">No orders yet.</p>}
                  {latestSummaryOrder && (
                    <>
                      <div className="flex gap-6 mb-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner shrink-0">
                          <Droplet fill="currentColor" size={32} />
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-xl text-slate-800">
                            {latestSummaryOrder.gallon_type === 'SLIM' ? 'Gallon Slim (Refill)' : '5 Gallon Round (Refill)'}
                          </p>
                          <p className="text-slate-400 text-sm font-bold mt-1">
                            Quantity: {latestSummaryOrder.water_quantity}
                          </p>
                          <p className="text-slate-400 text-xs font-bold mt-1">
                            {STATUS_LABEL[latestSummaryOrder.status] || latestSummaryOrder.status}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 text-sm pt-8 border-t border-slate-100">
                        <div className="flex justify-between text-slate-400 font-bold text-lg">
                          <span>Subtotal</span>
                          <span className="text-slate-800">{money(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold text-lg">
                          <span>Delivery fee</span>
                          <span className="text-slate-800">{money(DELIVERY_FEE)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 text-3xl pt-2">
                          <span>Total</span>
                          <span>{money(total)}</span>
                        </div>
                      </div>
                      <div className="mt-8 p-4 bg-blue-50 rounded-2xl text-blue-600 text-xs font-black text-center border border-blue-100 uppercase tracking-widest">
                        Payment: {latestSummaryOrder.payment_method}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mini Messages */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              {isInitialLoading ? (
                <SkeletonGroup>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                </SkeletonGroup>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xl text-slate-800">Messages</h3>
                    <MessageSquare size={20} className="text-slate-300" />
                  </div>
                  {riderConversation ? (
                    <>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {riderConversation.counterpartyLabel || 'Rider'}
                        </p>
                        <p className="text-sm text-slate-500 italic mt-2 leading-relaxed font-medium">
                          "{riderConversation.lastMessage || 'No recent rider messages.'}"
                        </p>
                        {riderConversation.lastMessageAt && (
                          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                            <Clock size={13} /> {fmtDate(riderConversation.lastMessageAt)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                      >
                        Open Message Station
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400 text-sm mb-4">No rider messages yet.</p>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                      >
                        Open Message Station
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Delivery;
