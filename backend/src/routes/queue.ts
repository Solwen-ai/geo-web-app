import { Router, type Router as ExpressRouter } from 'express';
import { queueService } from '../services/queueService.js';

const router: ExpressRouter = Router();

// Get queue status
router.get('/status', async (req, res) => {
  try {
    const status = await queueService.getQueueStatus();
    return res.json(status);
  } catch (error) {
    console.error('Error getting queue status:', error);
    return res.status(500).json({
      error: 'Failed to get queue status',
      message: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : 'Internal server error',
    });
  }
});

// Get job information
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await queueService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const position = await queueService.getJobPosition(jobId);
    return res.json({ job, position });
  } catch (error) {
    console.error('Error getting job:', error);
    return res.status(500).json({
      error: 'Failed to get job information',
      message: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : 'Internal server error',
    });
  }
});

// Cancel a job
router.post('/job/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = await queueService.cancelJob(jobId);
    
    if (!cancelled) {
      return res.status(400).json({ 
        error: 'Cannot cancel job',
        message: 'Job not found or cannot be cancelled (only pending jobs can be cancelled)'
      });
    }
    
    return res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return res.status(500).json({
      error: 'Failed to cancel job',
      message: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : 'Internal server error',
    });
  }
});

// Clear completed jobs
router.delete('/completed', async (req, res) => {
  try {
    await queueService.clearCompletedJobs();
    return res.json({ message: 'Completed jobs cleared successfully' });
  } catch (error) {
    console.error('Error clearing completed jobs:', error);
    return res.status(500).json({
      error: 'Failed to clear completed jobs',
      message: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : 'Internal server error',
    });
  }
});

export default router;
