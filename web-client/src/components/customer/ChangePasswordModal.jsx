import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthProvider';

const STRONG_PASSWORD = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { updateProfile, forgotPassword, resetPassword, user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('current');
  const [resetCode, setResetCode] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setResetCode('');
    setMode('current');
    setError('');
    setSuccess('');
    setLoading(false);
    setSendingCode(false);
    setResetting(false);
    setShowCurrent(false);
    setShowNew(false);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (!STRONG_PASSWORD.test(formData.newPassword)) {
      setError('Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const payload = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    };
    const res = await updateProfile(payload);
    if (!res.success) {
      setError(res.error || 'Failed to update password.');
      setLoading(false);
      return;
    }

    setSuccess('Password updated successfully.');
    setLoading(false);
    setTimeout(() => onClose?.(), 600);
  };

  const handleSendCode = async () => {
    const email = user?.email;
    if (!email) {
      toast.error('Missing email for password reset.');
      return;
    }
    setSendingCode(true);
    const res = await forgotPassword(email);
    setSendingCode(false);
    if (!res.success) {
      toast.error(res.error || 'Could not send reset email.');
      return;
    }
    toast.success(res.message || 'Reset code sent to your email.');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetCode.trim()) {
      setError('Reset code is required.');
      return;
    }
    if (!STRONG_PASSWORD.test(formData.newPassword)) {
      setError('Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setResetting(true);
    const res = await resetPassword(resetCode.trim(), formData.newPassword);
    setResetting(false);
    if (!res.success) {
      setError(res.error || 'Reset failed.');
      return;
    }
    toast.success(res.message || 'Password reset successful.');
    setTimeout(() => onClose?.(), 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Security</p>
            <h3 className="text-2xl font-black text-slate-900">Change Password</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            x
          </button>
        </div>

        <form onSubmit={mode === 'current' ? handleSubmit : handleResetPassword} className="px-8 py-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-semibold">
              {success}
            </div>
          )}

          <div className="grid gap-4">
            {mode === 'current' ? (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Current password"
                  className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Reset code"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New password"
                className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Use a strong password with numbers and symbols.</span>
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess('');
                setMode((prev) => (prev === 'current' ? 'reset' : 'current'));
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {mode === 'current' ? 'Forgot password?' : 'Use current password'}
            </button>
          </div>

          {mode === 'reset' && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                {sendingCode ? 'Sending code...' : 'Send reset code'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || resetting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mode === 'current'
                ? loading
                  ? 'Saving...'
                  : 'Update Password'
                : resetting
                  ? 'Resetting...'
                  : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
