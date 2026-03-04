import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, LocationEdit, Lock, Mail, PhoneCallIcon, User2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';

const ADDRESS_OPTIONS = [
  { value: 'Amanoaoac', label: 'Amanoaoac' },
  { value: 'Aserda', label: 'Aserda' },
  { value: 'Apaya', label: 'Apaya ' },
  { value: 'Baloling', label: 'Baloling ' },
  { value: 'Coral', label: 'Coral' },
  { value: 'Golden', label: 'Golden' },
  { value: 'Luyan', label: 'Luyan' },
  { value: 'Nilombot', label: 'Nilombot ' },
  { value: 'Pias', label: 'Pias ' },
  { value: 'Poblacion', label: 'Poblacion' },
  { value: 'Primicias', label: 'Primicias' },
  { value: 'Santa Maria', label: 'Santa Maria' },
  { value: 'Torres', label: 'Torres' }
];

const EditProfile = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('');
    setLoading(false);
  }, [isOpen, user?.name, user?.phone, user?.address]);

  const isDirty = useMemo(() => {
    return (
      formData.name !== (user?.name || '') ||
      formData.phone !== (user?.phone || '') ||
      formData.address !== (user?.address || '') ||
      !!formData.newPassword ||
      !!formData.currentPassword ||
      !!formData.confirmPassword
    );
  }, [formData, user?.name, user?.phone, user?.address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isDirty) {
      setError('No changes to save.');
      return;
    } 

    const digitsOnly = /^\d+$/;

    if (formData.phone && formData.phone.length !== 11) {
      setError('Phone number must be exactly 11 digits.');
      return;
    }
    if (formData.phone && !digitsOnly.test(formData.phone)) {
      setError('Phone number must contain only digits.');
      return;
    }

    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        setError('Enter your current password to set a new password.');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      currentPassword: formData.currentPassword || undefined,
      newPassword: formData.newPassword || undefined,
      confirmPassword: formData.confirmPassword || undefined,
    };

    const res = await updateProfile(payload);
    if (!res.success) {
      setError(res.error || 'Failed to update profile.');
      setLoading(false);
      return;
    }

    setSuccess('Profile updated successfully.');
    setLoading(false);
    setTimeout(() => {
      onClose?.();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Profile</p>
            <h3 className="text-2xl font-black text-slate-900">Edit Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User2 size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name='email'
                value={user?.email}
                readOnly
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/3 -translate-y-1/2 text-slate-400">
                <PhoneCallIcon size={18} />
              </div>
              <input
                type="tel"
                name='phone'
                value={formData.phone || ''}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
              />
              <p className="mt-2 text-xs text-slate-400 font-semibold">
                {formData.phone.length}/11 digits
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/3 -translate-y-1/2 text-slate-400">
                <LocationEdit size={18} />
              </div>
              <select
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                required
              >
                <option value="">Select your barangay/address option</option>
                {ADDRESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Change password
            </p>
            <div className="grid md:grid-row-3 gap-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Current password"
                  className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="New password"
                  className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium bg-white"
                />
              </div>
            </div>
          </div>

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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
