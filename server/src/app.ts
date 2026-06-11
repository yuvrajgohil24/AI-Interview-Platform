import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

import authRoutes from './routes/auth.routes';
import interviewRoutes from './routes/interview.routes';

app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app };
