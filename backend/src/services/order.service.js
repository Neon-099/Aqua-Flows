// e:\Aquaflow\backend\src\services\order.service.js
import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Counter from '../models/Counter.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import User from '../models/User.model.js';
import Payment from '../models/Payment.model.js';
import PaymentEvent from '../models/PaymentEvent.model.js';
import OrderStatusHistory from '../models/OrderStatusHistory.model.js';
import OrderAssignment from '../models/OrderAssignment.model.js';
import Conversation from '../models/Conversation.model.js';
import { createOrderNotificationForOrder, createCustomOrderNotificationForOrder } from './notification.service.js';
import { sendPushToUser } from './fcm.service.js';
import { getOrCreateConversation, seedDefaultConversationsForUser } from './chat.service.js';
import {
  ORDER_STATUS,
  ORDER_PAYMENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  USER_ROLE,
} from '../constants/order.constants.js';
import { assertTransition } from './order.transition.js';
import {
  createCheckoutSession,
  getCheckoutSession,
  getPaymentIntent,
} from './paymongo.service.js';
import { computeEtaFromAddress } from '../utils/eta.js';
import { env } from '../config/env.js';

const PRICE_PER_GALLON = 15;
const DELIVERY_FEE = 5;
const GCASH_VAT_FEE = 3;
const SYSTEM_AUTO_ASSIGN_USER = { _id: 'SYSTEM_AUTO_ASSIGN', role: USER_ROLE.STAFF };

const isPayMongoIntentPaid = (status) => {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'succeeded' || normalized === 'paid' || normalized === 'completed';
};

const isMockPayMongoSuccess = () => env.PAYMONGO_MOCK_SUCCESS === 'true';

const throwError = (status, message) => {
  const err = new Error(message);
  err.statusCode = status;
  throw err;
};

const addHistory = async (session, orderId, status, userId) => {
  await OrderStatusHistory.create([{
    order_id: orderId,
    status,
    changed_by: userId,
  }], { session });
};

const resolveRiderId = async (user) => {
  if (user?.rider_id) return user.rider_id;
  const rider = await Rider.findOne({ user_id: user?._id });
  if (!rider) return null;
  return rider._id;
};

const ensureAnyActiveRiderHasCapacity = async (session, gallons) => {
  const neededGallons = Number(gallons || 0);
  const exists = await Rider.exists({
    status: 'active',
    $expr: {
      $gte: [
        { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
        neededGallons,
      ],
    },
  }).session(session);

  if (!exists) {
    throwError(409, 'NO_AVAILABLE_RIDER_CAPACITY');
  }
};

const reserveRiderCapacity = async (session, riderId, gallons) => {
  const neededGallons = Number(gallons || 0);
  const updated = await Rider.findOneAndUpdate(
    {
      _id: riderId,
      status: 'active',
      $expr: {
        $gte: [
          { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
          neededGallons,
        ],
      },
    },
    {
      $inc: {
        currentLoadGallons: neededGallons,
        activeOrdersCount: 1,
      },
    },
    { new: true, session }
  );

  if (!updated) {
    throwError(409, 'NO_AVAILABLE_RIDER_CAPACITY');
  }
  return updated;
};

const releaseRiderCapacity = async (session, riderId, gallons) => {
  if (!riderId) return;
  const releasedGallons = Number(gallons || 0);
  if (releasedGallons <= 0) return;

  const rider = await Rider.findById(riderId).session(session);
  if (!rider) return;

  rider.currentLoadGallons = Math.max(0, Number(rider.currentLoadGallons || 0) - releasedGallons);
  rider.activeOrdersCount = Math.max(0, Number(rider.activeOrdersCount || 0) - 1);
  await rider.save({ session });
};

const isTransientTxnError = (err) =>
  err?.errorLabels?.includes('TransientTransactionError') ||
  /write conflict/i.test(err?.message || '');

const nextOrderCode = async (session) => {
  const row = await Counter.findOneAndUpdate(
    { _id: 'order_code' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  return `ORD-${String(row.seq).padStart(6, '0')}`;
};

const enrichOrdersWithProfiles = async (orders) => {
  const rows = (orders || []).map((order) => (typeof order?.toObject === 'function' ? order.toObject() : order));
  if (!rows.length) return rows;

  const customerIds = [...new Set(rows.map((o) => o.customer_id).filter(Boolean))];
  const riderIds = [...new Set(rows.map((o) => o.assigned_rider_id).filter(Boolean))];

  const [customers, riders] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } }).select('_id user_id address'),
    Rider.find({ _id: { $in: riderIds } }).select('_id user_id'),
  ]);

  const customerById = new Map(customers.map((c) => [c._id, c]));
  const riderById = new Map(riders.map((r) => [r._id, r]));

  const userIds = [
    ...new Set([
      ...customers.map((c) => c.user_id).filter(Boolean),
      ...riders.map((r) => r.user_id).filter(Boolean),
    ]),
  ];
  const users = await User.find({ _id: { $in: userIds } }).select('_id name address');
  const userById = new Map(users.map((u) => [u._id, u]));

  return rows.map((order) => {
    const customer = customerById.get(order.customer_id);
    const customerUser = customer ? userById.get(customer.user_id) : null;
    const rider = order.assigned_rider_id ? riderById.get(order.assigned_rider_id) : null;
    const riderUser = rider ? userById.get(rider.user_id) : null;

    return {
      ...order,
      customer_name: customerUser?.name || null,
      customer_address: customer?.address || customerUser?.address || null,
      assigned_rider_name: riderUser?.name || null,
      assigned_rider_user_id: riderUser?._id || null,
    };
  });
};

