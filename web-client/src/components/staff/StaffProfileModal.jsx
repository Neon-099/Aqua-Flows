import { useMemo } from 'react';
import { LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';

const StaffProfileModal = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = String(user?.name || '').trim();
    if (!name) return 'ST';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user?.name]);

  if (!open) return null;

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate('/auth');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <button
        type="button"
        aria-label="Close profile modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
              {initials}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-none">{user?.name || 'Staff'}</p>
              <p className="text-xs text-slate-500 mt-1">{user?.email || 'No email'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Staff Operator
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default StaffProfileModal;
