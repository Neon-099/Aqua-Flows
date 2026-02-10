// e:\Aquaflow\backend\src\controllers\rider.controller.js
import * as riderService from '../services/rider.service.js';

const ok = (res, data, meta = {}) =>
  res.status(200).json({ success: true, data, meta });

export const createRider = async (req, res, next) => {
  try {
    const result = await riderService.createRider({
      user: req.user,
      payload: req.body,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listRiders = async (req, res, next) => {
  try {
    const result = await riderService.listRiders({ user: req.user });
    return ok(res, result, { count: result.length });
  } catch (err) {
    next(err);
  }
};

export const getRiderById = async (req, res, next) => {
  try {
    const result = await riderService.getRiderById({
      user: req.user,
      riderId: req.params.id,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { is_available } = req.body;
    const result = await riderService.updateRiderAvailability({
      user: req.user,
      riderId: req.params.id,
      is_available,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};