const ensureOrderConversationSafe = async ({ orderId, customerId, riderId }) => {
  if (!orderId || !customerId || !riderId) return;
  try {
    const [customer, rider] = await Promise.all([
      Customer.findById(customerId).select('_id user_id'),
      Rider.findById(riderId).select('_id user_id'),
    ]);
    if (!customer?.user_id || !rider?.user_id) return;
    const senderUser = await User.findById(customer.user_id).select('_id role name');
    if (!senderUser) return;
    const ids = [senderUser._id, rider.user_id].sort();
    const desiredHash = `${ids[0]}:${ids[1]}`;

    const exact = await Conversation.findOne({ orderId, participantsHash: desiredHash });
    if (exact) return;

    const existing = await Conversation.findOne({ orderId }).sort({ updatedAt: -1 });
    if (existing) {
      const priorCustomer = existing.participants?.find((p) => p.userId === senderUser._id);
      existing.participants = [
        { userId: senderUser._id, role: 'customer', lastReadAt: priorCustomer?.lastReadAt || new Date() },
        { userId: rider.user_id, role: 'rider', lastReadAt: null },
      ];
      existing.archivedAt = null;
      await existing.save();
      return;
    }

    await getOrCreateConversation({
      senderUser,
      receiverId: rider.user_id,
      orderId,
    });
  } catch (err) {
    console.error('[chat] ensureOrderConversation failed:', err?.message || String(err));
  }
};

