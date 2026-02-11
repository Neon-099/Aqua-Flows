// utils/staffFormatters.js

/**
 * Format timer display from seconds
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time like "00:41" or "15:30"
 */
export const formatTimer = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Get timer color based on remaining time
 * @param {number} seconds - Seconds remaining
 * @returns {string} Color indicator ('yellow' | 'red')
 */
export const getTimerColor = (seconds) => {
  if (seconds <= 300) return 'red'; // 5 minutes or less
  return 'yellow';
};

/**
 * Format order ID for display
 * @param {string} id - Order ID
 * @returns {string} Formatted like "#ORD-1023"
 */
export const formatOrderId = (id) => {
  return `#ORD-${id}`;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 chars)
 */
export const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get status badge color classes
 * @param {string} status - Order status
 * @returns {object} Object with bg and text color classes
 */
export const getStatusColors = (status) => {
  const colors = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    PICKED_UP: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    OUT_FOR_DELIVERY: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    PENDING_PAYMENT: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  };
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
};

/**
 * Get rider status display info
 * @param {string} status - Rider status
 * @returns {object} Object with label and dot color class
 */
export const getRiderStatusInfo = (status) => {
  const statusInfo = {
    AVAILABLE: { label: 'Available', dotColor: 'bg-green-500' },
    ON_DELIVERY: { label: 'On Delivery', dotColor: 'bg-orange-500' },
    BUSY: { label: 'Busy', dotColor: 'bg-orange-500' },
    OFFLINE: { label: 'Offline', dotColor: 'bg-gray-400' },
  };
  return statusInfo[status] || { label: 'Unknown', dotColor: 'bg-gray-400' };
};
