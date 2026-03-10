import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../../utils/api';
import StaffNotificationModal from './StaffNotificationModal';

const TOASTED_NOTIFICATION_IDS_KEY = 'staffToastedNotificationIds';
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

const StaffNotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const toastedIdsRef = useRef(new Set(getToastedNotificationIds()));

  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      try {
        const [countRes, unreadRes] = await Promise.all([
          apiRequest('/notifications/messages/unread-count'),
          apiRequest('/notifications/messages?unread=true&limit=20'),
        ]);
        const count = countRes?.data?.count ?? 0;
        const unreadRows = Array.isArray(unreadRes?.data) ? unreadRes.data : [];
        setUnreadCount(count);

        const nextToasts = unreadRows
          .filter((row) => row?._id && !toastedIdsRef.current.has(row._id))
          .sort(
            (a, b) =>
              new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
          );

        nextToasts.forEach((row) => {
          toast.info(
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{row.title || 'New message'}</p>
              <p className="text-xs text-slate-600">{row.message || 'You have a new message.'}</p>
            </div>,
            {
              toastId: `staff-notification-${row._id}`,
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
            }
          );
          toastedIdsRef.current.add(row._id);
        });

        if (nextToasts.length > 0) {
          setToastedNotificationIds(Array.from(toastedIdsRef.current));
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="w-11 h-11 rounded-full bg-white/70 text-slate-700 flex items-center justify-center shadow-sm border border-slate-200"
          aria-label="Notifications"
          onClick={() => setModalOpen(true)}
        >
          <Bell size={18} />
        </button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      <StaffNotificationModal
        open={modalOpen}
        onChangeUnreadCount={setUnreadCount}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default StaffNotificationBell;
