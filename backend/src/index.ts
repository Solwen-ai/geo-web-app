import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

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

// Questions API endpoint
app.post('/api/questions', (req, res) => {
  try {
    const { brandNames, brandWebsites, productsServices, targetRegions, competitorBrands } = req.body;

    // Validate required fields
    if (!brandNames || !Array.isArray(brandNames)) {
      return res.status(400).json({ error: '品牌名稱是必需的' });
    }

    // Hardcoded questions as requested
    const questions = [
      {
        id: '1',
        question: '台北有哪些 SEO 公司口碑佳，成功把客戶關鍵字從第 3 頁拉到首頁？'
      },
      {
        id: '2', 
        question: '排名一直卡在第二頁，台北哪幾家 SEO 公司最擅長解決這種瓶頸？'
      }
    ];

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

// Start scraping endpoint
app.post('/api/start-scraping', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🚀 Starting Playwright script...');
    
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