import express from 'express';
import {
    createOrder,
    getOrderById,
    listOrders,
    cancelOrder,
    assignRider,
    startDelivery,
    confirmPayment,
    markPendingPayment,
  confirmPayment,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, listOrders);
router.get('/:id', protect, getOrderById);

router.put('/:id/cancel', protect, authorize('customer', 'user'), cancelOrder);
router.put('/:id/confirm', protect, authorize('staff', 'admin'), confirmOrder);
router.put('/:id/assign_rider', protect, authorize('staff', 'admin'), assignRider);

router.put('/:id/start_delivery', protect, authorize('rider'), startDelivery);
router.put('/:id/mark_pending_payment', protect, authorize('rider'), markPendingPayment);
router.put('/:id/confirm_payment', protect, authorize('rider'), confirmPayment);

export default router;
