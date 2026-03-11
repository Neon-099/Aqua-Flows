import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  listOrderNotifications,
  markOrderNotificationsRead,
  getUnreadNotificationCount,
  listMessageNotifications,
  markMessageNotificationsRead,
  getUnreadMessageNotificationCount,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/orders', protect, authorize('customer', 'user'), listOrderNotifications);
router.put('/orders/mark-read', protect, authorize('customer', 'user'), markOrderNotificationsRead);
router.get('/orders/unread-count', protect, authorize('customer', 'user'), getUnreadNotificationCount);

router.get('/messages', protect, authorize('staff', 'rider', 'customer', 'user', 'admin'), listMessageNotifications);
router.put('/messages/mark-read', protect, authorize('staff', 'rider', 'customer', 'user', 'admin'), markMessageNotificationsRead);
router.get('/messages/unread-count', protect, authorize('staff', 'rider', 'customer', 'user', 'admin'), getUnreadMessageNotificationCount);

export default router;
