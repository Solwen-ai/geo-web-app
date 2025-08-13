import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// TypeScript interfaces
interface Question {
  id: string;
  question: string;
}

interface InitScrapingRequest {
  questions: Question[];
}

interface InitScrapingResponse {
  message: string;
  timestamp: string;
}

// SSE clients management
let sseClients: express.Response[] = [];

// Shared scraping function
const runScraping = async (): Promise<void> => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🚀 Starting Playwright script...');
    
    // Notify all SSE clients that scraping has started
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_started',
        message: 'Scraping process has started',
        timestamp: new Date().toISOString()
      })}\n\n`);
    });
    
    // Execute the Playwright script
    const { stdout, stderr } = await execAsync('npx --yes tsx playwright/grabTheThings.ts', {
      cwd: process.cwd(),
      env: process.env
    });

    if (stderr) {
      console.error('Playwright stderr:', stderr);
    }

    if (stdout) {
      console.log('Playwright stdout:', stdout);
    }

    console.log('✅ Playwright script executed successfully');
    
    // Notify all SSE clients that scraping has completed
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_completed',
        message: 'Scraping process has completed successfully',
        timestamp: new Date().toISOString()
      })}\n\n`);
    });
    
  } catch (error) {
    console.error('Error executing Playwright script:', error);
    
    // Notify all SSE clients that scraping has failed
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_error',
        message: 'Scraping process has failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })}\n\n`);
    });
    
    throw error;
  }
};

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Function to save req.body to params.ts
const saveToParamsFile = async (data: any) => {
  try {
    const paramsContent = `// Auto-generated from frontend input
export const brandNames = ${JSON.stringify(data.brandNames.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
export const brandWebsites = ${JSON.stringify(data.brandWebsites.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
export const productServices = '${data.productsServices}';
export const targetRegions = '${data.targetRegions}';
export const competitorBrands = ${JSON.stringify(data.competitorBrands.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
`;

    const paramsPath = path.join(__dirname, '../playwright/params.ts');
    await fs.writeFile(paramsPath, paramsContent, 'utf-8');
    console.log('✅ Successfully saved params.ts');
  } catch (error) {
    console.error('❌ Error saving params.ts:', error);
    throw error;
  }
};



// Function to generate questions using OpenAI API
const generateQuestionsWithOpenAI = async (promptData: any): Promise<{id: string, question: string}[]> => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Based on the following brand information, generate 10 SEO-related questions in Traditional Chinese that would be relevant for this brand:

Brand Names: ${promptData.brandNames}
Brand Websites: ${promptData.brandWebsites}
Products/Services: ${promptData.productsServices}
Target Regions: ${promptData.targetRegions}
Competitor Brands: ${promptData.competitorBrands}

Generate 10 questions that:
1. Are relevant to SEO and digital marketing
2. Focus on the target regions mentioned
3. Consider the competitive landscape
4. Are specific to the products/services offered
5. Could help with keyword research and content strategy

Return only the questions, one per line, without numbering or additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert who generates relevant questions for brand research and keyword analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const questionsText = data.choices[0]?.message?.content || '';
    
    // Split the response into individual questions and clean them
    const questions = questionsText
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && !q.match(/^\d+\./)) // Remove numbering
      .slice(0, 100) // Ensure we get exactly 100 questions
      .map((question: string, index: number) => ({
        id: (index + 1).toString(),
        question: question
      }));

    console.log(`✅ Generated ${questions.length} questions using OpenAI`);
    return questions;
  } catch (error) {
    console.error('❌ Error generating questions with OpenAI:', error);
    throw error;
  }
};

// Questions API endpoint
app.post('/api/questions', async (req, res) => {
  try {
    console.log('🚀 req.body', req.body);

    // Save the data to params.ts
    await saveToParamsFile(req.body);

    // Generate questions using OpenAI
    const questions = await generateQuestionsWithOpenAI(req.body);

    return res.json({
      questions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return res.status(500).json({ 
      error: '處理請求時發生錯誤',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

// Server-Sent Events endpoint
app.get('/api/sse', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  console.log('🔗 SSE connection established');

  // Add client to the list
  sseClients.push(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ 
    type: 'connection_established',
    message: 'SSE connection established', 
    timestamp: new Date().toISOString() 
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔌 SSE connection closed');
    // Remove client from the list
    const index = sseClients.indexOf(res);
    if (index > -1) {
      sseClients.splice(index, 1);
    }
  });

  // Handle server shutdown
  req.on('error', (error) => {
    console.error('❌ SSE connection error:', error);
    // Remove client from the list
    const index = sseClients.indexOf(res);
    if (index > -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Init scraping endpoint - save questions to file and start scraping asynchronously
app.post('/api/init-scraping', async (req: express.Request<{}, InitScrapingResponse, InitScrapingRequest>, res: express.Response<InitScrapingResponse>) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' } as any);
    }

    // Convert questions to text format
    const questionsText = questions
      .map((q: Question) => q.question)
      .join('\n');

    // Save to questions.txt file
    const questionsPath = path.join(__dirname, '../playwright/questions.txt');
    await fs.writeFile(questionsPath, questionsText, 'utf-8');
    
    console.log(`✅ Successfully saved ${questions.length} questions to questions.txt`);
    
    // Start scraping asynchronously (don't wait for it to complete)
    runScraping().catch(error => {
      console.error('❌ Background scraping failed:', error);
    });
    
    return res.json({
      message: `Successfully saved ${questions.length} questions to questions.txt and started scraping process`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving questions to file:', error);
    return res.status(500).json({
      error: 'Failed to save questions to file',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    } as any);
  }
});

// Start scraping endpoint
app.post('/api/start-scraping', async (req, res) => {
  try {
    await runScraping();
    
    return res.json({
      message: 'Playwright script executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing Playwright script:', error);
    return res.status(500).json({
      error: 'Failed to execute Playwright script',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 