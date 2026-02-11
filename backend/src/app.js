
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import helmet from 'helmet'
import router from './routes/auth.route.js';
import orderRouter from './routes/order.route.js';
import riderRouter from './routes/rider.route.js';
import webhookRouter from './routes/webhook.route.js';
import adminRouter from './routes/admin.route.js';
import staffRouter from './routes/staff.route.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { env } from './config/env.js';


const app = express();

const isProd = env.NODE_ENV === 'production';
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = (env.CLIENT_URLS || env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;
const allowNoOrigin = env.ALLOW_NO_ORIGIN === 'true' || !isProd;

//CAPTURE RAW BODY FOR WEBHOOK SIGNATURE VALIDATION
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    console.log('verify called, buf type:', typeof buf);
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

//MIDDLEWARE
// app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) {
      return allowNoOrigin ? cb(null, true) : cb(new Error('CORS: Origin not allowed'));
    }
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet()); //TO PROTECT THE HTTP RESPONSE OF A HEADER

// Request timing logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const tag = ms >= 10000 ? 'SLOW' : 'OK';
    console.log(`[${tag}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

//MAIN ROUTER URI
app.use('/api/v1/auth', router)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/riders', riderRouter)
app.use('/api/v1/webhooks', webhookRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/staff', staffRouter)

app.use(errorHandler);

export default app;
