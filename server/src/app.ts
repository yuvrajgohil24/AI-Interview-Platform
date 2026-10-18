import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import interviewRoutes from './routes/interview.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust Railway's reverse proxy (needed for rate-limiter IP detection)
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// cors() MUST come before helmet() so that OPTIONS preflight responses
// carry the correct Access-Control-Allow-Origin header.
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Respond to all OPTIONS preflight requests immediately before any other middleware
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Brute-force protection on credential endpoints (the session endpoints below are not throttled this hard)
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' }
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api/auth/login', credentialLimiter);
app.use('/api/auth/signup', credentialLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

// Last-resort error handler (malformed JSON, unexpected throws)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
