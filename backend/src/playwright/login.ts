import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

export async function manualLogin() {
  const context = await chromium.launchPersistentContext('./browser-data', {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await context.newPage();

  await page.goto("http://chatgpt.com/");
  await page.waitForTimeout(10 * 1000);
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
  // await context.close();
  // const storage = await context.storageState({ path: 'auth.json' });
} 

manualLogin();