// utils/messagingFormatters.js

/**
 * Format timestamp for display
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted like "Just now", "10:30 AM", "Yesterday"
 */
export const formatMessageTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const hours = messageDate.getHours();
  const mins = messageDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${String(mins).padStart(2, '0')} ${ampm}`;
};

/**
 * Get contact type badge color
 * @param {string} type - Contact type (RIDER | CUSTOMER)
 * @returns {object} Object with bg and text color classes
 */
export const getContactTypeBadge = (type) => {
  const badges = {
    RIDER: { bg: 'bg-blue-100', text: 'text-blue-700' },
    CUSTOMER: { bg: 'bg-orange-100', text: 'text-orange-700' },
  };
  return badges[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

/**
 * Format conversation timestamp
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted like "Just now", "3h", "Yesterday"
 */
export const formatConversationTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return messageDate.toLocaleDateString();
};