export const createOrder = async ({ user, payload }) => {
  const {
    customer_id,
    water_quantity,
    total_amount,
    payment_method,
    gallon_type,
    gcash_payment_intent_id,
  } = payload;

  if (!water_quantity || !total_amount || !payment_method || !gallon_type) {
    throwError(400, 'Missing required fields');
  }

  const quantity = Number(water_quantity);
  const normalizedPaymentMethod = String(payment_method).toUpperCase();
  const submittedTotal = Number(total_amount);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throwError(400, 'Invalid water_quantity');
  }

  if (!Object.values(PAYMENT_METHOD).includes(normalizedPaymentMethod)) {
    throwError(400, 'Invalid payment_method');
  }

  if (!Number.isFinite(submittedTotal) || submittedTotal <= 0) {
    throwError(400, 'Invalid total_amount');
  }

  const subtotal = quantity * PRICE_PER_GALLON;
  const vatFee = normalizedPaymentMethod === PAYMENT_METHOD.GCASH ? GCASH_VAT_FEE : 0;
  const expectedTotal = Number((subtotal + DELIVERY_FEE + vatFee).toFixed(2));
  if (Math.abs(submittedTotal - expectedTotal) > 0.001) {
    throwError(400, `Invalid total_amount. Expected ${expectedTotal.toFixed(2)}`);
  }

  let resolvedCustomerId = customer_id;
  if (!resolvedCustomerId) {
    const customerByUser = await Customer.findOne({ user_id: user._id });
    if (customerByUser) {
      resolvedCustomerId = customerByUser._id;
    }
  }

  if (!resolvedCustomerId) {
    throwError(400, 'Missing customer_id');
  }

  const customer = await Customer.findById(resolvedCustomerId);
  if (!customer) throwError(404, 'Customer not found');

  if (user.role !== USER_ROLE.CUSTOMER && user.role !== USER_ROLE.USER) {
    throwError(403, 'Only customers can place orders');
  }

  let paidIntent = null;
  if (normalizedPaymentMethod === PAYMENT_METHOD.GCASH) {
    if (!gcash_payment_intent_id) {
      throwError(400, 'gcash_payment_intent_id is required for GCASH orders');
    }
    if (isMockPayMongoSuccess() && gcash_payment_intent_id.startsWith('mock_pi_')) {
      paidIntent = {
        id: gcash_payment_intent_id,
        status: 'succeeded',
        amount: Math.round(expectedTotal * 100),
        currency: 'PHP',
      };
    } else if (gcash_payment_intent_id.startsWith('cs_')) {
      const sessionInfo = await getCheckoutSession({ checkoutSessionId: gcash_payment_intent_id });
      if (!isPayMongoIntentPaid(sessionInfo.status)) {
        throwError(400, 'GCASH checkout session is not paid yet');
      }
      if (Number(sessionInfo.amount) !== Math.round(expectedTotal * 100)) {
        throwError(400, 'GCASH amount does not match order total');
      }
      paidIntent = {
        id: sessionInfo.payment_intent_id || gcash_payment_intent_id,
        status: sessionInfo.status,
        amount: sessionInfo.amount,
        currency: sessionInfo.currency || 'PHP',
      };
    } else {
      paidIntent = await getPaymentIntent({ paymentIntentId: gcash_payment_intent_id });
      if (!isPayMongoIntentPaid(paidIntent.status)) {
        throwError(400, 'GCASH transaction is not paid yet');
      }
      if (Number(paidIntent.amount) !== Math.round(expectedTotal * 100)) {
        throwError(400, 'GCASH amount does not match order total');
      }
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orderCode = await nextOrderCode(session);

    const order = await Order.create([{
      order_code: orderCode,
      customer_id: resolvedCustomerId,
      water_quantity: quantity,
      gallon_type,
      total_amount: expectedTotal,
      payment_method: normalizedPaymentMethod,
      status: ORDER_STATUS.PENDING,
      payment_status: normalizedPaymentMethod === PAYMENT_METHOD.GCASH
        ? ORDER_PAYMENT_STATUS.PAID
        : ORDER_PAYMENT_STATUS.UNPAID,
    }], { session });

    await addHistory(session, order[0]._id, ORDER_STATUS.PENDING, user._id);
    await createOrderNotificationForOrder({
      order: order[0],
      status: ORDER_STATUS.PENDING,
      session,
    });

    let payment = null;
    if (normalizedPaymentMethod === PAYMENT_METHOD.GCASH) {
      payment = await Payment.create([{
        order_id: order[0]._id,
        method: PAYMENT_METHOD.GCASH,
        status: PAYMENT_STATUS.PAID,
        amount: expectedTotal,
        currency: 'PHP',
        paymongo_payment_intent_id: paidIntent.id,
        paid_at: new Date(),
      }], { session });
    }

    await session.commitTransaction();
    await sendOrderStatusPush({ order: order[0], status: ORDER_STATUS.PENDING });
    await seedDefaultConversationsForUser(user);

    return {
      order: order[0],
      payment: payment
        ? {
          ...payment[0].toObject(),
        }
        : null,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const createGcashPreparation = async ({ user, payload }) => {
  const { water_quantity, total_amount, payment_method, gallon_type, payment_channel } = payload;

  if (!water_quantity || !total_amount || !payment_method || !gallon_type) {
    throwError(400, 'Missing required fields');
  }

  const quantity = Number(water_quantity);
  const normalizedPaymentMethod = String(payment_method).toUpperCase();
  const submittedTotal = Number(total_amount);
  if (normalizedPaymentMethod !== PAYMENT_METHOD.GCASH) {
    throwError(400, 'Payment method must be GCASH');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throwError(400, 'Invalid water_quantity');
  }
  if (!Number.isFinite(submittedTotal) || submittedTotal <= 0) {
    throwError(400, 'Invalid total_amount');
  }

  if (user.role !== USER_ROLE.CUSTOMER && user.role !== USER_ROLE.USER) {
    throwError(403, 'Only customers can prepare GCASH payments');
  }

  const subtotal = quantity * PRICE_PER_GALLON;
  const expectedTotal = Number((subtotal + DELIVERY_FEE + GCASH_VAT_FEE).toFixed(2));
  if (Math.abs(submittedTotal - expectedTotal) > 0.001) {
    throwError(400, `Invalid total_amount. Expected ${expectedTotal.toFixed(2)}`);
  }

  const normalizedChannel = String(payment_channel || 'gcash').toLowerCase();
  if (!['gcash', 'qrph'].includes(normalizedChannel)) {
    throwError(400, 'Invalid payment_channel');
  }

  if (isMockPayMongoSuccess()) {
    return {
      payment_intent_id: `mock_pi_${Date.now()}`,
      checkout_url: `${env.CLIENT_URL || 'http://localhost:5173'}/orders?gcash_mock=paid`,
      amount: expectedTotal,
      currency: 'PHP',
      status: 'succeeded',
    };
  }

  const successBase = env.CLIENT_URL || 'http://localhost:5173';
  const cancelBase = env.CLIENT_URL || 'http://localhost:5173';
  const checkoutSession = await createCheckoutSession({
    amount: expectedTotal,
    currency: 'PHP',
    description: 'AquaFlow prepaid checkout',
    successUrl: `${successBase}/orders?gcash=success`,
    cancelUrl: `${cancelBase}/orders?gcash=cancelled`,
    paymentMethodType: normalizedChannel,
  });

  return {
    // Keep legacy key so existing web/mobile clients continue to work.
    // For checkout flow this may carry a checkout session id (cs_...).
    payment_intent_id: checkoutSession.id,
    checkout_url: checkoutSession.checkout_url,
    amount: expectedTotal,
    currency: 'PHP',
    status: checkoutSession.status,
    payment_channel: normalizedChannel,
  };
};

const requireOwnedCustomerOrder = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.CUSTOMER && user.role !== USER_ROLE.USER) {
    throwError(403, 'Only customers can manage this order payment');
  }
  const customer = await Customer.findOne({ user_id: user._id }).select('_id');
  if (!customer) throwError(404, 'Customer not found');
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');
  if (order.customer_id !== customer._id) throwError(403, 'Not authorized for this order');
  return order;
};

export const retryOrderPayment = async ({ user, orderId, payload }) => {
  const order = await requireOwnedCustomerOrder({ user, orderId });
  if (env.FLAG_CUSTOMER_RETRY_PAYMENT === 'false') {
    throwError(403, 'Retry payment feature is disabled');
  }
  if (order.payment_method !== PAYMENT_METHOD.GCASH) {
    throwError(400, 'Retry payment is only available for GCASH orders');
  }
  if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    throwError(400, 'Cannot retry payment for completed or cancelled orders');
  }

  const prepare = await createGcashPreparation({
    user,
    payload: {
      water_quantity: order.water_quantity,
      total_amount: order.total_amount,
      payment_method: PAYMENT_METHOD.GCASH,
      gallon_type: order.gallon_type,
      payment_channel: payload?.payment_channel || 'gcash',
    },
  });

  let payment = await Payment.findOne({ order_id: order._id }).sort({ created_at: -1 });
  if (!payment) {
    payment = await Payment.create({
      order_id: order._id,
      method: PAYMENT_METHOD.GCASH,
      status: PAYMENT_STATUS.PENDING,
      amount: order.total_amount,
      currency: 'PHP',
      paymongo_payment_intent_id: prepare.payment_intent_id,
    });
  } else {
    payment.method = PAYMENT_METHOD.GCASH;
    payment.status = PAYMENT_STATUS.PENDING;
    payment.paymongo_payment_intent_id = prepare.payment_intent_id;
    await payment.save();
  }

  order.payment_status = ORDER_PAYMENT_STATUS.PENDING;
  if (order.status === ORDER_STATUS.DELIVERED) {
    order.status = ORDER_STATUS.PENDING_PAYMENT;
  }
  await order.save();

  return {
    order,
    payment,
    checkout: prepare,
  };
};

