import { BrowserContext, Page } from "playwright";
import { OutputRecord } from "./types";
import { delay } from "./utils";

const enableWebSearch = async (page: Page) => {
  try {
    const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);
    await page.type(inputSelector, '/search', { delay: 50 });
    await page.keyboard.press("Enter");
    
    console.log("✅ Typed '/search' to enable web search");
  } catch (error) {
    console.log("⚠️ Could not type '/search', continuing without Web search...");
  }
};

const askQuestion = async (page: Page, question: string) => {
  const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
  await page.waitForSelector(inputSelector, { timeout: 15000 });
  await page.click(inputSelector);
  await page.type(inputSelector, question, { delay: 50 });
  await page.keyboard.press("Enter");
  
  console.log("✅ Asked question:", question.substring(0, 50) + "...");
};

const copyAnswer = async (page: Page, context: BrowserContext): Promise<string> => {
  // Wait for the response and find the copy button (previous sibling of edit button)
  const editButtonSelector = 'button[aria-label="Edit in canvas"]';
  await page.waitForSelector(editButtonSelector, { timeout: 120000 });
  
  // Scroll to the bottom to ensure buttons are visible
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  // Find the copy button (previous sibling of the edit button)
  const copyButton = await page.locator(editButtonSelector).first().locator('xpath=preceding-sibling::button').first();
  await copyButton.waitFor({ timeout: 10000 });
  await copyButton.click();

  // Read the clipboard
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const clipboardText = await page.evaluate(async () => {
    return await navigator.clipboard.readText();
  });

  console.log("✅ Copied answer from clipboard");
  return clipboardText;
};

const searchAndCopy = async ({
  context,
  page,
  question,
  outputRecord,
}: {
  context: BrowserContext;
  page: Page;
  question: string;
  outputRecord: OutputRecord;
}) => {
  try {
    // 1. Navigate to ChatGPT
    await page.goto("https://chatgpt.com");

    // 1.5. Enable web search
    await enableWebSearch(page);

    // 2. Ask the question
    await askQuestion(page, question);

    // 3. Copy the answer
    const answerText = await copyAnswer(page, context);
    outputRecord.chatgpt = answerText;

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
};

export default searchAndCopy;
