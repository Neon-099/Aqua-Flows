import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Send, Droplet, Smile, Info, CheckCheck, LayoutDashboard, ClipboardList, MessageSquare, MapPin, Archive, Inbox, CircleHelp } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { listConversations, getMessages, sendMessage as sendMessageApi, markSeen } from '../utils/chatApi';
import { createChatSocket, emitWithAck } from '../utils/socket';
import { formatConversationTime, formatMessageTime } from '../utils/messagingFormatters';

const title = (v) => (v ? `${v[0].toUpperCase()}${v.slice(1)}` : 'User');
const short = (id) => String(id || '').slice(0, 8);
const FINISHED_ORDER_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

const mapConversation = (row, myId) => {
  const participants = Array.isArray(row?.participants) ? row.participants : [];
  const other = participants.find((p) => p.userId !== myId) || participants[0] || {};
  const role = other.role || 'user';
  const name = other.name || `${title(role)} ${short(other.userId)}`;
  const label = row.counterpartyLabel || title(role);
  const counterpartyRole = row.counterpartyRole || role;
  const shortOrderId = row.orderId ? String(row.orderId).slice(0, 8) : null;
  return {
    id: row._id,
    name,
    role: label,
    otherRole: counterpartyRole,
    orderId: shortOrderId ? `#${shortOrderId}` : 'No order',
    lastMsg: row.lastMessage || 'No messages yet',
    time: formatConversationTime(row.lastMessageAt || row.updatedAt || row.createdAt),
    status: row.orderStatus || 'Linked chat',
    archivedAt: row.archivedAt || null,
    unreadCount: row.unreadCount || 0,
    isRiderAssigned: Boolean(row.isRiderAssigned),
    isRiderConversation: counterpartyRole === 'rider',
    initials: name.charAt(0).toUpperCase(),
  };
};

const mapMessage = (row, myId) => ({
  id: row._id,
  text: row.message,
  senderId: row.senderId,
  receiverId: row.receiverId,
  seenAt: row.seenAt || null,
  timestamp: row.timestamp,
  mine: row.senderId === myId,
});

const pickPreferredConversationId = ({ mapped, prevId, userRole }) => {
  if (!Array.isArray(mapped) || mapped.length === 0) return null;

  if (!prevId) return mapped[0]?.id || null;

  const prev = prevId ? mapped.find((c) => c.id === prevId) : null;
  const isCustomerView = userRole !== 'rider';
  const staffConversation = mapped.find((c) => c.otherRole === 'staff' && !c.archivedAt);

  if (prev) {
    const shouldRerouteToStaff =
      isCustomerView &&
      prev.otherRole === 'rider' &&
      FINISHED_ORDER_STATUSES.has(String(prev.status || '').toUpperCase());

    if (!shouldRerouteToStaff) return prev.id;
    if (staffConversation) return staffConversation.id;
  }

  if (isCustomerView && staffConversation) return staffConversation.id;
  return mapped[0]?.id || null;
};

