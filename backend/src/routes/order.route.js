import express from 'express';
import {
  createOrder,
  createGcashPreparation,
  getOrderById,
  listOrdersForRider,
  cancelOrder,
  assignRider,
  markDelivered,
  riderStartDelivery,
  riderPickup,
  riderMarkPendingPayment,
  queueDispatch,
  dispatchOrder,
  confirmOrder,
  autoAssignRider,
  confirmPaymentAndComplete,
  riderCancelPickup,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.post('/gcash_prepare', protect, authorize('customer'), createGcashPreparation);
router.get('/', protect, listOrdersForRider);
router.get('/:id', protect, getOrderById);

router.put('/:id/cancel', protect, authorize('customer', 'user', 'staff', 'admin'), cancelOrder);
router.put('/:id/confirm', protect, authorize('staff', 'rider'), confirmOrder);
router.put('/:id/assign_rider', protect, authorize('staff'), assignRider);
router.put('/:id/auto_assign', protect, authorize('staff'), autoAssignRider);
router.put('/:id/cancel_pickup', protect, authorize('rider'), riderCancelPickup);
router.put('/:id/pickup', protect, authorize('rider'), riderPickup);
router.put('/:id/queue_dispatch', protect, authorize('staff'), queueDispatch);
router.put('/:id/dispatch', protect, authorize('staff'), dispatchOrder);
router.put('/:id/start_delivery', protect, authorize('rider'), riderStartDelivery);
router.put('/:id/mark_delivered', protect, authorize('rider'), markDelivered);
router.put('/:id/mark_pending_payment', protect, authorize('rider'), riderMarkPendingPayment);
router.put('/:id/confirm_payment', protect, authorize('rider'), confirmPaymentAndComplete);

export default router;
