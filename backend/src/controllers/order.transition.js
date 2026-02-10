// e:\Aquaflow\backend\src\services\order.transition.js
import { ORDER_STATUS } from '../constants/order.constants.js';

const transitions = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PICKUP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PICKUP]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.PENDING_PAYMENT],
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

export const isValidTransition = (fromStatus, toStatus) => {
  const allowed = transitions[fromStatus] || [];
  return allowed.includes(toStatus);
};

export const assertTransition = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) {
    const err = new Error(`Order is already in status ${toStatus}`);
    err.statusCode = 400;
    throw err;
  }
  if (!isValidTransition(fromStatus, toStatus)) {
    const err = new Error(`Invalid status transition: ${fromStatus} -> ${toStatus}`);
    err.statusCode = 400;
    throw err;
  }
};
