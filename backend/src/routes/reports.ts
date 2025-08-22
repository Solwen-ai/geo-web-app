import { Router, type Router as ExpressRouter } from 'express';
import { reportService } from '../services/reportService.js';

const router: ExpressRouter = Router();

// Get all reports endpoint
router.get('/', (req, res) => {
  try {
    const reportsList = reportService.getAllReports();
    
    res.json({
      reports: reportsList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

export default router;
