// e:\Aquaflow\backend\src\services\paymongo.service.js
import crypto from 'crypto';
import { env } from '../config/env.js';

const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

const getAuthHeader = () => {
  const secretKey = env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    const err = new Error('PAYMONGO_SECRET_KEY is missing');
    err.statusCode = 500;
    throw err;
  }
  const encoded = Buffer.from(secretKey + ':').toString('base64');
  return `Basic ${encoded}`;
};

export const createPaymentIntent = async ({ amount, currency = 'PHP', description }) => {
  const body = {
    data: {
      attributes: {
        amount: Math.round(amount * 100), // PayMongo expects centavos
        currency,
        payment_method_allowed: ['gcash'],
        description,
      },
    },
  };

  const res = await fetch(`${PAYMONGO_BASE_URL}/payment_intents`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json();
  if (!res.ok) {
    const err = new Error(payload?.errors?.[0]?.detail || 'PayMongo error');
    err.statusCode = 502;
    throw err;
  }

  return {
    id: payload.data.id,
    status: payload.data.attributes.status,
    amount: payload.data.attributes.amount,
    currency: payload.data.attributes.currency,
  };
};

// Optional: signature verification if PayMongo sends one.
export const verifyPayMongoWebhook = (rawBody, signatureHeader) => {
  const secret = env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return true; // allow if not configured (dev)
  if (!signatureHeader) return false;

  // Example header: t=timestamp, v1=signature
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
};