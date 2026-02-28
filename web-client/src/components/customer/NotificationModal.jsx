import { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const NotificationModal = ({ open, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState('');

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/notifications/orders?unread=false&limit=50');
        setItems(res?.data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  const markOne = async (id) => {
    if (!id) return;
    setMarkingId(id);
    try {
      await apiRequest('/notifications/orders/mark-read', 'PUT', { ids: [id] });
      setItems((prev) =>
        prev.map((row) =>
          row._id === id ? { ...row, is_read: true, read_at: new Date().toISOString() } : row
        )
      );
    } finally {
      setMarkingId('');
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await apiRequest('/notifications/orders/mark-read', 'PUT', { ids: [] });
      setItems((prev) =>
        prev.map((row) => ({
          ...row,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
    } finally {
      setMarkingAll(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            x
          </button>
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {items.filter((i) => !i.is_read).length} unread
          </p>
          <button
            type="button"
            onClick={markAll}
            disabled={markingAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-300"
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-6 pb-6">
          {loading && <p className="text-sm text-slate-400">Loading notifications...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-slate-400">No notifications yet.</p>
          )}

          <div className="space-y-3">
            {items.map((row) => (
              <div
                key={row._id}
                className={`rounded-xl border p-4 ${
                  row.is_read
                    ? 'border-slate-200 bg-white'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{row.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{row.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markOne(row._id)}
                    disabled={row.is_read || markingId === row._id}
                    className="text-[11px] font-semibold text-blue-600 disabled:text-slate-300"
                  >
                    {row.is_read ? 'Read' : markingId === row._id ? 'Marking...' : 'Mark as read'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
