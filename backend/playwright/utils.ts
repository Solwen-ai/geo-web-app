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
      } catch (error) {
        console.log('⚠️ Could not clear clipboard:', error.message);
      }
    });
  } catch (error) {
    console.log('⚠️ Clipboard cleanup failed:', error.message);
  }
};
