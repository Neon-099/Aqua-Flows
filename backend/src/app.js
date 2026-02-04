import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import helmet from 'helmet'
import router from './routes/auth.route.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet()); //TO PROTECT THE HTTP RESPONSE OF A HEADER

app.use('/api/v1/auth', router)

app.use(errorHandler);

export default app;