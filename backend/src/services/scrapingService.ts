import { reportService } from './reportService.js';

export const scrapingService = {
  // Shared scraping function
  async runScraping(reportId?: string): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      console.log('🚀 Starting Playwright script...');
      
      // Update report status to running if reportId is provided
      if (reportId) {
        reportService.updateReportStatus(reportId, 'running');
      }
      
      // Notify all SSE clients that scraping has started
      reportService.notifySSEClients({
        type: 'scraping_started',
        message: 'Scraping process has started',
        reportId,
        timestamp: new Date().toISOString()
      });
      
      // Execute the Playwright script
      const { stdout, stderr } = await execAsync('npx --yes tsx playwright/grabTheThings.ts', {
        cwd: process.cwd(),
        env: process.env
      });

      if (stderr) {
        console.error('Playwright stderr:', stderr);
      }

      if (stdout) {
        console.log('Playwright stdout:', stdout);
      }

      console.log('✅ Playwright script executed successfully');
      
      // Find the report to get the correct fileName
      let fileName = 'geo.csv';
      if (reportId) {
        const report = reportService.getReportById(reportId);
        if (report) {
          fileName = report.fileName;
          reportService.updateReportStatus(reportId, 'completed');
        }
      }
      
      // Notify all SSE clients that scraping has completed
      reportService.notifySSEClients({
        type: 'scraping_completed',
        message: 'Scraping process has completed successfully',
        fileName,
        reportId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error executing Playwright script:', error);
      
      // Update report status to failed if reportId is provided
      if (reportId) {
        reportService.updateReportStatus(reportId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Notify all SSE clients that scraping has failed
      reportService.notifySSEClients({
        type: 'scraping_error',
        message: 'Scraping process has failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
};
