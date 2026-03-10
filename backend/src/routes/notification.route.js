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

router.get('/orders', protect, authorize('customer'), listOrderNotifications);
router.put('/orders/mark-read', protect, authorize('customer'), markOrderNotificationsRead);
router.get('/orders/unread-count', protect, authorize('customer'), getUnreadNotificationCount);

router.get('/messages', protect, authorize('staff'), listMessageNotifications);
router.put('/messages/mark-read', protect, authorize('staff'), markMessageNotificationsRead);
router.get('/messages/unread-count', protect, authorize('staff'), getUnreadMessageNotificationCount);

export default router;
