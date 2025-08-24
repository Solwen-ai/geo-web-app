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
      console.log('⚠️ Clipboard cleanup failed:', error.message);
    } else {
      console.log('⚠️ Clipboard cleanup failed:', String(error));
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
        console.log(`❌ All ${maxRetries + 1} attempts failed. Final error:`, lastError.message);
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${delay}ms... Error:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
