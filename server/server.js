import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createStore } from './utils/store.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';


const app = express();
app.set('trust proxy', 1);
const store = createStore();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
  'https://www.legaltypingtest.online',
  'https://legaltypingtest.online',
  process.env.FRONTEND_URL,
  ...(process.env.EXTRA_CORS_ORIGINS || '').split(',')
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl.split('?')[0];
    return req.method === 'GET' && (
      url === '/api/stats' ||
      url === '/api/exams' ||
      url.startsWith('/api/exams/') ||
      url.startsWith('/api/pdfs/') ||
      url.startsWith('/api/passages/')
    );
  }
}));
app.use('/api', publicRoutes(store));
app.use('/api/admin', adminRoutes(store));

app.use((error, req, res, next) => {
  if (error) return res.status(500).json({ error: error.message });
  next();
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
