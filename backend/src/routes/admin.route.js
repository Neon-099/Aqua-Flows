import express from 'express';
import {
  archiveUser,
  cancelOrderByAdmin,
  createUser,
  getExceptions,
  getFeatureConfig,
  getOrders,
  getOverviewToday,
  getPayments,
  getUsers,
  recheckPayment,
  reopenOrderByAdmin,
  resolvePayment,
  restoreUser,
  updateUser,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateCreateUser, validateUpdateUser } from '../validators/admin.validator.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.post('/users', validateCreateUser, createUser);
router.put('/users/:id', validateUpdateUser, updateUser);
router.patch('/users/:id/archive', archiveUser);
router.patch('/users/:id/restore', restoreUser);
router.get('/config', getFeatureConfig);
router.get('/overview/today', getOverviewToday);
router.get('/orders', getOrders);
router.get('/payments', getPayments);
router.get('/exceptions', getExceptions);
router.post('/payments/:id/recheck', recheckPayment);
router.post('/payments/:id/resolve', resolvePayment);
router.post('/orders/:id/cancel', cancelOrderByAdmin);
router.post('/orders/:id/reopen', reopenOrderByAdmin);

export default router;
