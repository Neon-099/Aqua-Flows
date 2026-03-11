import Notification from '../models/Notification.model.js';
import Customer from '../models/Customer.model.js';

const buildOrderNotificationContent = (status, orderCode) => {
  const code = orderCode || '';
  switch (status) {
    case 'PENDING':
      return { title: 'Order received', message: `We received your order ${code}.` };
    case 'CONFIRMED':
      return { title: 'Order confirmed', message: `Your order ${code} is confirmed.` };
    case 'PICKED_UP':
      return { title: 'Order picked up', message: `Your order ${code} has been picked up.` };
    case 'OUT_FOR_DELIVERY':
      return { title: 'Out for delivery', message: `Your order ${code} is out for delivery.` };
    case 'DELIVERED':
      return { title: 'Order delivered', message: `Your order ${code} has been delivered.` };
    case 'PENDING_PAYMENT':
      return { title: 'Payment pending', message: `Payment is pending for order ${code}.` };
    case 'COMPLETED':
      return { title: 'Order completed', message: `Your order ${code} is completed.` };
    case 'CANCELLED':
      return { title: 'Order cancelled', message: `Your order ${code} was cancelled.` };
    default:
      return { title: 'Order update', message: `Update for order ${code}.` };
  }
};

export const createOrderNotificationForOrder = async ({ order, status, session }) => {
  if (!order?.customer_id || !order?._id) return;

  const customerQuery = Customer.findById(order.customer_id).select('_id user_id');
  const customer = session ? await customerQuery.session(session) : await customerQuery;
  if (!customer?.user_id) return;

  const orderCode = order.order_code || order._id;
  const nextStatus = status || order.status;
  const content = buildOrderNotificationContent(nextStatus, orderCode);

  const doc = {
    customer_id: customer._id,
    user_id: customer.user_id,
    order_id: order._id,
    status: nextStatus,
    title: content.title,
    message: content.message,
  };

  if (session) {
    await Notification.create([doc], { session });
    return;
  }
  await Notification.create(doc);
};

export const createCustomOrderNotificationForOrder = async ({
  order,
  status,
  title,
  message,
  session,
}) => {
  if (!order?.customer_id || !order?._id) return;

  const customerQuery = Customer.findById(order.customer_id).select('_id user_id');
  const customer = session ? await customerQuery.session(session) : await customerQuery;
  if (!customer?.user_id) return;

  const orderCode = order.order_code || order._id;
  const nextStatus = status || order.status;
  const doc = {
    customer_id: customer._id,
    user_id: customer.user_id,
    order_id: order._id,
    status: nextStatus,
    title: title || 'Order update',
    message: message || `Update for order ${orderCode}.`,
  };

  if (session) {
    await Notification.create([doc], { session });
    return;
  }
  await Notification.create(doc);
};

export const createMessageNotificationForUser = async ({
  receiverUser,
  senderUser,
  conversation,
  message,
  session,
}) => {
  if (!receiverUser?._id || !senderUser?._id) return;
  const receiverCustomer = await Customer.findOne({ user_id: receiverUser._id }).select('_id user_id');

  const trimmed = String(message || '').trim();
  if (!trimmed) return;

  const roleRaw = String(senderUser?.role || '').toLowerCase();
  const roleLabel =
    roleRaw === 'customer' || roleRaw === 'user'
      ? 'Customer'
      : roleRaw === 'rider'
      ? 'Rider'
      : roleRaw === 'staff' || roleRaw === 'admin'
      ? 'Staff'
      : 'User';
  const preview = trimmed.length > 90 ? `${trimmed.slice(0, 90)}...` : trimmed;
  const doc = {
    customer_id: receiverCustomer?._id || null,
    user_id: receiverUser._id,
    order_id: conversation?.orderId || null,
    type: 'message',
    title: `${roleLabel} • ${senderUser?.name || 'New message'}`,
    message: preview,
  };

  if (session) {
    await Notification.create([doc], { session });
    return;
  }
  await Notification.create(doc);
};

export const listOrderNotificationForUser = async ({ userId, unreadOnly = false, limit = 50 }) => {
  const customer = await Customer.findOne({ user_id: userId }).select('_id user_id');
  if (!customer) return [];

  const filter = {
    customer_id: customer._id,
    user_id: userId,
  };
  if (unreadOnly) filter.is_read = false;

  return Notification.find(filter)
    .sort({ created_at: -1 })
    .limit(Number(limit || 50));
};

export const listMessageNotificationForUser = async ({ userId, unreadOnly = false, limit = 50 }) => {
  if (!userId) return [];

  const filter = {
    user_id: userId,
    type: 'message',
  };
  if (unreadOnly) filter.is_read = false;

  return Notification.find(filter)
    .sort({ created_at: -1 })
    .limit(Number(limit || 50));
};

export const markOrderNotificationRead = async ({ userId, ids }) => {
  const customer = await Customer.findOne({ user_id: userId }).select('_id user_id');
  if (!customer) return { matched: 0, modified: 0 };

  const filter = {
    customer_id: customer._id,
    user_id: userId,
  };
  if (Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  const result = await Notification.updateMany(filter, {
    $set: { is_read: true, read_at: new Date() },
  });

  return { matched: result.matchedCount || 0, modified: result.modifiedCount || 0 };
};

export const markMessageNotificationRead = async ({ userId, ids }) => {
  if (!userId) return { matched: 0, modified: 0 };

  const filter = {
    user_id: userId,
    type: 'message',
  };
  if (Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  const result = await Notification.updateMany(filter, {
    $set: { is_read: true, read_at: new Date() },
  });

  return { matched: result.matchedCount || 0, modified: result.modifiedCount || 0 };
};

export const getUnreadNotificationCountForUser = async ({ userId }) => {
  const customer = await Customer.findOne({ user_id: userId }).select('_id user_id');
  if (!customer) return 0;

  const count = await Notification.countDocuments({
    customer_id: customer._id,
    user_id: userId,
    is_read: false,
  });

  return Number(count || 0);
};

export const getUnreadMessageNotificationCountForUser = async ({ userId }) => {
  if (!userId) return 0;

  const count = await Notification.countDocuments({
    user_id: userId,
    type: 'message',
    is_read: false,
  });

  return Number(count || 0);
};
