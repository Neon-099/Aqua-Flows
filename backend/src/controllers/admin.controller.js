import * as adminService from '../services/admin.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  const startedAt = Date.now();
  try {
    console.log(`[ADMIN][createUser] start role=${req.body?.role} email=${req.body?.email || ''}`);
    const user = await adminService.createUser(req.body);
    console.log(`[ADMIN][createUser] success userId=${user?._id || ''} ${Date.now() - startedAt}ms`);
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error(`[ADMIN][createUser] fail ${Date.now() - startedAt}ms: ${error?.message || error}`);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const startedAt = Date.now();
  try {
    console.log(`[ADMIN][updateUser] start userId=${req.params.id}`);
    const user = await adminService.updateUser(req.params.id, req.body);
    console.log(`[ADMIN][updateUser] success userId=${req.params.id} ${Date.now() - startedAt}ms`);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(`[ADMIN][updateUser] fail userId=${req.params.id} ${Date.now() - startedAt}ms: ${error?.message || error}`);
    next(error);
  }
};

export const archiveUser = async (req, res, next) => {
  try {
    const user = await adminService.archiveUser(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const restoreUser = async (req, res, next) => {
  try {
    const user = await adminService.restoreUser(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

export const getFeatureConfig = async (req, res, next) => {
  try {
    const data = await adminService.getFeatureConfig();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOverviewToday = async (req, res, next) => {
  try {
    const data = await adminService.getOverviewToday({
      tz: req.query?.tz,
      dateScope: req.query?.dateScope,
      dateFrom: req.query?.dateFrom,
      dateTo: req.query?.dateTo,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const data = await adminService.listAdminOrders(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const data = await adminService.listAdminPayments(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getExceptions = async (req, res, next) => {
  try {
    const data = await adminService.listAdminExceptions(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const recheckPayment = async (req, res, next) => {
  try {
    const data = await adminService.recheckAdminPayment({
      id: req.params.id,
      actorUserId: req.user?._id,
      reason: req.body?.reason,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const resolvePayment = async (req, res, next) => {
  try {
    const data = await adminService.resolveAdminPayment({
      id: req.params.id,
      actorUserId: req.user?._id,
      action: req.body?.action,
      reason: req.body?.reason,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderByAdmin = async (req, res, next) => {
  try {
    const order = await adminService.cancelAdminOrder({
      id: req.params.id,
      actorUserId: req.user?._id,
      reason: req.body?.reason,
    });
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const reopenOrderByAdmin = async (req, res, next) => {
  try {
    const order = await adminService.reopenAdminOrder({
      id: req.params.id,
      actorUserId: req.user?._id,
      reason: req.body?.reason,
    });
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