export default function Message() {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('authToken');
  const socketRef = useRef(null);
  const stopTypingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimersRef = useRef({});

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [showArchiveHelp, setShowArchiveHelp] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingMap, setTypingMap] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const selected = useMemo(() => conversations.find((c) => c.id === selectedId) || null, [conversations, selectedId]);
  const unread = useMemo(() => conversations.reduce((a, c) => a + (c.unreadCount || 0), 0), [conversations]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = conversations;
    if (!showArchived) {
      if (user?.role === 'rider') {
        if (activeFilter === 'Customers') base = base.filter((c) => c.otherRole === 'customer');
        if (activeFilter === 'Staff') base = base.filter((c) => c.otherRole === 'staff');
      } else {
        if (activeFilter === 'Staff') base = base.filter((c) => c.otherRole === 'staff');
        if (activeFilter === 'Riders') base = base.filter((c) => c.otherRole === 'rider');
      }
    }
    if (!q) return base;
    return base.filter((c) => c.name.toLowerCase().includes(q) || c.orderId.toLowerCase().includes(q) || c.lastMsg.toLowerCase().includes(q));
  }, [conversations, search, activeFilter, user?.role, showArchived]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?._id) return;
    const loadConversations = async (showLoading = false) => {
      if (showLoading) setLoadingConversations(true);
      try {
        const rows = await listConversations(50, { archived: showArchived });
        const mapped = rows.map((r) => mapConversation(r, user._id));
        setConversations(mapped);
        setSelectedId((prev) => {
          return pickPreferredConversationId({
            mapped,
            prevId: prev,
            userRole: user?.role,
          });
        });
      } catch (e) {
        setError(e.message || 'Failed to load conversations');
      } finally {
        if (showLoading) setLoadingConversations(false);
      }
    };
    loadConversations(true);
    const interval = setInterval(() => {
      loadConversations(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [user?._id, showArchived]);

  useEffect(() => {
    if (!selectedId || !user?._id) return;
    const loadConversationMessages = async (showLoading = false) => {
      if (showLoading) setLoadingMessages(true);
      try {
        const rows = await getMessages(selectedId, 100);
        setMessages(rows.map((m) => mapMessage(m, user._id)));
        await markSeen(selectedId);
        setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)));
      } catch (e) {
        setError(e.message || 'Failed to load messages');
      } finally {
        if (showLoading) setLoadingMessages(false);
      }
    };
    loadConversationMessages(true);
    const interval = setInterval(() => {
      loadConversationMessages(false);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedId, user?._id]);

  useEffect(() => {
    if (!token || !user?._id) return undefined;
    const socket = createChatSocket(token);
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', (incoming) => {
      setConversations((prev) => {
        const found = prev.find((c) => c.id === incoming.conversationId);
        if (!found) return prev;
        const updated = prev.map((c) =>
          c.id === incoming.conversationId
            ? { ...c, lastMsg: incoming.message, time: formatConversationTime(incoming.timestamp), unreadCount: selectedId === incoming.conversationId ? 0 : (c.unreadCount || 0) + 1 }
            : c
        );
        const target = updated.find((c) => c.id === incoming.conversationId);
        return [target, ...updated.filter((c) => c.id !== incoming.conversationId)];
      });
      if (incoming.conversationId === selectedId) {
        setMessages((prev) => (prev.some((m) => m.id === incoming._id) ? prev : [...prev, mapMessage(incoming, user._id)]));
      }
    });
    socket.on('chat:typing', (incoming) => {
      setTypingMap((prev) => ({ ...prev, [incoming.conversationId]: Boolean(incoming.isTyping) }));
      if (typingTimersRef.current[incoming.conversationId]) clearTimeout(typingTimersRef.current[incoming.conversationId]);
      typingTimersRef.current[incoming.conversationId] = setTimeout(() => setTypingMap((prev) => ({ ...prev, [incoming.conversationId]: false })), 1200);
    });
    socket.on('chat:seen', (incoming) => {
      if (incoming.conversationId !== selectedId) return;
      setMessages((prev) => prev.map((m) => (m.mine && m.receiverId === incoming.userId ? { ...m, seenAt: incoming.seenAt || new Date().toISOString() } : m)));
    });
    return () => {
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      socket.disconnect();
    };
  }, [token, user?._id, selectedId]);

  useEffect(() => {
    if (!selectedId || !socketRef.current?.connected) return;
    emitWithAck(socketRef.current, 'chat:join', { conversationId: selectedId }).catch(() => {});
  }, [selectedId, connected]);

  const emitTyping = (isTyping) => {
    if (!selectedId || !socketRef.current?.connected) return;
    socketRef.current.emit('chat:typing', { conversationId: selectedId, isTyping }, () => {});
  };

  const onChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => emitTyping(false), 900);
  };

  const onSend = async () => {
    const message = text.trim();
    if (!message || !selectedId || selected?.archivedAt) return;
    setText('');
    emitTyping(false);
    try {
      if (socketRef.current?.connected) {
        await emitWithAck(socketRef.current, 'chat:message', { conversationId: selectedId, message });
      } else {
        const saved = await sendMessageApi(selectedId, message);
        setMessages((prev) => [...prev, mapMessage(saved, user?._id)]);
      }
    } catch (e) {
      setError(e.message || 'Failed to send');
    }
  };

  if (!user) return <div className="h-screen w-screen flex items-center justify-center"><Link to="/auth" className="text-blue-600 font-semibold">Sign in to access messages</Link></div>;

  const isRider = user?.role === 'rider';

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-slate-700 overflow-hidden">
      <nav className="flex items-center justify-between px-12 py-4 border-b border-slate-100 shrink-0 w-full" style={{ backgroundColor: '#E9F1F9' }}>
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>
        {!isRider && (
          <div className="hidden md:flex gap-4">
            <Link to="/home">
              <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
                <LayoutDashboard size={18} /> Dashboard
              </button>
            </Link>
            <Link to="/orders">
              <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
                <ClipboardList size={18} /> Orders
              </button>
            </Link>
            <Link to="/messages">
              <button className="flex items-center gap-2 bg-white text-slate-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
                <MessageSquare size={18} /> Messages
              </button>
            </Link>
            <Link to="/track">
              <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
                <MapPin size={18} /> Track Delivery
              </button>
            </Link>
          </div>
        )}
        {isRider && (
          <div className="hidden md:flex gap-4">
            <Link to="/rider/orders">
              <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
                <ClipboardList size={18} /> My Orders
              </button>
            </Link>
            <Link to="/rider/messages">
              <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${location.pathname === '/rider/messages' ? 'bg-white text-slate-800 shadow-sm' : 'bg-white/50 text-slate-600 hover:bg-white/80'}`}>
                <MessageSquare size={18} /> Messages
              </button>
            </Link>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-xs text-slate-400 uppercase font-bold mt-1">{connected ? 'Realtime online' : 'Offline mode'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'user'}`}
              className="w-full h-full object-cover"
              alt={user.name || 'profile'} 
            />
          </div>
        </div>
      </nav>
      <main className="flex flex-1 overflow-hidden w-full">
        <div className="w-[400px] bg-white border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-slate-800">Conversations</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowArchived((v) => !v);
                    setShowArchiveHelp(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  title={showArchived ? 'Show inbox' : 'Show archive'}
                >
                  {showArchived ? <Inbox size={14} /> : <Archive size={14} />}
                  {showArchived ? 'Inbox' : 'Archive'}
                </button>
                {showArchived && (
                  <button
                    type="button"
                    onClick={() => setShowArchiveHelp((v) => !v)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                    title="Archive help"
                  >
                    <CircleHelp size={14} />
                  </button>
                )}
                <span className="text-xs font-medium text-slate-400">{unread} unread</span>
              </div>
            </div>
            {showArchived && showArchiveHelp && (
              <div className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Archived conversations are read-only and are automatically deleted after 7 days.
              </div>
            )}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-3 text-slate-300" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search by name or order" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-100 outline-none" />
            </div>
            {!showArchived && (
              <div className="flex items-center gap-2 flex-wrap">
                {(isRider ? ['All', 'Customers', 'Staff'] : ['All', 'Staff', 'Riders']).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${activeFilter === filter ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-y-auto flex-1 px-4 pb-4">
            {loadingConversations && <p className="text-sm text-slate-400 px-2">Loading conversations...</p>}
            {!loadingConversations && filtered.length === 0 && <p className="text-sm text-slate-400 px-2">No conversations</p>}
            {filtered.map((chat) => {
              const active = chat.id === selectedId;
              return (
                <button key={chat.id} type="button" onClick={() => setSelectedId(chat.id)} className={`w-full text-left p-4 mb-2 rounded-2xl border transition-all ${active ? 'bg-white border-blue-400 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${active ? 'bg-slate-700' : 'bg-slate-400'} text-white rounded-lg flex items-center justify-center font-bold`}>{chat.initials}</div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{chat.name} • {chat.role}</p>
                        <p className="text-[11px] text-slate-400">{chat.time}</p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{chat.unreadCount}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-1">"{chat.lastMsg}"</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    {chat.orderId} • {chat.status}
                    {chat.isRiderConversation && chat.isRiderAssigned ? ' • ASSIGNED TO YOUR ORDER' : ''}
                    {chat.archivedAt ? ' • ARCHIVED' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col min-w-0">
          {!selected && <div className="h-full flex items-center justify-center text-slate-400">Select a conversation</div>}
          {selected && (
            <>
              <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xl">{selected.initials}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selected.name} • {selected.role}</h3>
                    <p className="text-xs text-slate-400">
                      Order {selected.orderId}
                      {selected.isRiderConversation && selected.isRiderAssigned ? ' • Assigned rider' : ''}
                    </p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase">{selected.status}</span>
              </div>
              {selected.archivedAt && (
                <div className="px-8 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border-t border-amber-100">
                  <span className="inline-flex items-center gap-1.5"><Archive size={14} /> Archived conversation</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-10 py-6 space-y-4">
                <div className="bg-blue-50/50 text-blue-600 p-3 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2">
                  <Info size={16} /> Messages are linked to {selected.orderId}.
                </div>
                {loadingMessages && <p className="text-sm text-slate-400">Loading messages...</p>}
                {!loadingMessages && messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col gap-1 ${m.mine ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 max-w-[520px] text-sm leading-relaxed ${m.mine ? 'bg-blue-600 text-white rounded-3xl rounded-br-none' : 'bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm'}`}>{m.text}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      {formatMessageTime(m.timestamp)}
                      {m.mine && <><CheckCheck size={12} className={m.seenAt ? 'text-blue-500' : 'text-slate-300'} />{m.seenAt ? 'Read' : 'Sent'}</>}
                    </div>
                  </div>
                ))}
                {typingMap[selectedId] && <p className="text-xs text-slate-400 italic">Typing...</p>}
                <div ref={bottomRef} />
              </div>

              <div className="p-6 bg-white border-t border-slate-50">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-blue-400 focus-within:ring-4 ring-blue-50">
                  <button type="button" className="text-slate-400"><Smile size={20} /></button>
                  <input value={text} onChange={onChange} disabled={Boolean(selected.archivedAt)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())} type="text" placeholder={selected.archivedAt ? 'Archived conversations are read-only.' : 'Type a message...'} className="flex-1 py-3 text-sm outline-none bg-transparent disabled:text-slate-400" />
                  <button type="button" disabled={Boolean(selected.archivedAt)} onClick={onSend} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl flex items-center gap-2 font-bold px-5 disabled:bg-slate-300 disabled:hover:bg-slate-300"><Send size={16} />Send</button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
