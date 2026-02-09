// e:\Aquaflow\backend\src\controllers\paymongo.webhook.controller.js
import * as orderService from '../services/order.service.js';
import { verifyPayMongoWebhook } from '../services/paymongo.service.js';

export const handlePaymongoWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || '';
    const signature = req.headers['paymongo-signature'];

    const verified = verifyPayMongoWebhook(rawBody, signature);
    if (!verified) {
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    const result = await orderService.handlePaymongoWebhook({
      event: req.body,
      raw: rawBody,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
