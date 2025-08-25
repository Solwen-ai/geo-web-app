import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import reportsRouter from './routes/reports.js';
import questionsRouter from './routes/questions.js';
import scrapingRouter from './routes/scraping.js';
import downloadRouter from './routes/download.js';
import sseRouter from './routes/sse.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_FRONTEND_IP
        : ['*'],
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/reports', reportsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/scraping', scrapingRouter);
app.use('/api/download', downloadRouter);
app.use('/api/sse', sseRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
