import Order from '../models/Order.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import User from '../models/User.model.js';

const ALLOWED = new Set([
  'customer:staff',
  'staff:customer',
  'customer:rider',
  'rider:customer',
  'rider:staff',
  'staff:rider',
]);

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

export const normalizeChatRole = (role) => (role === 'user' ? 'customer' : role);

export const assertRolePairAllowed = (roleA, roleB) => {
  const a = normalizeChatRole(roleA);
  const b = normalizeChatRole(roleB);
  if (!ALLOWED.has(`${a}:${b}`)) {
    throwError(403, `Messaging not allowed between ${roleA} and ${roleB}`);
  }
};

export const getUserByIdOrFail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throwError(404, 'User not found');
  return user;
};

export const assertOrderScopeIfProvided = async ({ orderId, userA, userB }) => {
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const customer = await Customer.findById(order.customer_id);
  const rider = order.assigned_rider_id ? await Rider.findById(order.assigned_rider_id) : null;

  const orderCustomerUserId = customer?.user_id || null;
  const orderRiderUserId = rider?.user_id || null;

  const users = [userA, userB];

  for (const u of users) {
    const role = normalizeChatRole(u.role);
    if (role === 'customer' && u._id !== orderCustomerUserId) {
      throwError(403, 'Customer does not belong to this order');
    }
    if (role === 'rider') {
      if (!orderRiderUserId) throwError(403, 'Order has no assigned rider yet');
      if (u._id !== orderRiderUserId) throwError(403, 'Rider does not belong to this order');
    }
    if (!['customer', 'staff', 'rider'].includes(role)) {
      throwError(403, 'Only customer, staff, rider can use chat');
    }
  }

  return order;
};

export const assertUserInConversation = (conversation, userId) => {
  const ok = conversation.participants.some((p) => p.userId === userId);
  if (!ok) throwError(403, 'Unauthorized conversation access');
};

export const assertCanJoinOrderRoom = async ({ user, orderId }) => {
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const role = normalizeChatRole(user.role);

  if (role === 'staff') return order;

  if (role === 'customer') {
    const customer = await Customer.findById(order.customer_id);
    if (!customer || customer.user_id !== user._id) throwError(403, 'Unauthorized order room');
    return order;
  }

  if (role === 'rider') {
    if (!order.assigned_rider_id) throwError(403, 'Order has no rider');
    const rider = await Rider.findById(order.assigned_rider_id);
    if (!rider || rider.user_id !== user._id) throwError(403, 'Unauthorized order room');
    return order;
  }

  throwError(403, 'Unauthorized order room');
};
