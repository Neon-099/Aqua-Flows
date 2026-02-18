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
    checkout_url:
      payload?.data?.attributes?.next_action?.redirect?.url ||
      payload?.data?.attributes?.next_action?.redirect?.checkout_url ||
      null,
  };
};

export const getPaymentIntent = async ({ paymentIntentId }) => {
  if (!paymentIntentId) {
    const err = new Error('paymentIntentId is required');
    err.statusCode = 400;
    throw err;
  }

  const res = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentIntentId}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  const payload = await res.json();
  if (!res.ok) {
    const err = new Error(payload?.errors?.[0]?.detail || 'PayMongo error');
    err.statusCode = 502;
    throw err;
  }

  const attrs = payload?.data?.attributes || {};
  return {
    id: payload?.data?.id || paymentIntentId,
    status: attrs.status || null,
    amount: attrs.amount || null,
    currency: attrs.currency || null,
    checkout_url:
      attrs?.next_action?.redirect?.url ||
      attrs?.next_action?.redirect?.checkout_url ||
      null,
  };
};

export const createCheckoutSession = async ({
  amount,
  currency = 'PHP',
  description,
  successUrl,
  cancelUrl,
  paymentMethodType = 'gcash',
}) => {
  const method = String(paymentMethodType || 'gcash').toLowerCase();
  if (!['gcash', 'qrph'].includes(method)) {
    const err = new Error('Unsupported payment method type');
    err.statusCode = 400;
    throw err;
  }

  const body = {
    data: {
      attributes: {
        line_items: [
          {
            currency,
            amount: Math.round(amount * 100),
            name: description || 'AquaFlow prepaid checkout',
            quantity: 1,
          },
        ],
        payment_method_types: [method],
        success_url: successUrl,
        cancel_url: cancelUrl,
        description: description || 'AquaFlow prepaid checkout',
      },
    },
  };

  const res = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json();
  if (!res.ok) {
    const err = new Error(payload?.errors?.[0]?.detail || 'PayMongo checkout session error');
    err.statusCode = 502;
    throw err;
  }

  const attrs = payload?.data?.attributes || {};
  return {
    id: payload?.data?.id || null,
    checkout_url: attrs.checkout_url || null,
    status: attrs.payment_intent?.attributes?.status || attrs.status || null,
    amount: attrs.line_items?.[0]?.amount || null,
    currency: attrs.line_items?.[0]?.currency || currency,
  };
};

export const getCheckoutSession = async ({ checkoutSessionId }) => {
  if (!checkoutSessionId) {
    const err = new Error('checkoutSessionId is required');
    err.statusCode = 400;
    throw err;
  }

  const res = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions/${checkoutSessionId}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  const payload = await res.json();
  if (!res.ok) {
    const err = new Error(payload?.errors?.[0]?.detail || 'PayMongo checkout session lookup error');
    err.statusCode = 502;
    throw err;
  }

  const attrs = payload?.data?.attributes || {};
  const payment = Array.isArray(attrs.payments) ? attrs.payments[0] : null;
  const paymentIntentId =
    payment?.attributes?.payment_intent_id ||
    attrs?.payment_intent?.id ||
    null;
  const status =
    payment?.attributes?.status ||
    attrs?.payment_intent?.attributes?.status ||
    attrs?.status ||
    null;
  const amount =
    payment?.attributes?.amount ||
    attrs?.line_items?.[0]?.amount ||
    null;

  return {
    id: payload?.data?.id || checkoutSessionId,
    status,
    amount,
    currency: attrs?.line_items?.[0]?.currency || null,
    payment_intent_id: paymentIntentId,
    checkout_url: attrs?.checkout_url || null,
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
