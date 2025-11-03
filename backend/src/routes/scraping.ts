import { Router, type Router as ExpressRouter } from 'express';
// import { fileService } from '../services/fileService.js';
import { queueService } from '../services/queueService.js';
import type {
  InitScrapingRequest,
  InitScrapingResponse,
} from '../types/index.js';
import { reportService } from '../services/reportService.js';

const router: ExpressRouter = Router();

// Init scraping endpoint - save questions to file and start scraping asynchronously
router.post('/init', async (req: any, res: any) => {
  try {
    const { questions, params } = req.body as InitScrapingRequest;

    // Transform params to UserParams format
    const transformedParams = {
      brandNames: params.brandNames.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      brandWebsites: params.brandWebsites.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      topic: params.topic,
      targetRegions: params.targetRegions,
      competitorBrands: params.competitorBrands.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      questionCount: params.questionsCount,
      fileName: '',  // Will be set later with report fileName
    };


    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Create a new report entry
    // brandNames and topic could be null or empty
    const brandName = transformedParams.brandNames?.[0] ?? '';
    const topic = transformedParams.topic ?? '';
    // may not be necessary if topic is empty
    let fileNameKeyword = '';
    if (brandName && topic) {
      fileNameKeyword = brandName + '_' + topic;
    } else if (brandName) {
      fileNameKeyword = brandName;
    } else if (topic) {
      fileNameKeyword = topic;
    }
    const report = reportService.createReport(fileNameKeyword);
    console.log(
      `📝 Created report entry: ${report.id} with fileName: ${report.fileName}`
    );

    // may not necessary to save questions to file
    // await fileService.saveQuestionsToFile(questions);

    // Add job to queue instead of starting scraping directly
    const jobId = await queueService.addJob({
      questions,
      params: { ...transformedParams, fileName: report.fileName },
      reportId: report.id,
    }, report.id); // Use report ID as job ID

    console.log(`📋 Job added to queue: ${jobId}`);

    return res.json({
      message: `Successfully saved ${questions.length} questions to questions.txt and started scraping process`,
      timestamp: new Date().toISOString(),
    } as InitScrapingResponse);
  } catch (error) {
    console.error('Error in /api/scraping/init:', error);
    return res.status(500).json({
      error: 'Failed to save questions to file',
      message:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
});

export default router;
