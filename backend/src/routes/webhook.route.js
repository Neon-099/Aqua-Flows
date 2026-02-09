// e:\Aquaflow\backend\src\routes\webhook.route.js
import express from 'express';
import { handlePaymongoWebhook } from '../controllers/paymongo.webhook.controller.js';

const router = express.Router();

router.post('/payments', handlePaymongoWebhook);

export default router;