export const switchOrderToCod = async ({ user, orderId }) => {
  const order = await requireOwnedCustomerOrder({ user, orderId });
  if (env.FLAG_CUSTOMER_SWITCH_TO_COD === 'false') {
    throwError(403, 'Switch to COD feature is disabled');
  }
  if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    throwError(400, 'Cannot switch payment method for completed or cancelled orders');
  }

  const previousMethod = order.payment_method;
  order.payment_method = PAYMENT_METHOD.COD;
  order.payment_status = ORDER_PAYMENT_STATUS.UNPAID;
  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.PENDING_PAYMENT) {
    order.status = ORDER_STATUS.PENDING_PAYMENT;
  }
  await order.save();

  await Payment.updateMany(
    { order_id: order._id, method: PAYMENT_METHOD.GCASH, status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] } },
    { $set: { status: PAYMENT_STATUS.FAILED } }
  );

  return {
    order,
    previous_method: previousMethod,
    next_method: PAYMENT_METHOD.COD,
  };
};

export const getOrderById = async ({ user, orderId }) => {
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  // Basic access check: staff/rider/admin can view, customer can view own
  if (![USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.RIDER].includes(user.role)) {
    const customer = await Customer.findById(order.customer_id);
    if (!customer || customer.user_id !== user._id) {
      throwError(403, 'Not authorized to view this order');
    }
  }

  const rider = order.assigned_rider_id
    ? await Rider.findById(order.assigned_rider_id)
    : null;

  const payment = await Payment.findOne({ order_id: order._id });

  return { order, rider, payment };
};

export const listOrdersForRider = async ({ user, riderId }) => {
  if (![USER_ROLE.RIDER, USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.USER].includes(user.role)) {
    throwError(403, 'Not authorized');
  }

  if (user.role === USER_ROLE.RIDER) {
    const effectiveRiderId = riderId && riderId !== user?._id ? riderId : null;
    const resolvedRiderId = effectiveRiderId || (await resolveRiderId(user));
    const riderIds = [resolvedRiderId, user?._id].filter(Boolean);
    if (riderIds.length === 0) throwError(400, 'Missing rider id');
    const results = await Order.find({
      $or: [
        { assigned_rider_id: { $in: riderIds } },
        { status: ORDER_STATUS.PENDING, assigned_rider_id: null },
      ],
    }).sort({ status: 1, updated_at: -1 });
    const enriched = await enrichOrdersWithProfiles(results);
    return enriched.map((order) => {
      const assignedToMe = Boolean(order.assigned_rider_id && riderIds.includes(order.assigned_rider_id));
      return { ...order, assigned_to_me: assignedToMe };
    });
  }

  if (user.role === USER_ROLE.CUSTOMER || user.role === USER_ROLE.USER) {
    const customer = await Customer.findOne({ user_id: user._id });
    if (!customer) throwError(404, 'Customer not found');
    const results = await Order.find({ customer_id: customer._id })
      .sort({ created_at: -1 });
    return enrichOrdersWithProfiles(results);
  }

  if (riderId) {
    const results = await Order.find({ assigned_rider_id: riderId })
      .sort({ status: 1, updated_at: -1 });
    return enrichOrdersWithProfiles(results);
  }

  const results = await Order.find().sort({ created_at: -1 });
  return enrichOrdersWithProfiles(results);
};

export const listOrdersForStaff = async ({ user }) => {
  if (user.role !== USER_ROLE.STAFF) {
    throwError(403, 'Not authorized');
  }

  const results = await Order.find().sort({ created_at: -1 });
  return enrichOrdersWithProfiles(results);
};

export const cancelOrder = async ({ user, orderId }) => {
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const canCancel =
    user.role === USER_ROLE.CUSTOMER ||
    user.role === USER_ROLE.STAFF ||
    user.role === USER_ROLE.ADMIN ||
    user.role === 'user';
  if (!canCancel) {
    throwError(403, 'Only customers, staff, and admins can cancel orders');
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throwError(400, 'Order can only be cancelled while PENDING');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.CANCELLED);
    if (order.assigned_rider_id) {
      await releaseRiderCapacity(session, order.assigned_rider_id, order.water_quantity);
      order.assigned_rider_id = null;
    }
    order.status = ORDER_STATUS.CANCELLED;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.CANCELLED, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.CANCELLED,
      session,
    });

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.CANCELLED,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const confirmOrder = async ({ user, orderId }) => {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(orderId).session(session);
      if (!order) throwError(404, 'Order not found');
      const gallons = Number(order.water_quantity || 0);

      if (user.role === USER_ROLE.STAFF) {
        assertTransition(order.status, ORDER_STATUS.CONFIRMED);
        order.status = ORDER_STATUS.CONFIRMED;
        await order.save({ session });
        await addHistory(session, order._id, ORDER_STATUS.CONFIRMED, user._id);
        await createOrderNotificationForOrder({
          order,
          status: ORDER_STATUS.CONFIRMED,
          session,
        });
      } else if (user.role === USER_ROLE.RIDER) {
        // Rider manual accept from PENDING -> CONFIRMED and assign to self
        assertTransition(order.status, ORDER_STATUS.CONFIRMED);
        const resolvedRiderId = await resolveRiderId(user);
        if (!resolvedRiderId) throwError(400, 'Missing rider id');
        if (order.assigned_rider_id && order.assigned_rider_id !== resolvedRiderId) {
          throwError(409, 'Order already assigned to another rider');
        }
        if (!order.assigned_rider_id) {
          await reserveRiderCapacity(session, resolvedRiderId, gallons);
        }
        order.status = ORDER_STATUS.CONFIRMED;
        order.assigned_rider_id = resolvedRiderId;
        await order.save({ session });
        await addHistory(session, order._id, ORDER_STATUS.CONFIRMED, user._id);
        await createOrderNotificationForOrder({
          order,
          status: ORDER_STATUS.CONFIRMED,
          session,
        });

        await OrderAssignment.create([{
          order_id: orderId,
          rider_id: order.assigned_rider_id,
          assigned_by: user._id,
          assigned_at: new Date(),
        }], { session });
      } else {
        throwError(403, 'Not authorized to accept order');
      }

      await session.commitTransaction();
      await sendOrderStatusPush({
        order,
        status: ORDER_STATUS.CONFIRMED,
      });
      if (order.assigned_rider_id) {
        await ensureOrderConversationSafe({
          orderId: order._id,
          customerId: order.customer_id,
          riderId: order.assigned_rider_id,
        });
        return order;
      }

      if (user.role === USER_ROLE.STAFF) {
        try {
          const assigned = await autoAssignRider({ user, orderId });
          return assigned?.order || order;
        } catch (err) {
          if (err?.message !== 'NO_AVAILABLE_RIDER') {
            console.error(`[AUTO_ASSIGN] Failed after confirm for order ${orderId}: ${err?.message || err}`);
          }
        }
      }
      return order;
    } catch (err) {
      await session.abortTransaction();
      if (isTransientTxnError(err) && attempt < maxAttempts) {
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
};

export const autoAcceptPendingOrders = async ({ maxAgeSeconds = 60, batchSize = 100 } = {}) => {
  const cutoff = new Date(Date.now() - Number(maxAgeSeconds || 60) * 1000);
  const candidates = await Order.find({
    status: ORDER_STATUS.PENDING,
    created_at: { $lte: cutoff },
  })
    .sort({ created_at: 1 })
    .limit(Number(batchSize || 100))
    .select('_id');

  let updated = 0;
  let skippedChanged = 0;
  let failed = 0;

  for (const row of candidates) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(row._id).session(session);
      if (!order || order.status !== ORDER_STATUS.PENDING) {
        skippedChanged += 1;
        await session.abortTransaction();
        continue;
      }

      assertTransition(order.status, ORDER_STATUS.CONFIRMED);
      order.status = ORDER_STATUS.CONFIRMED;
      order.auto_accepted = true;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.CONFIRMED, 'SYSTEM_AUTO_ACCEPT');

      await session.commitTransaction();
      await sendOrderStatusPush({
        order,
        status: ORDER_STATUS.CONFIRMED,
      });
      try {
        await autoAssignRider({ user: SYSTEM_AUTO_ASSIGN_USER, orderId: order._id });
      } catch (err) {
        if (err?.message !== 'NO_AVAILABLE_RIDER') {
          console.error(`[AUTO_ASSIGN] Failed after auto-accept for order ${row._id}: ${err?.message || err}`);
        }
      }
      updated += 1;
    } catch (err) {
      await session.abortTransaction();
      failed += 1;
      console.error(`[AUTO_ACCEPT] Failed for order ${row._id}: ${err.message}`);
    } finally {
      session.endSession();
    }
  }

  return {
    scanned: candidates.length,
    updated,
    skippedChanged,
    failed,
    cutoff: cutoff.toISOString(),
  };
};

