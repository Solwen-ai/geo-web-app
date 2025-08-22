import { reportService } from './reportService.js';
import { scrapingEntry } from '../playwright/scrapingEntry.js';
import { UserParams } from '../playwright/types.js';

export const scrapingService = {
  // Shared scraping function
  async runScraping({
    questions,
    params,
    reportId,
  }: {
    questions: string[];
    params: UserParams;
    reportId: string;
  }): Promise<void> {
    try {
      console.log('🚀 Starting Playwright script...');

      // Update report status to running if reportId is provided
      reportService.updateReportStatus(reportId, 'running');

      // Execute the Playwright script
      await scrapingEntry({ questions, params });

      // Find the report to get the correct fileName
      reportService.updateReportStatus(reportId, 'completed');

      console.log('✅ Playwright script executed successfully');
    } catch (error) {
      console.error('Error executing Playwright script:', error);

      // Update report status to failed if reportId is provided
      reportService.updateReportStatus(
        reportId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  },
};
