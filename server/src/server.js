import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';

const app = express();
const port = process.env.PORT || 4000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Enable trust proxy for correct client IP detection behind reverse proxies
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing with credentials enabled
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

// Body parsing with payload size restriction
app.use(express.json({ limit: '10kb' }));

// Cookie parsing for session identification
app.use(cookieParser());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount authentication API
app.use('/api/v1/auth', authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error',
    },
  });
});

app.listen(port, () => {
  console.log(`[AUTH SERVER] Running on http://localhost:${port}`);
  console.log(`[AUTH SERVER] Accepting requests from frontend: ${frontendUrl}`);
});
