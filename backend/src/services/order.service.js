// e:\Aquaflow\backend\src\services\order.service.js
import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import Payment from '../models/Payment.model.js';
import PaymentEvent from '../models/PaymentEvent.model.js';
import OrderStatusHistory from '../models/OrderStatusHistory.model.js';
import OrderAssignment from '../models/OrderAssignment.model.js';
import {
  ORDER_STATUS,
  ORDER_PAYMENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  USER_ROLE,
} from '../constants/order.constants.js';
import { assertTransition } from './order.transition.js';
import { createPaymentIntent } from './paymongo.service.js';
import { computeEtaFromAddress } from '../utils/eta.js';


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

export const createOrder = async ({ user, payload }) => {
  const { customer_id, water_quantity, total_amount, payment_method, gallon_type } = payload;

  if (!water_quantity || !total_amount || !payment_method || !gallon_type) {
    throwError(400, 'Missing required fields');
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

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.create([{
      customer_id: resolvedCustomerId,
      water_quantity,
      gallon_type,
      total_amount,
      payment_method,
      status: ORDER_STATUS.PENDING,
      payment_status: ORDER_PAYMENT_STATUS.UNPAID,
    }], { session });

    await addHistory(session, order[0]._id, ORDER_STATUS.PENDING, user._id);

    let payment = null;
    if (payment_method === PAYMENT_METHOD.GCASH) {
      const intent = await createPaymentIntent({
        amount: total_amount,
        currency: 'PHP',
        description: `Order ${order[0]._id}`,
      });

      payment = await Payment.create([{
        order_id: order[0]._id,
        method: PAYMENT_METHOD.GCASH,
        status: PAYMENT_STATUS.PENDING,
        amount: total_amount,
        currency: 'PHP',
        paymongo_payment_intent_id: intent.id,
      }], { session });

      order[0].payment_status = ORDER_PAYMENT_STATUS.PENDING;
      await order[0].save({ session });
    }

    await session.commitTransaction();

    return {
      order: order[0],
      payment: payment ? payment[0] : null,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
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
  if (![USER_ROLE.RIDER, USER_ROLE.STAFF, USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.USER].includes(user.role)) {
    throwError(403, 'Not authorized');
  }

  if (user.role === USER_ROLE.RIDER) {
    const resolvedRiderId = riderId || user.rider_id || user._id;
    if (!resolvedRiderId) throwError(400, 'Missing rider id');
    return await Order.find({ assigned_rider_id: resolvedRiderId })
      .sort({ status: 1, updated_at: -1 });
  }

  if (user.role === USER_ROLE.CUSTOMER || user.role === USER_ROLE.USER) {
    const customer = await Customer.findOne({ user_id: user._id });
    if (!customer) throwError(404, 'Customer not found');
    return await Order.find({ customer_id: customer._id })
      .sort({ created_at: -1 });
  }

  if (riderId) {
    return await Order.find({ assigned_rider_id: riderId })
      .sort({ status: 1, updated_at: -1 });
  }

  return await Order.find().sort({ created_at: -1 });
};

export const cancelOrder = async ({ user, orderId }) => {
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  if (user.role !== USER_ROLE.CUSTOMER && user.role !== USER_ROLE.USER) {
    throwError(403, 'Only customers can cancel orders');
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throwError(400, 'Order can only be cancelled while PENDING');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.CANCELLED);
    order.status = ORDER_STATUS.CANCELLED;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.CANCELLED, user._id);

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const confirmOrder = async ({ user, orderId }) => {
  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (user.role === USER_ROLE.STAFF) {
      assertTransition(order.status, ORDER_STATUS.CONFIRMED);
      order.status = ORDER_STATUS.CONFIRMED;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.CONFIRMED, user._id);

      // auto-assign after staff accept
      const { rider } = await autoAssignRider({ user, orderId });
      order.assigned_rider_id = rider._id;
      await order.save({ session });

    } else if (user.role === USER_ROLE.RIDER) {
      //IF RIDER ACCEPTS IT
      assertTransition(order.status, ORDER_STATUS.PICKUP);
      order.status = ORDER_STATUS.PICKUP;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.PICKUP, user._id);

      await applyEtaToOrder(session, order);
    } else {
      throwError(403, 'Not authorized to accept order');
    }

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
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

    order.assigned_rider_id = riderId;
    await order.save({ session });

    await OrderAssignment.create([{
      order_id: orderId,
      rider_id: riderId,
      assigned_by: user._id,
      assigned_at: new Date(),
    }], { session });

    await session.commitTransaction();
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

  const order = await Order.findById(orderId);
  if(!order) throwError(404, 'Order not found');

  const gallons = order.water_quantity;
  const w = {
    load: weights?.load ?? 0.5,
    orders: weights?.orders ?? 0.4,
    capacity: weights?.capacity ?? 0.1,
    distance: weights?.distance ?? 0.0,
  };

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Eligible riders query + scoring in DB
    const candidates = await Rider.aggregate([
      {
        $match: {
          status: 'active',
          $expr: {
            $gte: [
              { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
              gallons
            ]
          }
        }
      },
      {
        $addFields: {
          remainingCapacity: { $subtract: ['$maxCapacityGallons', '$currentLoadGallons'] },
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [w.load, { $divide: [1, { $add: ['$currentLoadGallons', 1] }] }] },
              { $multiply: [w.orders, { $divide: [1, { $add: ['$activeOrdersCount', 1] }] }] },
              { $multiply: [w.capacity, '$remainingCapacity'] },
              { $multiply: [w.distance, 0] }
            ]
          }
        }
      },
      { $sort: { score: -1, _id: 1 } },
      { $limit: 1 }
    ]).session(session);

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

    return { order, rider: updatedRider };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

