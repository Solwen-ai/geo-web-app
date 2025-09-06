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
import queueRouter from './routes/queue.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import event system
import { eventBus } from './services/eventBus.js';
import { ReportConsumer } from './services/consumers/reportConsumer.js';

// Load environment variables
dotenv.config();

// Initialize event system
const reportConsumer = new ReportConsumer();
eventBus.subscribe('queue_job_added', reportConsumer);
eventBus.subscribe('queue_job_cancelled', reportConsumer);
eventBus.subscribe('queue_job_started', reportConsumer);
eventBus.subscribe('queue_job_completed', reportConsumer);
eventBus.subscribe('queue_job_failed', reportConsumer);

console.log('📡 Event system initialized with ReportConsumer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_FRONTEND_IP
        : '*',
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
app.use('/api/queue', queueRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