export const autoAssignConfirmedOrders = async ({ batchSize = 100 } = {}) => {
  const candidates = await Order.find({
    status: ORDER_STATUS.CONFIRMED,
    assigned_rider_id: null,
  })
    .sort({ updated_at: 1 })
    .limit(Number(batchSize || 100))
    .select('_id');

  let assigned = 0;
  let skippedNoCapacity = 0;
  let skippedChanged = 0;
  let failed = 0;

  for (const row of candidates) {
    try {
      await autoAssignRider({ user: SYSTEM_AUTO_ASSIGN_USER, orderId: row._id });
      assigned += 1;
    } catch (err) {
      if (err?.message === 'NO_AVAILABLE_RIDER' || err?.message === 'NO_AVAILABLE_RIDER_CAPACITY') {
        skippedNoCapacity += 1;
        continue;
      }
      if (err?.message === 'Order already assigned') {
        skippedChanged += 1;
        continue;
      }
      failed += 1;
      console.error(`[AUTO_ASSIGN_SCAN] Failed for order ${row._id}: ${err?.message || err}`);
    }
  }

  return {
    scanned: candidates.length,
    assigned,
    skippedNoCapacity,
    skippedChanged,
    failed,
  };
};

export const riderPickup = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can confirm pickup');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const resolvedRiderId = await resolveRiderId(user);
  if (!resolvedRiderId) throwError(400, 'Missing rider id');
  if (order.assigned_rider_id !== resolvedRiderId) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.PICKED_UP);
    order.status = ORDER_STATUS.PICKED_UP;
    await applyEtaToOrder(session, order, ORDER_STATUS.PICKED_UP);
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.PICKED_UP, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.PICKED_UP,
      session,
    });

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.PICKED_UP,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const riderBulkPickup = async ({ user, orderIds }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can confirm pickup');
  }

  const ids = Array.isArray(orderIds) ? orderIds.filter(Boolean) : [];
  if (ids.length === 0) {
    throwError(400, 'Missing order_ids');
  }

  const results = [];
  const failures = [];

  for (const id of ids) {
    try {
      const order = await riderPickup({ user, orderId: id });
      results.push(order);
    } catch (err) {
      failures.push({
        order_id: id,
        message: err?.message || 'Failed to confirm pickup',
        status: err?.statusCode || 500,
      });
    }
  }

  return {
    processed: results.length,
    failed: failures.length,
    results,
    failures,
  };
};


