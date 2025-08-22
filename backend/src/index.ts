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
  reportId: string;
}

interface InitScrapingResponse {
  message: string;
  timestamp: string;
}

// Report management interfaces
interface Report {
  id: string;
  fileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// In-memory storage for reports
const reports = new Map<string, Report>();

// SSE clients management
let sseClients: express.Response[] = [];

// Shared scraping function
const runScraping = async (reportId?: string): Promise<void> => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🚀 Starting Playwright script...');
    
    // Update report status to running if reportId is provided
    if (reportId) {
      updateReportStatus(reportId, 'running');
    }
    
    // Notify all SSE clients that scraping has started
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_started',
        message: 'Scraping process has started',
        reportId,
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
    
    // Find the report to get the correct fileName
    let fileName = 'geo.csv';
    if (reportId) {
      const report = reports.get(reportId);
      if (report) {
        fileName = report.fileName;
        updateReportStatus(reportId, 'completed');
      }
    }
    
    // Notify all SSE clients that scraping has completed
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_completed',
        message: 'Scraping process has completed successfully',
        fileName,
        reportId,
        timestamp: new Date().toISOString()
      })}\n\n`);
    });
    
  } catch (error) {
    console.error('Error executing Playwright script:', error);
    
    // Update report status to failed if reportId is provided
    if (reportId) {
      updateReportStatus(reportId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Notify all SSE clients that scraping has failed
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'scraping_error',
        message: 'Scraping process has failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
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

// Get all reports endpoint
app.get('/api/reports', (req, res) => {
  try {
    const reportsList = Array.from(reports.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json({
      reports: reportsList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

// Function to save req.body to params.ts
const saveToParamsFile = async (data: any, fileName: string) => {
  try {
    const paramsContent = `// Auto-generated from frontend input
export const brandNames = ${JSON.stringify(data.brandNames.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
export const brandWebsites = ${JSON.stringify(data.brandWebsites.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
export const productServices = '${data.productsServices}';
export const targetRegions = '${data.targetRegions}';
export const competitorBrands = ${JSON.stringify(data.competitorBrands.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))};
export const fileName = '${fileName}';
`;

    const paramsPath = path.join(__dirname, '../playwright/params.ts');
    await fs.writeFile(paramsPath, paramsContent, 'utf-8');
    console.log('✅ Successfully saved params.ts');
  } catch (error) {
    console.error('❌ Error saving params.ts:', error);
    throw error;
  }
};

// Helper function to create a new report
const createReport = (fileName: string): Report => {
  const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const report: Report = {
    id,
    fileName,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };
  
  reports.set(id, report);
  return report;
};

// Helper function to update report status
const updateReportStatus = (reportId: string, status: Report['status'], error?: string) => {
  const report = reports.get(reportId);
  if (report) {
    report.status = status;
    report.updatedAt = new Date().toISOString();
    if (error) {
      report.error = error;
    }
    reports.set(reportId, report);
    
    // Notify SSE clients about the status update
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ 
        type: 'report_status_update',
        reportId,
        status,
        error,
        timestamp: new Date().toISOString()
      })}\n\n`);
    });
  }
};

// Helper function to find report by fileName
const findReportByFileName = (fileName: string): Report | undefined => {
  return Array.from(reports.values()).find(report => report.fileName === fileName);
};

// Function to generate questions using OpenAI API
const generateQuestionsWithOpenAI = async (promptData: any): Promise<{id: string, question: string}[]> => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `
# 角色
你是一位一般消費者，正尋找「${promptData.productsServices}」（例：離婚律師、植牙診所），目標地區「${promptData.targetRegions}」，準備在 Claude / ChatGPT（或其他 AI 對話工具）輸入問題。

# 變數
行業╱專業類型：${promptData.productsServices}
地點：${promptData.targetRegions}
官網：${promptData.brandWebsites}

# 關鍵要求
所有問題必須
1. 明確詢問品牌╱機構╱專業人員名稱，沒有出現具體品牌╱機構╱專業人員名稱，會有推薦、哪些等用字
2. 包含該領域消費者的常見痛點
3. 貼近真實決策情境，不重複
4. 符合一般民眾搜尋的提問方式，自然、口語化、符合台灣地區習慣
5. 邏輯順暢，前後無衝突

# 範例（勿複製）
台北哪幾位皮膚科醫師口碑最好又不用排隊排很久？

# 輸出格式（一次輸出 5 題，嚴格遵守下方格式，不得加入其他文字或空行）
問題
問題
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          // {
          //   role: 'system',
          //   content: 'You are an SEO expert who generates relevant questions for brand research and keyword analysis.'
          // },
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

    // Generate fileName first
    const fileName = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`;
    
    // Create a new report entry
    const report = createReport(fileName);
    console.log(`📝 Created report entry: ${report.id} with fileName: ${fileName}`);

    // Save the data to params.ts (this will use the same fileName)
    await saveToParamsFile(req.body, fileName);

    // Generate questions using OpenAI
    const questions = await generateQuestionsWithOpenAI(req.body);

    return res.json({
      questions,
      reportId: report.id,
      fileName: report.fileName,
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
    const { questions, reportId } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' } as any);
    }

    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' } as any);
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
    runScraping(reportId).catch(error => {
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

// Download CSV file endpoint
app.get('/api/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Validate fileName to prevent directory traversal
    if (!fileName || !fileName.endsWith('.csv') || fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    
    const filePath = path.join(__dirname, '..', fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: `${fileName} file not found` });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Stream the file to the response
    const fileStream = await fs.readFile(filePath, 'utf-8');
    console.log(`📥 ${fileName} file downloaded successfully`);
    return res.send(fileStream);
  } catch (error) {
    console.error(`Error downloading ${req.params.fileName}:`, error);
    return res.status(500).json({
      error: `Failed to download ${req.params.fileName} file`,
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
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