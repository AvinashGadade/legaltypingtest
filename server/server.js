import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { initDb } from './utils/initDb.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

fs.mkdirSync('uploads', { recursive: true });
fs.mkdirSync('database', { recursive: true });

const app = express();
app.set('trust proxy', 1);
const db = initDb();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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
app.use('/uploads', express.static('uploads'));

app.use('/api', publicRoutes(db));
app.use('/api/admin', adminRoutes(db));

app.use((error, req, res, next) => {
  if (error) return res.status(500).json({ error: error.message });
  next();
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
