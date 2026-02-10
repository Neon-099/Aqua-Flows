// utils/riderFormatters.js

/**
 * Get action buttons for rider based on order status
 * @param {string} status - Order status
 * @param {string} paymentMethod - Payment method
 * @returns {array} Array of action button configs
 */
export const getRiderActions = (status, paymentMethod) => {
  const actions = {
    CONFIRMED: [
      { label: 'Confirm Pickup', action: 'confirmPickup', variant: 'primary' },
      { label: 'Cancel', action: 'cancelPickup', variant: 'danger' }
    ],
    PICKUP: [
      { label: 'Start Delivery', action: 'startDelivery', variant: 'primary' }
    ],
    OUT_FOR_DELIVERY: [
      { label: 'Mark as Delivered', action: 'markDelivered', variant: 'success' }
    ],
    DELIVERED: [
      { label: 'Confirm Payment', action: 'confirmPayment', variant: 'primary' }
    ],
    PENDING_PAYMENT: [
      { label: 'Confirm Payment', action: 'confirmPayment', variant: 'primary' }
    ],
  };
  return actions[status] || [];
};

/**
 * Get button style classes based on variant
 * @param {string} variant - Button variant
 * @returns {string} Tailwind classes
 */
export const getButtonVariant = (variant) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400',
  };
  return variants[variant] || variants.primary;
};

/**
 * Format currency for display
 * @param {number} amount - Amount in pesos
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  return `₱${amount.toFixed(2)}`;
};
