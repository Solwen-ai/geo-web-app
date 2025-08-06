import { Page } from 'playwright';
import { delay } from './utils';

const email = process.env.CHATGPT_EMAIL
const password = process.env.CHATGPT_PASSWORD

export async function login(page: Page) {
  // 1. Go to login page
  await page.goto("http://chatgpt.com/");

  // Click the login button
  const loginButtonSelector = 'button[data-testid="login-button"]';
  await page.waitForSelector(loginButtonSelector, { timeout: 15000 });
  await page.click(loginButtonSelector);

  // 2. Wait for email input and type email
  const emailSelector = 'input[type="email"][autocomplete="email"][placeholder="Email address"]';
  await page.waitForSelector(emailSelector, { timeout: 15000 });
  await page.fill(emailSelector, email);

  // 3. Click the first Continue button (for email)
  await page.keyboard.press("Enter");

  // 4. Wait for password input and type password
  const passwordSelector = 'input[type="password"][autocomplete="current-password"][placeholder="Password"]';
  await page.waitForSelector(passwordSelector, { timeout: 15000 });
  await page.fill(passwordSelector, password);
  await page.keyboard.press("Enter");

  const accountsProfileButtonSelector = 'div[data-testid="accounts-profile-button"]';
  await page.waitForSelector(accountsProfileButtonSelector, { timeout: 15000 });
  console.log("✅ Login success");
} 