import { logger } from '../utils/logger.js';

// Helper function to add random delay
export const randomDelay = (min: number, max: number) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

export const delay = (s: number) => new Promise(resolve => setTimeout(resolve, s * 1000));

// Function to clean up clipboard content
export const cleanupClipboard = async (page: any) => {
  try {
    // Clear clipboard by setting it to empty string
    await page.evaluate(async () => {
      try {
        await navigator.clipboard.writeText('');
        console.log('🧹 Clipboard cleared successfully');
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log('⚠️ Could not clear clipboard:', error.message);
        } else {
          console.log('⚠️ Could not clear clipboard:', String(error));
        }
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('cleanupClipboard', '⚠️ Clipboard cleanup failed', { error: error.message });
    } else {
      logger.warn('cleanupClipboard', '⚠️ Clipboard cleanup failed', { error: String(error) });
    }
  }
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        logger.error('retryWithBackoff', `❌ All ${maxRetries + 1} attempts failed`, { error: lastError.message });
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn('retryWithBackoff', `⚠️ Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, { error: lastError.message });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Shared function to log error and capture screenshot
export async function logErrorAndScreenshot(
  page: any,
  action: string,
  question: string,
  error: unknown
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedQuestion = question.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50).trim();
  const filename = `reports/error-${action}-${sanitizedQuestion}-${timestamp}.png`;
  
  try {
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    logger.info('logErrorAndScreenshot', `📸 Screenshot saved: ${filename}`);
  } catch (screenshotError) {
    logger.error('logErrorAndScreenshot', '❌ Failed to capture screenshot', { error: screenshotError });
  }
  
  if (error instanceof Error) {
    logger.error('logErrorAndScreenshot', `❌ Error during ${action}`, { error: error.message });
  } else {
    logger.error('logErrorAndScreenshot', `❌ Error during ${action}`, { error: String(error) });
  }
}
