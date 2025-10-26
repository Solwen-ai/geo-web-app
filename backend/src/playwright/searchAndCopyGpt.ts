import { BrowserContext, Page } from 'playwright';
import clipboard from 'clipboardy';
import { OutputRecord, UserParams } from './types.js';
import { delay, logErrorAndScreenshot, retryWithBackoff } from './utils.js';
import { logger } from '../utils/logger.js';

const clearInput = async (page: Page) => {
  try {
    const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);

    // Select all text using Cmd+A (Mac) or Ctrl+A (Windows/Linux)
    await page.keyboard.press(
      process.platform === 'darwin' ? 'Meta+a' : 'Control+a'
    );
    await delay(0.5);

    // Delete selected text
    await page.keyboard.press('Backspace');
    await delay(0.5);

    logger.info('clearInput', '✅ Cleared input field');
  } catch (error: unknown) {
    await logErrorAndScreenshot(
      page,
      'clear-input',
      'clear input field',
      error
    );
    throw error;
  }
};

const enableWebSearch = async (page: Page) => {
  try {
    const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);
    await page.type(inputSelector, '/search', { delay: 50 });
    
    // Wait for the search dropdown to appear with the specific element
    const searchOptionSelector = 'div.popover div[role="group"] div[data-highlighted=""] span:has-text("Search")';
    await page.waitForSelector(searchOptionSelector, { timeout: 10000 });
    await page.keyboard.press('Enter');

    logger.info('enableWebSearch', "✅ Typed '/search' to enable web search");
  } catch (error: unknown) {
    await logErrorAndScreenshot(
      page,
      'enable-web-search',
      'enable web search',
      error
    );
    throw error;
  }
};

const askQuestion = async (page: Page, question: string) => {
  try {
    const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);
    await page.type(inputSelector, question, { delay: 100 });
    await page.keyboard.press('Enter');

    logger.info('askQuestion', '✅ Asked question', { question: question.substring(0, 50) + '...' });
  } catch (error: unknown) {
    await logErrorAndScreenshot(page, 'ask-question', question, error);
    throw error;
  }
};

const copyAnswer = async (
  page: Page,
  context: BrowserContext
): Promise<string> => {
  try {
    // Wait for the response and find the copy button using data-testid
    const copyButtonSelector =
      'article[data-testid="conversation-turn-2"] button[data-testid="copy-turn-action-button"]';
    await page.waitForSelector(copyButtonSelector, { timeout: 120000 });
    await page.locator(copyButtonSelector).scrollIntoViewIfNeeded();
    
    // 1. Store the clipboard content before clicking copy button
    let previousClipboardContent = '';
    try {
      previousClipboardContent = await clipboard.read();
    } catch {
      // Ignore if clipboard is empty or can't be read
    }
    
    // 2. Wrap click inside retryWithBackoff with retry = 5
    let clipboardText = '';
    try {
      clipboardText = await retryWithBackoff(async () => {
        await page.locator(copyButtonSelector).click({ force: true });
        await delay(1);
        
        // Read clipboard content inside the retry function
        const currentClipboardText = await clipboard.read();
        
        // If clipboard content has changed, return the new content
        if (currentClipboardText !== previousClipboardContent) {
          logger.info('copyAnswer', '✅ Clipboard content changed successfully');
          return currentClipboardText;
        }
        
        // If clipboard hasn't changed, throw error to trigger retry
        throw new Error('Clipboard content unchanged');
      }, 5, 1000);
    } catch (error) {
      // If all retries failed, assign fallback message
      clipboardText = 'not able to copy result';
      logger.warn('copyAnswer', '⚠️ Clipboard content unchanged after retries');
    }

    logger.info('copyAnswer', '✅ Copied answer from clipboard');
    return clipboardText;
  } catch (error: unknown) {
    logger.error('copyAnswer', '❌ Failed to copy answer from clipboard', { error });
    await logErrorAndScreenshot(
      page,
      'copy-answer',
      'copy answer from clipboard',
      error
    );
    throw error;
  }
};

// Function to check if answerText contains brandWebsites
const checkChatgptOfficialWebsiteExist = (
  answerText: string,
  brandWebsites: string[]
): boolean => {
  if (!answerText) {
    return false;
  }

  return brandWebsites.some(website =>
    answerText.toLowerCase().includes(website.toLowerCase())
  );
};

// Function to extract references from answerText
const extractChatgptReferences = (answerText: string): string => {
  if (!answerText) {
    return '';
  }

  // Look for reference patterns like [1]: https://... "title"
  const referenceRegex = /\[\d+\]:\s*(https?:\/\/[^\s]+)\s*"([^"]+)"/g;
  const references: string[] = [];
  let match;

  while ((match = referenceRegex.exec(answerText)) !== null) {
    references.push(match[0]);
  }

  return references.join('\n');
};

// Function to remove references from answerText to get clean text for metrics calculation
const removeReferencesFromText = (answerText: string): string => {
  if (!answerText) {
    return '';
  }

  // Remove reference patterns like [1]: https://... "title"
  const referenceRegex = /\[\d+\]:\s*(https?:\/\/[^\s]+)\s*"([^"]+)"/g;
  return answerText.replace(referenceRegex, '').trim();
};



