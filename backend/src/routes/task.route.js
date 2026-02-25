import express from 'express';
import { getTask } from '../controllers/task.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:id', protect, authorize('staff', 'admin'), getTask);

export default router;
