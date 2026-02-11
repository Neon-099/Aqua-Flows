// constants/staff.constants.js

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const RiderStatus = {
  AVAILABLE: 'AVAILABLE',
  ON_DELIVERY: 'ON_DELIVERY',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
};

export const PaymentMethod = {
  COD: 'COD',
  GCASH: 'GCASH',
};
