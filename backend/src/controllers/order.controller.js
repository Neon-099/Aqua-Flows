// e:\Aquaflow\backend\src\controllers\order.controller.js
import * as orderService from '../services/order.service.js';

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
      req.user?.rider_id ||
      req.user?._id;

    const result = await orderService.listOrdersForRider({
      user: req.user,
      riderId,
    });
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
    const result = await orderService.confirmOrder({
      user: req.user,
      orderId: req.params.id,
    });
    return ok(res, result);
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

    const result = await orderService.assignRider({
      user: req.user,
      orderId: req.params.id,
      riderId,
    });
    return ok(res, result);
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
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const riderStartDelivery = async (req, res, next) => {
  try {
    const result = await orderService.riderStartDelivery({
      user: req.user,
      orderId: req.params.id,
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
