// e:\Aquaflow\backend\src\config\env.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  path.resolve(__dirname, '../../.env.development'),
  path.resolve(__dirname, '../../.env')
];

let loaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn("Warning: .env.development/.env not found. Run the server from the 'backend' directory or check file paths.");
}

export const env = {
  PORT: process.env.PORT || 5500,
  DATABASE_URI: process.env.DATABASE_URI,
  DB_TIMING: process.env.DB_TIMING,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
  PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL,
  CLIENT_URLS: process.env.CLIENT_URLS,
  ALLOW_NO_ORIGIN: process.env.ALLOW_NO_ORIGIN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined
};
