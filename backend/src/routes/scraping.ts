import { Router, type Router as ExpressRouter } from 'express';
import { fileService } from '../services/fileService.js';
import { scrapingService } from '../services/scrapingService.js';
import type { InitScrapingRequest, InitScrapingResponse } from '../types/index.js';

const router: ExpressRouter = Router();

// Init scraping endpoint - save questions to file and start scraping asynchronously
router.post('/init', async (req: any, res: any) => {
  try {
    const { questions, reportId } = req.body as InitScrapingRequest;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }

    // Save questions to file
    await fileService.saveQuestionsToFile(questions);
    
    // Start scraping asynchronously (don't wait for it to complete)
    scrapingService.runScraping(reportId).catch(error => {
      console.error('❌ Background scraping failed:', error);
    });
    
    return res.json({
      message: `Successfully saved ${questions.length} questions to questions.txt and started scraping process`,
      timestamp: new Date().toISOString()
    } as InitScrapingResponse);
  } catch (error) {
    console.error('Error saving questions to file:', error);
    return res.status(500).json({
      error: 'Failed to save questions to file',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

// Start scraping endpoint (for manual scraping without questions)
router.post('/start', async (req, res) => {
  try {
    await scrapingService.runScraping();
    
    return res.json({
      message: 'Playwright script executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing Playwright script:', error);
    return res.status(500).json({
      error: 'Failed to execute Playwright script',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

export default router;
