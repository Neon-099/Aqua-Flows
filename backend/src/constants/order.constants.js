// e:\Aquaflow\backend\src\constants\order.constants.js

export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKUP: 'PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const ORDER_PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

export const PAYMENT_METHOD = Object.freeze({
  COD: 'COD',
  GCASH: 'GCASH',
});

export const PAYMENT_PROVIDER = Object.freeze({
  PAYMONGO: 'PAYMONGO',
});

export const GALLON_TYPE = Object.freeze({
  ROUND: 'ROUND',
  SLIM: 'SLIM',
});

export const USER_ROLE = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  RIDER: 'rider',
  CUSTOMER: 'customer',
});
