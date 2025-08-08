import { chromium } from 'playwright';

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
} 

manualLogin();