// e:\Aquaflow\backend\src\controllers\order.controller.js
import * as orderService from '../services/order.service.js';
import { enqueueTask } from '../utils/taskQueue.js';

const ok = (res, data, meta = {}) =>
  res.status(200).json({ success: true, data, meta });

export const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder({
      user: req.user,
      payload: req.body,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const createGcashPreparation = async (req, res, next) => {
  try {
    const result = await orderService.createGcashPreparation({
      user: req.user,
      payload: req.body,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const emitOrderUpdate = (req, order, extra = {}) => {
  const io = req.app.get('io');
  if (!io || !order?._id) return;
  io.to(`order:${order._id}`).emit('order:update', {
    orderId: order._id,
    status: order.status,
    paymentStatus: order.payment_status || null,
    timestamp: new Date().toISOString(),
    ...extra,
  });
};


export const getOrderById = async (req, res, next) => {
  try {
    const result = await orderService.getOrderById({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const listOrdersForRider = async (req, res, next) => {
  try {
    const riderId =
      req.query.rider_id ||
      req.query.riderId ||
      req.user?.rider_id;

    const result = await orderService.listOrdersForRider({
      user: req.user,
      riderId,
    });
    return ok(res, result, { count: result.length });
  } catch (err) {
    next(err);
  }
};

export const listOrdersForStaff = async (req, res, next) => {
  try {
    const result = await orderService.listOrdersForStaff({ user: req.user });
    return ok(res, result, { count: result.length });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.cancelOrder({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    const taskId = enqueueTask({
      type: 'confirmOrder',
      payload: { user: req.user, orderId: req.params.id}
    });
    //THE STATUS STILL IN QUEUED
    emitOrderUpdate(req, { _id: req.params.id, status: 'QUEUED'}, { source: 'confirmOrderQueued'});
    return res.status(200).json({success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const assignRider = async (req, res, next) => {
  try {
    const riderId = req.body?.rider_id;
    if (!riderId) {
      return res.status(400).json({ success: false, message: 'Missing rider_id' });
    }
    //TASK QUEUED WORKER
    const taskId = enqueueTask({
      type: 'assignRider',
      payload: {user: req.user, orderId: req.params.id, riderId},
    });
    emitOrderUpdate(req, { _id: req.params.id, status: 'QUEUED' }, { source: 'assignRiderQueued' });
    return res.status(202).json({ success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const autoAssignRider = async (req, res, next) => {
  try {
    const result = await orderService.autoAssignRider({
      user: req.user,
      orderId: req.params.id,
      weights: req.body?.weights,
    });
    const order = result?.order || result;
    emitOrderUpdate(req, order, { source: 'autoAssignRider'});
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const autoAssignPreview = async (req, res, next) => {
  try {
    const result = await orderService.autoAssignPreview({
      user: req.user,
      orderId: req.params.id,
      weights: req.body?.weights,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const riderStartDelivery = async (req, res, next) => {
  try {
    const taskId = enqueueTask({
      type: 'riderStartDelivery',
      payload: {user: req.user, orderId: req.params.id}
    })

    emitOrderUpdate(
      req,
      { _id: req.params.id, status: 'QUEUED' },
      { source: 'riderStartDeliveryQueued' }
    );
    return res.status(202).json({success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const queueDispatch = async (req, res, next) => {
  try {
    const taskId = enqueueTask({
      type: 'queueDispatch',
      payload: {user: req.user, orderId: req.params.id, minutes: req.body?.minutes},
    })
    return res.status(202).json({success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const dispatchOrder = async (req, res, next) => {
  try {
    const taskId = enqueueTask({
      type: 'dispatchOrder', 
      payload: {user: req.user, orderId: req.params.id},
    });
    return res.status(202).json({success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const riderPickup = async (req, res, next) => {
  try {
    const taskId = enqueueTask({
      type: 'riderPickup',
      payload: {user: req.user, orderId: req.params.id},
    })
    return res.status(202).json({success: true, queued: true, taskId});
  } catch (err) {
    next(err);
  }
};

export const riderBulkPickup = async (req, res, next) => {
  try {
    const orderIds = req.body?.order_ids || req.body?.orderIds || [];
    const result = await orderService.riderBulkPickup({
      user: req.user,
      orderIds,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const riderBulkStartDelivery = async (req, res, next) => {
  try {
    const orderIds = req.body?.order_ids || req.body?.orderIds || [];
    const result = await orderService.riderBulkStartDelivery({
      user: req.user,
      orderIds,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const riderCancelPickup = async (req, res, next) => {
  try {
    const result = await orderService.riderCancelPickup({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const markDelivered = async (req, res, next) => {
  try {
    const result = await orderService.riderMarkDelivered({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const riderMarkPendingPayment = async (req, res, next) => {
  try {
    const result = await orderService.riderMarkPendingPayment({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const confirmPaymentAndComplete = async (req, res, next) => {
  try {
    const result = await orderService.confirmPaymentAndComplete({
      user: req.user,
      orderId: req.params.id,
      source: 'COD',
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};
