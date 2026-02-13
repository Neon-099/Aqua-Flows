import admin from 'firebase-admin';
import { env } from './env.js';

let initialized = false;

const buildCredential = () => {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  return admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY,
  });
};

export const initFirebaseAdmin = () => {
  if (initialized) return;

  const credential = buildCredential();
  if (!credential) {
    console.warn('FCM disabled: Firebase credentials are missing.');
    return;
  }

  admin.initializeApp({ credential });
  initialized = true;
  console.log('Firebase Admin initialized.');
};

export const isFirebaseReady = () => initialized;

export const getFirebaseMessaging = () => {
  if (!initialized) {
    initFirebaseAdmin();
  }
  if (!initialized) {
    return null;
  }
  return admin.messaging();
};

