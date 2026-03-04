import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthProvider';

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const useProfile = (navigate) => {
  const { user, logout, loading } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const profileName = user?.name || 'Customer';
  const profileEmail = user?.email || 'email@aquaflow.com';
  const profilePhone = user?.phone || '+63 900 000 0000';
  const profileAddress = user?.address || 'No address saved';
  const memberSince = formatDate(user?.createdAt || user?.created_at);

  const initials = useMemo(() => {
    if (!profileName) return 'CF';
    return profileName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profileName]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return {
    user,
    loading,
    profileName,
    profileEmail,
    profilePhone,
    profileAddress,
    memberSince,
    initials,
    handleLogout,
    setIsEditOpen,
    isEditOpen,
  };
};

export default useProfile;