export const assignRider = async ({ user, orderId, riderId }) => {
  if (![USER_ROLE.STAFF, USER_ROLE.ADMIN].includes(user.role)) {
    throwError(403, 'Only staff can assign riders');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const rider = await Rider.findById(riderId);
  if (!rider) throwError(404, 'Rider not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const gallons = Number(order.water_quantity || 0);
    const previousRiderId = order.assigned_rider_id || null;

    if (previousRiderId && previousRiderId !== riderId) {
      await releaseRiderCapacity(session, previousRiderId, gallons);
    }
    if (!previousRiderId || previousRiderId !== riderId) {
      await reserveRiderCapacity(session, riderId, gallons);
    }

    order.assigned_rider_id = riderId;
    await order.save({ session });

    await OrderAssignment.create([{
      order_id: orderId,
      rider_id: riderId,
      assigned_by: user._id,
      assigned_at: new Date(),
    }], { session });

    await session.commitTransaction();
    await ensureOrderConversationSafe({
      orderId: order._id,
      customerId: order.customer_id,
      riderId: order.assigned_rider_id,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const autoAssignRider = async({user, orderId, weights}) => {
  if(!['staff'].includes(user.role)){
    throwError(403, 'Only staff can assign riders');
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(orderId).session(session);
      if(!order) throwError(404, 'Order not found');
      if (order.status !== ORDER_STATUS.CONFIRMED) {
        throwError(400, 'Only confirmed orders can be assigned');
      }
      if (order.assigned_rider_id) {
        throwError(409, 'Order already assigned');
      }

      const gallons = order.water_quantity;
      const candidates = await getAutoAssignCandidates({
        session,
        gallons,
        limit: 1,
        weights,
      });

      if (!candidates || candidates.length === 0) {
        throwError(409, 'NO_AVAILABLE_RIDER');
      }

      const riderId = candidates[0]._id;

      // Atomic rider load update with capacity check
      const updatedRider = await Rider.findOneAndUpdate(
        {
          _id: riderId,
          status: 'active',
          $expr: {
            $gte: [
              { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
              gallons
            ]
          }
        },
        {
          $inc: {
            currentLoadGallons: gallons,
            activeOrdersCount: 1
          }
        },
        { new: true, session }
      );

      if (!updatedRider) {
        throwError(409, 'NO_AVAILABLE_RIDER');
      }

      order.assigned_rider_id = riderId;
      await order.save({ session });

      await OrderAssignment.create([{
        order_id: orderId,
        rider_id: riderId,
        assigned_by: user._id,
        assigned_at: new Date(),
      }], { session });

      await session.commitTransaction();
      await ensureOrderConversationSafe({
        orderId: order._id,
        customerId: order.customer_id,
        riderId: order.assigned_rider_id,
      });

      return { order, rider: updatedRider };
    } catch (err) {
      await session.abortTransaction();
      if (isTransientTxnError(err) && attempt < maxAttempts) {
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
}

const buildWeights = (weights) => ({
  load: weights?.load ?? 0.0,
  orders: weights?.orders ?? 0.0,
  capacity: weights?.capacity ?? 1.0,
  distance: weights?.distance ?? 0.0,
});

const getAutoAssignCandidates = async ({ session, gallons, limit = 3, weights }) => {
  const w = buildWeights(weights);
  const pipeline = [
    {
      $match: {
        status: 'active',
        $expr: {
          $gte: [
            { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
            Number(gallons || 0),
          ],
        },
      },
    },
    {
      $addFields: {
        remainingCapacity: { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
      },
    },
    {
      $addFields: {
        score: { $multiply: [w.capacity, '$remainingCapacity'] },
      },
    },
    { $sort: { remainingCapacity: -1, currentLoadGallons: 1, activeOrdersCount: 1, _id: 1 } },
    { $limit: Number(limit || 3) },
  ];

  const query = Rider.aggregate(pipeline);
  if (session) query.session(session);
  const candidates = await query;

  if (!candidates.length) return [];

  const userIds = [...new Set(candidates.map((c) => c.user_id).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select('_id name');
  const userById = new Map(users.map((u) => [u._id, u]));

  return candidates.map((c, idx) => {
    const user = userById.get(c.user_id);
    return {
      _id: c._id,
      user_id: c.user_id,
      name: user?.name || `Rider ${String(c._id).slice(-4)}`,
      currentLoadGallons: c.currentLoadGallons || 0,
      activeOrdersCount: c.activeOrdersCount || 0,
      remainingCapacity: c.remainingCapacity || 0,
      score: c.score || 0,
      reason:
        idx === 0
          ? 'Best match: most remaining capacity.'
          : 'Eligible rider based on remaining capacity.',
    };
  });
};

export const autoAssignPreview = async ({ user, orderId, weights }) => {
  if (!['staff'].includes(user.role)) {
    throwError(403, 'Only staff can preview auto-assign');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');
  if (order.status !== ORDER_STATUS.CONFIRMED) {
    throwError(400, 'Only confirmed orders can be assigned');
  }
  if (order.assigned_rider_id) {
    throwError(409, 'Order already assigned');
  }

  const candidates = await getAutoAssignCandidates({
    gallons: order.water_quantity,
    limit: 3,
    weights,
  });

  return {
    order_id: order._id,
    weights: buildWeights(weights),
    candidates,
  };
};

const applyEtaToOrder = async (session, order, stage = ORDER_STATUS.PICKED_UP) => {
  const customer = await Customer.findById(order.customer_id).select('address user_id');
  if (!customer) return;

  let address = customer.address;
  if (!address && customer.user_id) {
    const customerUser = await User.findById(customer.user_id).select('address');
    address = customerUser?.address || '';
  }

  const eta = computeEtaFromAddress(address, stage);
  if (!eta) return;

  order.eta_minutes_min = eta.eta_minutes_min;
  order.eta_minutes_max = eta.eta_minutes_max;
  order.eta_text = eta.eta_text;
  order.eta_last_calculated_at = eta.eta_last_calculated_at;
};

const buildOrderPushContent = (status, orderCode) => {
  const code = orderCode || '';
  switch (status) {
    case ORDER_STATUS.PENDING:
      return { title: 'Order received', body: `We received your order ${code}.` };
    case ORDER_STATUS.CONFIRMED:
      return { title: 'Order confirmed', body: `Your order ${code} is confirmed.` };
    case ORDER_STATUS.PICKED_UP:
      return { title: 'Order picked up', body: `Your order ${code} has been picked up.` };
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return { title: 'Out for delivery', body: `Your order ${code} is out for delivery.` };
    case ORDER_STATUS.DELIVERED:
      return { title: 'Order delivered', body: `Your order ${code} has been delivered.` };
    case ORDER_STATUS.PENDING_PAYMENT:
      return { title: 'Payment pending', body: `Payment is pending for order ${code}.` };
    case ORDER_STATUS.COMPLETED:
      return { title: 'Order completed', body: `Your order ${code} is completed.` };
    case ORDER_STATUS.CANCELLED:
      return { title: 'Order cancelled', body: `Your order ${code} was cancelled.` };
    default:
      return { title: 'Order update', body: `Update for order ${code}.` };
  }
};

const sendOrderStatusPush = async ({ order, status }) => {
  if (!order?._id || !order?.customer_id) return;
  const orderCode = order.order_code || order._id;
  const nextStatus = status || order.status;
  const content = buildOrderPushContent(nextStatus, orderCode);
  const data = {
    type: 'order_status',
    orderId: String(order._id),
    status: String(nextStatus || ''),
  };

  const customer = await Customer.findById(order.customer_id).select('_id user_id');
  if (customer?.user_id) {
    await sendPushToUser({
      userId: customer.user_id,
      title: content.title,
      body: content.body,
      data,
    });
  }

  if (order.assigned_rider_id) {
    const rider = await Rider.findById(order.assigned_rider_id).select('_id user_id');
    if (rider?.user_id) {
      await sendPushToUser({
        userId: rider.user_id,
        title: content.title,
        body: content.body,
        data,
      });
    }
  }
};


export const riderStartDelivery = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can start delivery');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const resolvedRiderId = await resolveRiderId(user);
  if (!resolvedRiderId) throwError(400, 'Missing rider id');
  if (order.assigned_rider_id !== resolvedRiderId) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.OUT_FOR_DELIVERY);
    order.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    order.dispatch_queued_at = null;
    order.dispatch_after_minutes = null;
    order.dispatch_scheduled_for = null;
    await applyEtaToOrder(session, order, ORDER_STATUS.OUT_FOR_DELIVERY);
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.OUT_FOR_DELIVERY, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.OUT_FOR_DELIVERY,
      session,
    });

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.DELIVERED,
    });
    if (order.payment_method === PAYMENT_METHOD.COD) {
      await sendOrderStatusPush({
        order,
        status: ORDER_STATUS.PENDING_PAYMENT,
      });
    } else if (
      order.payment_method === PAYMENT_METHOD.GCASH &&
      order.payment_status === ORDER_PAYMENT_STATUS.PAID
    ) {
      await sendOrderStatusPush({
        order,
        status: ORDER_STATUS.COMPLETED,
      });
    }
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const riderBulkStartDelivery = async ({ user, orderIds }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can start delivery');
  }

  const ids = Array.isArray(orderIds) ? orderIds.filter(Boolean) : [];
  if (ids.length === 0) {
    throwError(400, 'Missing order_ids');
  }

  const results = [];
  const failures = [];

  for (const id of ids) {
    try {
      const order = await riderStartDelivery({ user, orderId: id });
      results.push(order);
    } catch (err) {
      failures.push({
        order_id: id,
        message: err?.message || 'Failed to start delivery',
        status: err?.statusCode || 500,
      });
    }
  }

  return {
    processed: results.length,
    failed: failures.length,
    results,
    failures,
  };
};

export const queueDispatch = async ({ user, orderId, minutes }) => {
  if (user.role !== USER_ROLE.STAFF) {
    throwError(403, 'Only staff can queue dispatch');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  if (order.status !== ORDER_STATUS.PICKED_UP) {
    throwError(400, 'Order must be picked up before dispatch');
  }

  const delayMinutes = Number(minutes);
  if (!Number.isFinite(delayMinutes) || delayMinutes <= 0) {
    throwError(400, 'Invalid dispatch delay');
  }

  const now = new Date();
  const scheduledFor = new Date(now.getTime() + delayMinutes * 60 * 1000);

  order.dispatch_queued_at = now;
  order.dispatch_after_minutes = delayMinutes;
  order.dispatch_scheduled_for = scheduledFor;
  await order.save();

  return order;
};

export const dispatchOrder = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.STAFF) {
    throwError(403, 'Only staff can dispatch');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  if (order.status !== ORDER_STATUS.PICKED_UP) {
    throwError(400, 'Order must be picked up before dispatch');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.OUT_FOR_DELIVERY);
    order.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    order.dispatched_at = new Date();
    order.dispatch_queued_at = null;
    order.dispatch_after_minutes = null;
    order.dispatch_scheduled_for = null;
    await applyEtaToOrder(session, order, ORDER_STATUS.OUT_FOR_DELIVERY);
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.OUT_FOR_DELIVERY, user._id);

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.OUT_FOR_DELIVERY,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const riderMarkDelivered = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can mark delivered');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const resolvedRiderId = await resolveRiderId(user);
  if (!resolvedRiderId) throwError(400, 'Missing rider id');
  if (order.assigned_rider_id !== resolvedRiderId) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await releaseRiderCapacity(session, resolvedRiderId, order.water_quantity);
    assertTransition(order.status, ORDER_STATUS.DELIVERED);
    order.status = ORDER_STATUS.DELIVERED;
    order.dispatch_queued_at = null;
    order.dispatch_after_minutes = null;
    order.dispatch_scheduled_for = null;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.DELIVERED, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.DELIVERED,
      session,
    });

    if (order.payment_method === PAYMENT_METHOD.COD) {
      assertTransition(order.status, ORDER_STATUS.PENDING_PAYMENT);
      order.status = ORDER_STATUS.PENDING_PAYMENT;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.PENDING_PAYMENT, user._id);
      await createOrderNotificationForOrder({
        order,
        status: ORDER_STATUS.PENDING_PAYMENT,
        session,
      });
    } else if (
      order.payment_method === PAYMENT_METHOD.GCASH &&
      order.payment_status === ORDER_PAYMENT_STATUS.PAID
    ) {
      assertTransition(order.status, ORDER_STATUS.COMPLETED);
      order.status = ORDER_STATUS.COMPLETED;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.COMPLETED, user._id);
      await createOrderNotificationForOrder({
        order,
        status: ORDER_STATUS.COMPLETED,
        session,
      });
    }

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.PENDING_PAYMENT,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const riderCancelPickup = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can cancel pickup');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const resolvedRiderId = await resolveRiderId(user);
  if (!resolvedRiderId) throwError(400, 'Missing rider id');
  if (order.assigned_rider_id !== resolvedRiderId) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await releaseRiderCapacity(session, resolvedRiderId, order.water_quantity);
    assertTransition(order.status, ORDER_STATUS.PENDING);
    order.status = ORDER_STATUS.PENDING;
    order.assigned_rider_id = null;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.PENDING, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.PENDING,
      session,
    });

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.PENDING,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};


