import { Link, useLocation } from 'react-router-dom';
import { useMemo, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Droplet,
  User,
  Bell,
} from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../contexts/AuthProvider';
import { apiRequest } from '../utils/api';

import NotificationModal from './customer/NotificationModal';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
];

const TOASTED_NOTIFICATION_IDS_KEY = 'customerToastedNotificationIds';
const MAX_TOASTED_NOTIFICATION_IDS = 200;

const getToastedNotificationIds = () => {
  try {
    const raw = sessionStorage.getItem(TOASTED_NOTIFICATION_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setToastedNotificationIds = (ids) => {
  try {
    sessionStorage.setItem(
      TOASTED_NOTIFICATION_IDS_KEY,
      JSON.stringify(ids.slice(-MAX_TOASTED_NOTIFICATION_IDS))
    );
  } catch {
    // silent
  }
};

const Header = ({ name }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModal, setNotificationModal] = useState(false);
  const toastedNotificationIdsRef = useRef(new Set(getToastedNotificationIds()));
  const userId = user?._id || user?.id;

  const profileName = user?.name || 'Customer';

  const initials = useMemo(() => {
    if (!profileName) return 'CF';
    return profileName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profileName]);

  const location = useLocation();

  const navButtonClass = (isActive) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
      isActive
        ? 'bg-white text-slate-800 shadow-sm'
        : 'bg-white/50 text-slate-600 hover:bg-white/80'
    }`;

  useEffect(() => {
    if (!userId || String(user?.role || '').toLowerCase() !== 'customer') return;

    const fetchUnread = async () => {
      try {
        const [countRes, unreadRes] = await Promise.all([
          apiRequest('/notifications/orders/unread-count'),
          apiRequest('/notifications/orders?unread=true&limit=20'),
        ]);
        const count = countRes?.data?.count ?? 0;
        const unreadRows = Array.isArray(unreadRes?.data) ? unreadRes.data : [];
        setUnreadCount(count);

        const nextToasts = unreadRows
          .filter((row) => row?._id && !toastedNotificationIdsRef.current.has(row._id))
          .sort(
            (a, b) =>
              new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
          );

        nextToasts.forEach((row) => {
          const isMessage = row?.type === 'message';
          toast.info(
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {row.title || (isMessage ? 'New message' : 'Order update')}
              </p>
              <p className="text-xs text-slate-600">
                {row.message || 'You have a new notification.'}
              </p>
            </div>,
            {
              toastId: `customer-notification-${row._id}`,
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
            }
          );
          toastedNotificationIdsRef.current.add(row._id);
        });

        if (nextToasts.length > 0) {
          setToastedNotificationIds(Array.from(toastedNotificationIdsRef.current));
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [userId, user?.role]);

  return (
    <nav
      className="flex items-center justify-between px-12 py-4 border-b border-slate-100 shrink-0 w-full"
      style={{ backgroundColor: '#E9F1F9' }}
    >
      <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
        <img src="AQ_LOGO.png" alt="" className='h-10 w-12' />
        <span>AquaFlow</span>
      </div>

      <div className="hidden md:flex gap-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link key={item.to} to={item.to}>
              <button className={navButtonClass(isActive)}
                >
                <Icon size={18} /> {item.label}
              </button>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-white/70 text-slate-700 flex items-center justify-center shadow-sm border border-slate-200"
            aria-label="Notifications"
            onClick={() => setNotificationModal(true)}
            >
            <Bell size={18} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-slate-900 leading-none">{name || 'Customer'}</p>
          <p className="text-xs text-slate-400 mt-1 upp ercase font-bold tracking-tighter">
            Household Account
          </p>
        </div>
        <div className="w-15 h-15 rounded-[1.6rem] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
          {initials}
        </div>
      </div>

        <NotificationModal 
          open={notificationModal}
          onChangeUnreadCount={setUnreadCount}
          onClose={() => setNotificationModal(false)}/>

    </nav>
  );
};

export default Header;
