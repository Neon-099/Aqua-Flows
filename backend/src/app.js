
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import helmet from 'helmet'
import router from './routes/auth.route.js';
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

app.use(express.json());
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

//MAIN ROUTER URI
app.use('/api/v1/auth', router)

app.use(errorHandler);

export default app;