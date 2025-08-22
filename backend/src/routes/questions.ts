import { Router, type Router as ExpressRouter } from 'express';
import { reportService } from '../services/reportService.js';
import { fileService } from '../services/fileService.js';
import { openaiService } from '../services/openaiService.js';
import type { FormData } from '../types/index.js';

const router: ExpressRouter = Router();

// Questions API endpoint
router.post('/', async (req, res) => {
  try {
    console.log('🚀 req.body', req.body);

    // may not necessary to save the data to params.ts
    // await fileService.saveToParamsFile(req.body as FormData, fileName);

    // Generate questions using OpenAI
    const questions = await openaiService.generateQuestions(req.body as FormData);

    return res.json({
      questions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return res.status(500).json({ 
      error: '處理請求時發生錯誤',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

export default router;