const applyEtaToOrder = async (session, order) => {
  const customer = await Customer.findById(order.customer_id);
  if (!customer) return;

  const eta = computeEtaFromAddress(customer.default_address);
  if (!eta) return;

  order.eta_minutes_min = eta.eta_minutes_min;
  order.eta_minutes_max = eta.eta_minutes_max;
  order.eta_text = eta.eta_text;
  order.eta_last_calculated_at = eta.eta_last_calculated_at;
  await order.save({ session });
};


export const riderStartDelivery = async ({ user, orderId }) => {
  if (user.role !== USER_ROLE.RIDER) {
    throwError(403, 'Only riders can start delivery');
  }

  const order = await Order.findById(orderId);
  if (!order) throwError(404, 'Order not found');

  if (order.assigned_rider_id !== user.rider_id && order.assigned_rider_id !== user._id) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.OUT_FOR_DELIVERY);
    order.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    await applyEtaToOrder(session, order);
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.OUT_FOR_DELIVERY, user._id);

    await session.commitTransaction();
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

  if (order.assigned_rider_id !== user.rider_id && order.assigned_rider_id !== user._id) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.DELIVERED);
    order.status = ORDER_STATUS.DELIVERED;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.DELIVERED, user._id);

    if (order.payment_method === PAYMENT_METHOD.COD) {
      assertTransition(order.status, ORDER_STATUS.PENDING_PAYMENT);
      order.status = ORDER_STATUS.PENDING_PAYMENT;
      await order.save({ session });
      await addHistory(session, order._id, ORDER_STATUS.PENDING_PAYMENT, user._id);
    }

    await session.commitTransaction();
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

  if (order.assigned_rider_id !== user.rider_id && order.assigned_rider_id !== user._id) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.PENDING);
    order.status = ORDER_STATUS.PENDING;
    order.assigned_rider_id = null;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.PENDING, user._id);

    await session.commitTransaction();
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

  if (order.assigned_rider_id !== user.rider_id && order.assigned_rider_id !== user._id) {
    throwError(403, 'Order not assigned to this rider');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    assertTransition(order.status, ORDER_STATUS.PENDING_PAYMENT);
    order.status = ORDER_STATUS.PENDING_PAYMENT;
    await order.save({ session });
    await addHistory(session, order._id, ORDER_STATUS.PENDING_PAYMENT, user._id);

    await session.commitTransaction();
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

    await session.commitTransaction();
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
      }
    }

    await session.commitTransaction();
    return { ok: true };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
