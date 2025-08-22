import { Router, type Router as ExpressRouter } from 'express';
import { reportService } from '../services/reportService.js';

const router: ExpressRouter = Router();

// Server-Sent Events endpoint
router.get('/', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  console.log('🔗 SSE connection established');

  // Add client to the list
  reportService.addSSEClient(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ 
    type: 'connection_established',
    timestamp: new Date().toISOString() 
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔌 SSE connection closed');
    // Remove client from the list
    reportService.removeSSEClient(res);
  });

  // Handle server shutdown
  req.on('error', (error) => {
    console.error('❌ SSE connection error:', error);
    // Remove client from the list
    reportService.removeSSEClient(res);
  });
});

export default router;
