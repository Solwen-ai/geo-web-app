import { Router, type Router as ExpressRouter } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileService } from '../services/fileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: ExpressRouter = Router();

// Download CSV file endpoint
router.get('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Validate fileName to prevent directory traversal
    if (!fileService.isValidCSVFilename(fileName)) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    
    const filePath = path.join(__dirname, '../../..', fileName);
    
    // Check if file exists
    if (!(await fileService.fileExists(filePath))) {
      return res.status(404).json({ error: `${fileName} file not found` });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Stream the file to the response
    const fileStream = await fileService.readFile(filePath);
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

export default router;
