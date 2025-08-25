import { BrowserContext, Page } from 'playwright';
import clipboard from 'clipboardy';
import { OutputRecord, UserParams } from './types.js';
import { delay, logErrorAndScreenshot } from './utils.js';

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

    console.log('✅ Cleared input field');
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
    // wait for Web Search option to show up
    await delay(1);
    await page.keyboard.press('Enter');

    console.log("✅ Typed '/search' to enable web search");
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

    console.log('✅ Asked question:', question.substring(0, 50) + '...');
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
    await page.locator(copyButtonSelector).click({ force: true });
    await delay(1);
    await page.locator(copyButtonSelector).click({ force: true });

    // Read the clipboard
    const clipboardText = await clipboard.read();

    console.log('✅ Copied answer from clipboard');
    return clipboardText;
  } catch (error: unknown) {
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

// Function to check brand existence in text (same as in searchAndCopyGoogle)
const checkBrandExistenceInText = (
  text: string,
  brandNames: string[]
): number => {
  if (!text) {
    return 0;
  }

  let matchCount = 0;
  for (const brandName of brandNames) {
    if (text.toLowerCase().includes(brandName.toLowerCase())) {
      matchCount++;
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

  return matchCount >= 2;
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
    [...brandNames, ...competitorBrands].forEach(brand => {
      if (answerText.toLowerCase().includes(brand.toLowerCase())) {
        matrix[brand] = 1;
      } else {
        matrix[brand] = 0;
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
    // 1. Navigate to ChatGPT
    await page.goto('https://chatgpt.com');

    // 1.5. Clear input field to ensure it's empty
    await clearInput(page);

    // 2. Enable web search
    await enableWebSearch(page);

    // 3. Ask the question
    await askQuestion(page, question);

    // 4. Copy the answer
    const answerText = await copyAnswer(page, context);
    outputRecord.chatgpt = answerText;

    // 5. Fill in the additional properties
    outputRecord.chatgptOfficialWebsiteExist = checkChatgptOfficialWebsiteExist(
      answerText,
      params.brandWebsites
    )
      ? '有'
      : '無';
    outputRecord.chatgptReference = extractChatgptReferences(answerText);
    outputRecord.chatgptBrandCompare = calculateChatgptBrandCompare(
      answerText,
      params.brandNames,
      params.competitorBrands
    )
      ? '是'
      : '否';
    outputRecord.chatgptBrandExist = calculateChatgptBrandExist(
      answerText,
      params.brandNames
    )
      ? '有'
      : '無';
    outputRecord.answerEngine = 'ChatGPT 5 + search';

    // 6. Build and assign brand presence matrix
    const brandMatrix = buildBrandPresenceMatrix(
      answerText,
      params.brandNames,
      params.competitorBrands
    );
    Object.assign(outputRecord, brandMatrix);
  } catch (error: unknown) {
    await logErrorAndScreenshot(page, 'chatgpt', question, error);
    throw error;
  } finally {
    await page.close();
  }
};

export default searchAndCopyGpt;
