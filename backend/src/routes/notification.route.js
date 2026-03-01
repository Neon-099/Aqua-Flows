import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  listOrderNotifications,
  markOrderNotificationsRead,
  getUnreadNotificationCount,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/orders', protect, authorize('customer'), listOrderNotifications);
router.put('/orders/mark-read', protect, authorize('customer'), markOrderNotificationsRead);
router.get('/orders/unread-count', protect, authorize('customer'), getUnreadNotificationCount);

export default router;
