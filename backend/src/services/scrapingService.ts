import { scrapingEntry } from '../playwright/scrapingEntry.js';
import { UserParams } from '../playwright/types.js';

export const scrapingService = {
  // Shared scraping function
  async runScraping({
    questions,
    params,
  }: {
    questions: string[];
    params: UserParams;
  }): Promise<void> {
    try {
      console.log('🚀 Starting Playwright script...');

      // Execute the Playwright script
      await scrapingEntry({ questions, params });

      console.log('🟢 Playwright script executed successfully');
    } catch (error) {
      console.error('Error executing Playwright script:', error);

      throw error;
    }
  },
};
