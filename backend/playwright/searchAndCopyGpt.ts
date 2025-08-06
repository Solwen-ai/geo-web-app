import { BrowserContext, Page } from "playwright";
import { OutputRecord } from "./types";
import { delay } from "./utils";

// Function to handle ChatGPT login modal
const handleLoginModal = async (page: Page) => {
  try {
    // Check if the "Stay logged out" link is present with a 2-second timeout
    const stayLoggedOutSelector = 'a[href="#"][class*="text-token-text-secondary"][class*="mt-5"][class*="cursor-pointer"][class*="text-sm"][class*="font-semibold"][class*="underline"]:has-text("Stay logged out")';
    
    const stayLoggedOutLink = await page.locator(stayLoggedOutSelector).first();
    
    // Wait for the link to appear with 2-second timeout
    await stayLoggedOutLink.waitFor({ timeout: 2000 });
    
    console.log("🔐 Login modal detected, clicking 'Stay logged out'");
    await stayLoggedOutLink.click();
    // Wait a moment for the modal to disappear
    await page.waitForTimeout(2000);
    
  } catch (error) {
    // If the link doesn't appear within 2 seconds, continue normally
    console.log("ℹ️ No login modal detected within 2 seconds, continuing...");
  }
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

    // 2. Find the contenteditable div and ask the question
    const inputSelector = 'div#prompt-textarea[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    await page.click(inputSelector);
    await page.type(inputSelector, question, { delay: 50 });
    await page.keyboard.press("Enter");

    // 3. Wait for the response and find the copy button (previous sibling of edit button)
    const editButtonSelector = 'button[aria-label="Edit in canvas"]';
    await page.waitForSelector(editButtonSelector, { timeout: 120000 });
    
    // 3.5. Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // 4. Find the copy button (previous sibling of the edit button)
    const copyButton = await page.locator(editButtonSelector).first().locator('xpath=preceding-sibling::button').first();
    await copyButton.waitFor({ timeout: 10000 });
    await copyButton.click();

    // 5. Read the clipboard
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // 6. Update the outputRecord object with the data
    outputRecord.chatgpt = clipboardText;

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
};

export default searchAndCopy;
