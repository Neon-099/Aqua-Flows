// web-client/src/page/Home.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  MessageSquare,
  MapPin,
  Droplet,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { apiRequest } from '../utils/api';
import { listConversations } from '../utils/chatApi';
import Header from '../components/Header'

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

const STATUS_BADGE = {
  CONFIRMED: 'bg-amber-50 text-amber-700 border-amber-200',
  PICKED_UP: 'bg-blue-50 text-blue-700 border-blue-200',
  OUT_FOR_DELIVERY: 'bg-sky-50 text-sky-700 border-sky-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING_PAYMENT: 'bg-violet-50 text-violet-700 border-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
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
  if (!order) return 'No active ETA';
  if (order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY') {
    const min = Number(order.eta_minutes_min);
    const max = Number(order.eta_minutes_max);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      const low = Math.min(min, max);
      const high = Math.max(min, max);
      const picked = Math.floor(Math.random() * (high - low + 1)) + low;
      return `${picked} mins`;
    }
  }
  return order.eta_text || 'ETA will appear once rider picks up';
};

const getCounterparty = (conversation, myUserId) => {
  const other = (conversation?.participants || []).find((p) => p.userId !== myUserId);
  return {
    name: other?.name || 'Assigned Rider',
    role: conversation?.counterpartyLabel || 'Rider',
  };
};

const Home = () => {
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
        setError(e.message || 'Failed to load home data');
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };

    load(true);
    const interval = setInterval(() => {
      load(false);
    }, 5000); //LOAD EVERY 5 SECONDS
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

  const riderMeta = getCounterparty(riderConversation, user?._id);

  const orderQty = Number(latestSummaryOrder?.water_quantity || 0);
  const subtotal = orderQty * PRICE_PER_GALLON;
  const total = Number(latestSummaryOrder?.total_amount ?? subtotal + DELIVERY_FEE);
  const etaText = getDisplayEtaText(latestActiveOrder);

  return (
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-700 overflow-hidden flex flex-col">
      <Header 
        name={user?.name || 'customer'}
        image={user?.image || 'customer'}/>

      <main className="flex-1 overflow-y-auto px-12 py-8 grid grid-cols-12 gap-10 w-full">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              {`Good day, ${user?.name || 'Customer'}!`}
            </h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">
              {latestActiveOrder
                ? 'Your current order is being processed.'
                : 'No active order yet. Place one anytime.'}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                <MapPin size={24} />
              </div>
              <h2 className="font-black text-2xl text-slate-800">Delivery Details</h2>
            </div>

            <div className="bg-blue-50/50 rounded-[2rem] py-14 flex flex-col items-center justify-center border border-blue-100 mb-10">
              <span className="text-5xl font-black text-blue-600">{etaText}</span>
              <span className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-[0.2em]">
                Estimated Arrival Time
              </span>
            </div>

            <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div>
                <p className="font-black text-2xl text-slate-800">
                  {latestActiveOrder?.assigned_rider_name || 'Rider not assigned yet'}
                </p>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">
                  {latestActiveOrder?.status ? STATUS_LABEL[latestActiveOrder.status] : 'Waiting for assignment'}
                </p>
              </div>
              <button
                onClick={() => navigate('/messages')}
                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm"
              >
                <MessageSquare size={18} /> Message
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-2xl text-slate-800">Recent Activity</h2>
              <button
                onClick={() => navigate('/orders')}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentHistory.length === 0 && (
                <p className="text-slate-400 text-sm">No order history yet.</p>
              )}
              {recentHistory.map((o) => (
                <div key={o._id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <ClipboardList size={22} className="text-slate-400" />
                    <div>
                      <p className="font-black text-lg text-slate-800">
                        {STATUS_LABEL[o.status] || o.status}
                      </p>
                      <p className="text-slate-400 text-sm font-semibold mt-1">
                        {fmtDate(o.created_at)} • Qty {o.water_quantity}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs border px-3 py-1 rounded-full font-bold ${STATUS_BADGE[o.status] || STATUS_BADGE.PENDING}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-200">
            <h3 className="font-black text-3xl mb-3">Running Low?</h3>
            <p className="text-blue-100 text-base leading-relaxed mb-10 font-medium">
              Reorder your usual refill with one tap.
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-slate-900 text-blue-500 py-5 rounded-[1.5rem] font-black text-lg"
            >
              + Order Water
            </button>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
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
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl text-slate-800">Messages</h3>
              <MessageSquare size={20} className="text-slate-300" />
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {riderMeta.name} ({riderMeta.role})
              </p>
              <p className="text-sm text-slate-500 italic mt-2 leading-relaxed font-medium">
                "{riderConversation?.lastMessage || 'No recent rider messages.'}"
              </p>
              {riderConversation?.lastMessageAt && (
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <Clock size={13} /> {fmtDate(riderConversation.lastMessageAt)}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/messages')}
              className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em]"
            >
              Open Message Station
            </button>
          </div>

          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
          {loading && <p className="text-slate-400 text-sm">Loading home data...</p>}
        </div>
      </main>
    </div>
  );
};

export default Home;
