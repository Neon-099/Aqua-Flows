// e:\Aquaflow\backend\src\middlewares\rateLimit.middleware.js
import rateLimit from 'express-rate-limit';

// Create a rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