// Function to check brand existence in text with support for both simple strings and + aliases
const checkBrandExistenceInText = (
  text: string,
  brandNames: string[]
): number => {
  if (!text) {
    return 0;
  }

  const textLower = text.toLowerCase();
  
  let matchCount = 0;
  for (const brand of brandNames) {
    if (brand.includes('+')) {
      // Handle brands with aliases (e.g., "google+alphabet")
      const brandAliases = brand.split('+').map(alias => alias.trim().toLowerCase());
      const hasAnyAlias = brandAliases.some(alias => textLower.includes(alias));
      if (hasAnyAlias) {
        matchCount++;
      }
    } else {
      // Handle simple brand names (e.g., "apple")
      if (textLower.includes(brand.toLowerCase())) {
        matchCount++;
      }
    }
  }

  return matchCount;
};

// Function to calculate chatgptBrandCompare (same as aioBrandCompare)
const calculateChatgptBrandCompare = (
  answerText: string,
  brandNames: string[],
  competitorBrands: string[]
): boolean => {
  if (!answerText) {
    return false;
  }

  // for own brand, we only need to check if it exists
  const brandNamesCount =
    checkBrandExistenceInText(answerText, brandNames) > 0 ? 1 : 0;
  const competitorBrandsCount = checkBrandExistenceInText(
    answerText,
    competitorBrands
  );
  const matchCount = brandNamesCount + competitorBrandsCount;

  return matchCount >= 1;
};

// Function to calculate chatgptBrandExist (same as aioBrandExist)
const calculateChatgptBrandExist = (
  answerText: string,
  brandNames: string[]
): boolean => {
  if (!answerText) {
    return false;
  }

  return checkBrandExistenceInText(answerText, brandNames) > 0;
};

// Function to build brand presence matrix for a question
const buildBrandPresenceMatrix = (
  answerText: string,
  brandNames: string[],
  competitorBrands: string[]
): Record<string, number> => {
  const matrix: Record<string, number> = {};

  // Check which brands appear in the answer text
  if (answerText) {
    const textLower = answerText.toLowerCase();
    
    // Check own brands - combine into single column with joined brand names
    const ownBrandsPresent = brandNames.some(brand => 
      textLower.includes(brand.toLowerCase())
    );
    const ownBrandsColumnName = brandNames.join('+');
    matrix[ownBrandsColumnName] = ownBrandsPresent ? 1 : 0;
    
    // Check competitor brands - handle both simple strings and + aliases
    competitorBrands.forEach(brand => {
      if (brand.includes('+')) {
        // Handle brands with aliases (e.g., "google+alphabet")
        const brandAliases = brand.split('+').map(alias => alias.trim().toLowerCase());
        const hasAnyAlias = brandAliases.some(alias => textLower.includes(alias));
        matrix[brand] = hasAnyAlias ? 1 : 0;
      } else {
        // Handle simple brand names (e.g., "apple")
        matrix[brand] = textLower.includes(brand.toLowerCase()) ? 1 : 0;
      }
    });
  }

  return matrix;
};

const searchAndCopyGpt = async ({
  context,
  question,
  outputRecord,
  params,
}: {
  context: BrowserContext;
  question: string;
  outputRecord: OutputRecord;
  params: UserParams;
}) => {
  const page = await context.newPage();

  try {
    // Wrap steps 1-4 in retry logic to handle failures and restart from beginning
    const answerText = await retryWithBackoff(async () => {
      // 1. Navigate to ChatGPT
      await page.goto('https://chatgpt.com/?temporary-chat=true');

      // 1.5. Clear input field to ensure it's empty
      await clearInput(page);

      // 2. Enable web search
      await enableWebSearch(page);

      // 3. Ask the question
      await askQuestion(page, question);

      // 4. Copy the answer
      const result = await copyAnswer(page, context);
      
      // Validate that we got a meaningful answer
      if (!result || result.trim() === '' || result === 'not able to copy result') {
        throw new Error('Failed to get valid answer text');
      }
      
      return result;
    }, 3); // Retry up to 3 times with 2 second delay

    outputRecord.chatgpt = answerText;

    // 5. Process and extract references first
    outputRecord.chatgptReference = extractChatgptReferences(answerText);
    
    // 6. Remove references from answerText to get clean text for metrics calculation
    const cleanedAnswerText = removeReferencesFromText(answerText);

    // 7. Fill in the additional properties using cleaned text
    outputRecord.chatgptOfficialWebsiteExist = checkChatgptOfficialWebsiteExist(
      cleanedAnswerText,
      params.brandWebsites
    )
      ? '有'
      : '無';
    outputRecord.chatgptBrandCompare = calculateChatgptBrandCompare(
      cleanedAnswerText,
      params.brandNames,
      params.competitorBrands
    )
      ? '是'
      : '否';
    outputRecord.chatgptBrandExist = calculateChatgptBrandExist(
      cleanedAnswerText,
      params.brandNames
    )
      ? '有'
      : '無';
    outputRecord.answerEngine = 'ChatGPT 5 + search';

    // 8. Build and assign brand presence matrix using cleaned text
    const brandMatrix = buildBrandPresenceMatrix(
      cleanedAnswerText,
      params.brandNames,
      params.competitorBrands
    );
    Object.assign(outputRecord, brandMatrix);
  } catch (error: unknown) {
    await logErrorAndScreenshot(page, 'chatgpt', question, error);
  } finally {
    await page.close();
  }
};

export default searchAndCopyGpt;
