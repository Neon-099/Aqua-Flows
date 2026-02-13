import PushToken from '../models/PushToken.model.js';
import { getFirebaseMessaging, isFirebaseReady } from '../config/firebase.js';

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

export const registerPushToken = async ({ userId, token, platform = 'android' }) => {
  if (!userId || !token) {
    const err = new Error('userId and token are required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await PushToken.findOne({ token });
  if (existing) {
    existing.userId = userId;
    existing.platform = platform;
    existing.isActive = true;
    existing.lastSeenAt = new Date();
    await existing.save();
    return existing;
  }

  return PushToken.create({
    userId,
    token,
    platform,
    isActive: true,
    lastSeenAt: new Date(),
  });
};

export const unregisterPushToken = async ({ userId, token }) => {
  if (!userId || !token) {
    const err = new Error('userId and token are required');
    err.statusCode = 400;
    throw err;
  }

  await PushToken.deleteOne({ userId, token });
};

export const getActiveUserTokens = async (userId) => {
  const rows = await PushToken.find({ userId, isActive: true }).select('token');
  return rows.map((r) => r.token);
};

export const sendPushToTokens = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0, skipped: true };
  }

  if (!isFirebaseReady()) {
    return { sent: 0, failed: tokens.length, skipped: true, reason: 'fcm_not_configured' };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return { sent: 0, failed: tokens.length, skipped: true, reason: 'fcm_not_initialized' };
  }

  const payload = {
    tokens,
    notification: { title, body },
    data,
  };

  const result = await messaging.sendEachForMulticast(payload);
  const invalidTokens = [];
  result.responses.forEach((res, idx) => {
    if (!res.success && INVALID_TOKEN_ERRORS.has(res.error?.code)) {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: invalidTokens } });
  }

  return {
    sent: result.successCount,
    failed: result.failureCount,
    skipped: false,
  };
};

export const sendPushToUser = async ({ userId, title, body, data = {} }) => {
  const tokens = await getActiveUserTokens(userId);
  return sendPushToTokens({ tokens, title, body, data });
};

