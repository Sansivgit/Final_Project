import './config/registerEnv.ts';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { getCorsAllowedOrigins } from './config/corsOrigins.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import clothTypeRoutes from './routes/clothTypeRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: getCorsAllowedOrigins(),
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/** Root — browsers often request `/`; API lives under `/api`. */
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Backend running successfully.',
    service: 'e-commerce-api',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', clothTypeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
