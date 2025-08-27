import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import searchAndCopyGpt from './searchAndCopyGpt.js';
import searchAndCopyGoogle from './searchAndCopyGoogle.js';
import { OutputRecord } from './types.js';
import fs from 'fs';
import dotenv from 'dotenv';
import { exportToCSV } from './csvExporter.js';
import { Page } from 'playwright';
import { delay } from './utils.js';
import * as params from './params.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Add stealth plugin
chromium.use(StealthPlugin());

// Function to read questions from file
const readQuestions = (): string[] => {
  try {
    const content = fs.readFileSync('playwright/questions.txt', 'utf-8');
    return content.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('❌ Error reading questions.txt:', error);
    return [];
  }
};

async function main() {
  // Read questions from file
  const questions = readQuestions();
  console.log(`📝 Loaded ${questions.length} questions from questions.txt`);

  if (questions.length === 0) {
    console.error('❌ No questions found, exiting...');
    return;
  }

  // Initialize outputRecords array
  const outputRecords: OutputRecord[] = questions.map((_, index) => ({
    no: index + 1,
    query: '',
    aio: '',
    aioBrandCompare: '',
    aioBrandExist: '',
    chatgpt: '',
    chatgptOfficialWebsiteExist: '',
    chatgptReference: '',
    chatgptBrandCompare: '',
    chatgptBrandExist: '',
    brandRelated: '',
    contentAnalysis: '',
    optimizeDirection: '',
    answerEngine: '',
  }));

  // Launch browser with stealth
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
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  try {
    // Loop through all questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]!;
      const outputRecord = outputRecords[i]!;
      outputRecord.query = question;

      console.log(
        `\n🔄 Processing question ${i + 1}/${ questions.length
        }: ${question.substring(0, 50)}...`
      );

      try {
        await searchAndCopyGpt({ 
          context, 
          question, 
          outputRecord,
          params,
        });
        
        console.log(`✅ Completed ChatGPT for question ${i + 1}`);

        // Call Google search right after ChatGPT
        await searchAndCopyGoogle({
          question,
          outputRecord,
          params,
        });

        console.log(`✅ Completed Google search for question ${i + 1}`);

        // Add a small delay between requests to avoid rate limiting
        if (i < questions.length - 1) {
          await delay(2);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`❌ Error processing question ${i + 1}:`, error.message);
        } else {
          console.error(`❌ Error processing question ${i + 1}:`, String(error));
        }
        // Continue with next question instead of stopping
      }
    }

    // Export to CSV
    console.log(
      `\n💾 Exporting ${outputRecords.length} records to ${params.fileName}...`
    );
    await exportToCSV(outputRecords, params.fileName, params.brandNames);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await context.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Closing browser...');
  process.exit(0);
});

main().catch(console.error);