export const riderMarkPendingPayment = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can update payment status');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const resolvedRiderId = await resolveRiderId(user);
  if (!resolvedRiderId) throwError(400, 'Missing rider id');
  if (order.assigned_rider_id !== resolvedRiderId) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.PENDING_PAYMENT);
    order.status = ORDER_STATUS.PENDING_PAYMENT;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.PENDING_PAYMENT, user._id);
    await createOrderNotificationForOrder({
      order,
      status: ORDER_STATUS.PENDING_PAYMENT,
      session,
    });

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.PENDING_PAYMENT,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const confirmPaymentAndComplete = async ({ user, orderId, source }) => {
  // source: 'COD' or 'WEBHOOK'
  if (source === 'COD' && user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can confirm COD payments');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (order.payment_status === ORDER_PAYMENT_STATUS.PAID) {
      throwError(400, 'Payment already confirmed');
    }

    order.payment_status = ORDER_PAYMENT_STATUS.PAID;
    if (order.status !== ORDER_STATUS.COMPLETED) {
      assertTransition(order.status, ORDER_STATUS.COMPLETED);
      order.status = ORDER_STATUS.COMPLETED;
      await addHistory(session, order._id, ORDER_STATUS.COMPLETED, user._id);
    }

    await order.save({ session });

    // Ensure COD confirmations are represented in payment records for admin analytics.
    if (source === 'COD' || order.payment_method === PAYMENT_METHOD.COD) {
      const existingPayment = await Payment.findOne({ order_id: order._id }).session(session);
      if (existingPayment) {
        existingPayment.method = PAYMENT_METHOD.COD;
        existingPayment.status = PAYMENT_STATUS.PAID;
        existingPayment.amount = Number(order.total_amount || existingPayment.amount || 0);
        existingPayment.currency = existingPayment.currency || 'PHP';
        existingPayment.paid_at = new Date();
        await existingPayment.save({ session });
      } else {
        await Payment.create(
          [
            {
              order_id: order._id,
              method: PAYMENT_METHOD.COD,
              status: PAYMENT_STATUS.PAID,
              amount: Number(order.total_amount || 0),
              currency: 'PHP',
              paid_at: new Date(),
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();
    await sendOrderStatusPush({
      order,
      status: ORDER_STATUS.COMPLETED,
    });
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const handlePaymongoWebhook = async ({ event, raw }) => {
  const type = event?.data?.attributes?.type;
  const paymentIntentId = event?.data?.attributes?.data?.id;

  let pushOrder = null;
  let pushStatus = null;
  let failedOrder = null;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payment = await Payment.findOne({ paymongo_payment_intent_id: paymentIntentId });
    if (!payment) throwError(404, 'Payment not found');

    await PaymentEvent.create([{
      payment_id: payment._id,
      event_type: type || 'unknown',
      payload: event,
      received_at: new Date(),
    }], { session });

    if (type === 'payment.paid') {
      payment.status = PAYMENT_STATUS.PAID;
      payment.paid_at = new Date();
      await payment.save({ session });

      const order = await Order.findById(payment.order_id);
      if (order) {
        order.payment_status = ORDER_PAYMENT_STATUS.PAID;

        if (order.status === ORDER_STATUS.DELIVERED) {
          assertTransition(order.status, ORDER_STATUS.COMPLETED);
          order.status = ORDER_STATUS.COMPLETED;
          await addHistory(session, order._id, ORDER_STATUS.COMPLETED, payment.order_id);
          await createOrderNotificationForOrder({
            order,
            status: ORDER_STATUS.COMPLETED,
            session,
          });
          pushOrder = order;
          pushStatus = ORDER_STATUS.COMPLETED;
        }

        await order.save({ session });
      }
    }


    if (type === 'payment.failed') {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save({ session });

      const order = await Order.findById(payment.order_id);
      if (order) {
        order.payment_status = ORDER_PAYMENT_STATUS.FAILED;
        await order.save({ session });
        failedOrder = order;
      }
    }

    await session.commitTransaction();
    if (pushOrder && pushStatus) {
      await sendOrderStatusPush({ order: pushOrder, status: pushStatus });
    }
    if (failedOrder) {
      const orderCode = failedOrder.order_code || failedOrder._id;
      await createCustomOrderNotificationForOrder({
        order: failedOrder,
        status: failedOrder.status,
        title: 'Payment failed',
        message: `Payment failed for order ${orderCode}. Please try again.`,
      });

      const customer = await Customer.findById(failedOrder.customer_id).select('_id user_id');
      if (customer?.user_id) {
        await sendPushToUser({
          userId: customer.user_id,
          title: 'Payment failed',
          body: `Payment failed for order ${orderCode}. Please try again.`,
          data: {
            type: 'order_status',
            orderId: String(failedOrder._id),
            status: String(failedOrder.status || ''),
          },
        });
      }
    }
    return { ok: true };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
