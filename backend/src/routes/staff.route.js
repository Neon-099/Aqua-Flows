import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { listOrdersForStaff } from '../controllers/order.controller.js';

const router = express.Router();

router.get('/orders', protect, authorize('staff'), listOrdersForStaff);

export default router;
