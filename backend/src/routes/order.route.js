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
  riderBulkPickup,
  riderBulkStartDelivery,
  autoAssignPreview,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.post('/gcash_prepare', protect, authorize('customer'), createGcashPreparation);
router.get('/', protect, listOrdersForRider);
router.get('/:id', protect, getOrderById);

router.put('/:id/cancel', protect, authorize('customer', 'staff', 'admin'), cancelOrder);

//STAFF
router.put('/:id/assign_rider', protect, authorize('staff'), assignRider);
router.put('/:id/auto_assign', protect, authorize('staff'), autoAssignRider);
router.post('/:id/auto_assign_preview', protect, authorize('staff'), autoAssignPreview);
router.put('/:id/queue_dispatch', protect, authorize('staff'), queueDispatch);
router.put('/:id/dispatch', protect, authorize('staff'), dispatchOrder);
router.put('/:id/confirm', protect, authorize('staff', 'rider'), confirmOrder);

//RIDER
router.put('/:id/cancel_pickup', protect, authorize('rider'), riderCancelPickup);
router.put('/bulk/pickup', protect, authorize('rider'), riderBulkPickup);
router.put('/:id/pickup', protect, authorize('rider'), riderPickup);
router.put('/bulk/start_delivery', protect, authorize('rider'), riderBulkStartDelivery);
router.put('/:id/start_delivery', protect, authorize('rider'), riderStartDelivery);
router.put('/:id/mark_delivered', protect, authorize('rider'), markDelivered);
router.put('/:id/mark_pending_payment', protect, authorize('rider'), riderMarkPendingPayment);
router.put('/:id/confirm_payment', protect, authorize('rider'), confirmPaymentAndComplete);

export default router;
