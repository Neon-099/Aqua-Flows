import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { registerToken, unregisterToken, sendTestPush } from '../controllers/fcm.controller.js';

const router = express.Router();

router.post('/token', protect, registerToken);
router.delete('/token', protect, unregisterToken);
router.post('/test', protect, sendTestPush);

export default router;

