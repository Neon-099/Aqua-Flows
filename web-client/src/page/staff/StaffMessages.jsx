import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCheck,
  CircleDot,
  Info,
  MessageSquare,
  Search,
  Send,
  Droplet,
  ClipboardList,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { listConversations, getMessages, sendMessage as sendMessageApi, markSeen } from '../../utils/chatApi';
import { createChatSocket, emitWithAck } from '../../utils/socket';
import { formatConversationTime, formatMessageTime } from '../../utils/messagingFormatters';

const title = (v) => (v ? `${v[0].toUpperCase()}${v.slice(1)}` : 'User');
const short = (id) => String(id || '').slice(0, 6);

const getAvatarInitials = (name) => {
  const cleaned = String(name || '').split('•')[0].trim();
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const mapConversation = (row, myId) => {
  const participants = Array.isArray(row?.participants) ? row.participants : [];
  const other = participants.find((p) => p.userId !== myId) || participants[0] || {};
  const role = row.counterpartyRole || other.role || 'user';
  const name = other.name || `${title(role)} ${short(other.userId)}`;

  return {
    id: row._id,
    name: `${name} • ${title(role)}`,
    otherRole: role,
    preview: row.lastMessage || 'No messages yet',
    time: formatConversationTime(row.lastMessageAt || row.updatedAt || row.createdAt),
    unread: row.unreadCount || 0,
    orderTag: row.orderId ? `#${String(row.orderId).slice(0, 8)} • Linked` : 'No linked order',
    orderLine: row.orderId ? `Order #${String(row.orderId).slice(0, 8)}` : 'No linked order',
    statusChip: row.orderStatus ? title(row.orderStatus) : 'Linked chat',
    eta: row.orderEta || 'ETA: --',
    lastUpdated: row.lastMessageAt
      ? `Last updated ${formatConversationTime(row.lastMessageAt)}`
      : 'No recent updates',
  };
};

const mapMessage = (row, myId) => ({
  id: row._id,
  text: row.message,
  senderId: row.senderId,
  receiverId: row.receiverId,
  seenAt: row.seenAt || null,
  timestamp: row.timestamp,
  fromMe: row.senderId === myId,
});

const StaffMessages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('authToken');

  const socketRef = useRef(null);
  const stopTypingTimerRef = useRef(null);
  const typingTimersRef = useRef({});
  const bottomRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingMap, setTypingMap] = useState({});
  const [activeFilter, setActiveFilter] = useState('All');

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unread || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = conversations;

    if (activeFilter === 'Unread') base = base.filter((conversation) => conversation.unread > 0);
    if (activeFilter === 'Riders') base = base.filter((conversation) => conversation.otherRole === 'rider');
    if (activeFilter === 'Customers') base = base.filter((conversation) => conversation.otherRole === 'customer');

    if (!q) return base;
    return base.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(q) ||
        conversation.orderTag.toLowerCase().includes(q) ||
        conversation.preview.toLowerCase().includes(q)
    );
  }, [conversations, search, activeFilter]);

  const navButtonClass = (isActive) =>
    isActive
      ? 'flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all'
      : 'flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all';

  const emitTyping = (isTyping) => {
    if (!activeConversationId || !socketRef.current?.connected) return;
    socketRef.current.emit('chat:typing', { conversationId: activeConversationId, isTyping }, () => {});
  };

  const onDraftChange = (event) => {
    setDraft(event.target.value);
    emitTyping(true);
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => emitTyping(false), 900);
  };

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !activeConversationId) return;
    setDraft('');
    emitTyping(false);
    try {
      if (socketRef.current?.connected) {
        await emitWithAck(socketRef.current, 'chat:message', { conversationId: activeConversationId, message });
      } else {
        const saved = await sendMessageApi(activeConversationId, message);
        setMessages((prev) => [...prev, mapMessage(saved, user?._id)]);
      }
    } catch (e) {
      setError(e.message || 'Failed to send message');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      setLoadingConversations(true);
      try {
        const rows = await listConversations(50);
        const mapped = rows.map((row) => mapConversation(row, user._id));
        setConversations(mapped);
        setActiveConversationId((prev) => prev || mapped[0]?.id || null);
      } catch (e) {
        setError(e.message || 'Failed to load conversations');
      } finally {
        setLoadingConversations(false);
      }
    })();
  }, [user?._id]);

  useEffect(() => {
    if (!activeConversationId || !user?._id) return;
    (async () => {
      setLoadingMessages(true);
      try {
        const rows = await getMessages(activeConversationId, 100);
        setMessages(rows.map((row) => mapMessage(row, user._id)));
        await markSeen(activeConversationId);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId ? { ...conversation, unread: 0 } : conversation
          )
        );
      } catch (e) {
        setError(e.message || 'Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [activeConversationId, user?._id]);

  useEffect(() => {
    if (!token || !user?._id) return undefined;
    const socket = createChatSocket(token);
    const timers = typingTimersRef.current;
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:message', (incoming) => {
      setConversations((prev) => {
        const found = prev.find((conversation) => conversation.id === incoming.conversationId);
        if (!found) return prev;
        const updated = prev.map((conversation) =>
          conversation.id === incoming.conversationId
            ? {
                ...conversation,
                preview: incoming.message,
                time: formatConversationTime(incoming.timestamp),
                lastUpdated: `Last updated ${formatConversationTime(incoming.timestamp)}`,
                unread: activeConversationId === incoming.conversationId ? 0 : (conversation.unread || 0) + 1,
              }
            : conversation
        );
        const target = updated.find((conversation) => conversation.id === incoming.conversationId);
        return target ? [target, ...updated.filter((conversation) => conversation.id !== incoming.conversationId)] : updated;
      });

      if (incoming.conversationId === activeConversationId) {
        setMessages((prev) => (prev.some((message) => message.id === incoming._id) ? prev : [...prev, mapMessage(incoming, user._id)]));
      }
    });

    socket.on('chat:typing', (incoming) => {
      setTypingMap((prev) => ({ ...prev, [incoming.conversationId]: Boolean(incoming.isTyping) }));
      if (timers[incoming.conversationId]) clearTimeout(timers[incoming.conversationId]);
      timers[incoming.conversationId] = setTimeout(
        () => setTypingMap((prev) => ({ ...prev, [incoming.conversationId]: false })),
        1200
      );
    });

    socket.on('chat:seen', (incoming) => {
      if (incoming.conversationId !== activeConversationId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.fromMe && message.receiverId === incoming.userId
            ? { ...message, seenAt: incoming.seenAt || new Date().toISOString() }
            : message
        )
      );
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
      socket.disconnect();
    };
  }, [token, user?._id, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !socketRef.current?.connected) return;
    emitWithAck(socketRef.current, 'chat:join', { conversationId: activeConversationId }).catch(() => {});
  }, [activeConversationId, connected]);

  return (
    <div className="min-h-screen w-screen bg-slate-100 text-slate-700">
      
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow Manager</span>
        </div>

        <div className="hidden md:flex gap-4">
          <Link to="/staff/orders">
            <button className={navButtonClass(location.pathname === '/staff/orders')}>
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/staff/messages">
            <button className={navButtonClass(location.pathname === '/staff/messages')}>
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">{connected ? 'Realtime online' : 'Offline mode'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
        </div>
      </nav>
      
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800">Messages</h1>
            <p className="text-slate-500 mt-1 text-lg">
              Stay in touch with your water station and riders for every order.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-slate-400 font-semibold mt-3">
            <CircleDot size={16} className="text-emerald-600 fill-emerald-600" />
            <span>All conversations are linked to their orders for easy tracking.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
          <aside className="bg-white/85 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-700">Conversations</h2>
                <span className="text-slate-400 font-semibold text-lg">{totalUnread} unread</span>
              </div>
              <p className="text-slate-400 mt-2 font-semibold">Select a chat to view details and reply.</p>

              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="text"
                  placeholder="Search by name, order ID, or address"
                  className="w-full bg-transparent outline-none font-semibold placeholder:text-slate-400"
                />
              </div>

              <div className="mt-5 flex items-center gap-2 flex-wrap">
                {['All', 'Customers', 'Riders', 'Unread'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-[620px] overflow-y-auto">
              {loadingConversations && <p className="text-sm text-slate-400 p-3">Loading conversations...</p>}
              {!loadingConversations && filteredConversations.length === 0 && <p className="text-sm text-slate-400 p-3">No conversations found.</p>}
              {filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-colors ${
                      isActive
                        ? 'bg-sky-50 border-sky-100'
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {getAvatarInitials(conversation.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-700 leading-tight truncate">{conversation.name}</p>
                          <span className="text-slate-400 text-xs font-semibold shrink-0">{conversation.time}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-slate-400 text-sm font-semibold truncate">{conversation.preview}</p>
                          {conversation.unread > 0 && (
                            <span className="h-6 min-w-6 px-1 rounded-full bg-blue-600 text-white text-xs font-bold inline-flex items-center justify-center">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-slate-400 text-xs rounded-full bg-slate-100 px-3 py-1 inline-block">
                          {conversation.orderTag}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="bg-white/85 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[730px]">
            {!activeConversation && (
              <div className="h-full flex items-center justify-center text-slate-400 font-semibold">
                Select a conversation to start messaging.
              </div>
            )}
            {activeConversation && (
              <>
            <header className="p-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-slate-700 text-white text-sm font-bold flex items-center justify-center">
                    {getAvatarInitials(activeConversation?.name)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-700 text-3xl">{activeConversation?.name}</h3>
                    <p className="text-slate-400 font-semibold mt-1">{activeConversation?.orderLine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-bold">
                    {activeConversation?.statusChip}
                  </span>
                  <div className="hidden sm:block h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <p className="font-semibold">{activeConversation?.eta}</p>
                    <p className="text-sm font-semibold">{activeConversation?.lastUpdated}</p>
                  </div>
                </div>
              </div>
            </header>

            <div className="px-4 py-3 border-b border-slate-200 text-center text-slate-400 font-semibold">Today</div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div>
                <p className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-full font-semibold">
                  <Info size={16} />
                  Messages are linked to {activeConversation?.orderTag}.
                </p>
              </div>
              {loadingMessages && <p className="text-sm text-slate-400">Loading messages...</p>}
              {!loadingMessages && messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
              {messages.map((message) => {
                return (
                  <div key={message.id} className={message.fromMe ? 'text-right' : ''}>
                    <p
                      className={`inline-block rounded-2xl px-4 py-2 text-[15px] font-medium max-w-[85%] ${
                        message.fromMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {message.text}
                    </p>
                    <p className={`text-slate-400 mt-1 text-xs font-semibold ${message.fromMe ? 'flex items-center justify-end gap-1' : ''}`}>
                      {formatMessageTime(message.timestamp)}
                      {message.fromMe && (
                        <>
                          <CheckCheck size={14} className={message.seenAt ? 'text-blue-500' : 'text-slate-300'} />
                          <span>{message.seenAt ? 'Read' : 'Sent'}</span>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
              {typingMap[activeConversationId] && <p className="text-xs text-slate-400 italic">Typing...</p>}
              <div ref={bottomRef} />
            </div>

            <footer className="border-t border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 border border-slate-200 rounded-2xl bg-white px-4 py-3">
                  <UserRound size={18} className="text-slate-400" />
                  <input
                    value={draft}
                    onChange={onDraftChange}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    type="text"
                    placeholder="Type a message to your rider..."
                    className="w-full outline-none text-lg placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-lg"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap text-slate-400 font-semibold">
                <p>Linked order messages are visible to assigned participants.</p>
                <Link to="/staff/orders" className="text-blue-600 font-bold hover:underline">
                  View order details
                </Link>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </footer>
              </>
            )}
          </section>
        </div>

        <div className="xl:hidden mt-4 text-slate-400 font-semibold flex items-center gap-2">
          <MessageSquare size={16} />
          <span>All conversations are linked to their orders for easy tracking.</span>
        </div>
      </div>
    </div>
  );
};

export default StaffMessages;
