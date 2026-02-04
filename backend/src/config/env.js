// e:\Aquaflow\backend\src\config\env.js


import dotenv from 'dotenv';
const result = dotenv.config({ path: '.env.development' });

if (result.error) {
  console.warn("⚠️  Warning: .env.development file not found. Ensure you are running the server from the 'backend' directory.");
}

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URI: process.env.DATABASE_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL
};
