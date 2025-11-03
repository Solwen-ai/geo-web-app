import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FormData } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fileService = {
  // Save form data to params.ts file
  async saveToParamsFile(data: FormData, fileName: string): Promise<void> {
    try {
      const paramsContent = `// Auto-generated from frontend input
export const brandNames = ${JSON.stringify(
        data.brandNames
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      )};
export const brandWebsites = ${JSON.stringify(
        data.brandWebsites
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      )};
export const topic = '${data.topic}';
export const targetRegions = '${data.targetRegions}';
export const competitorBrands = ${JSON.stringify(
        data.competitorBrands
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      )};
export const fileName = '${fileName}';
`;

      const paramsPath = path.join(__dirname, '../../playwright/params.ts');
      await fs.writeFile(paramsPath, paramsContent, 'utf-8');
      console.log('✅ Successfully saved params.ts');
    } catch (error) {
      console.error('❌ Error saving params.ts:', error);
      throw error;
    }
  },

  // Save questions to questions.txt file
  async saveQuestionsToFile(questions: string[]): Promise<void> {
    try {
      // Convert questions to text format
      const questionsText = questions.join('\n');

      // Save to questions.txt file
      const questionsPath = path.join(
        __dirname,
        '../../playwright/questions.txt'
      );
      await fs.writeFile(questionsPath, questionsText, 'utf-8');

      console.log(
        `✅ Successfully saved ${questions.length} questions to questions.txt`
      );
    } catch (error) {
      console.error('❌ Error saving questions to file:', error);
      throw error;
    }
  },

  // Check if file exists
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  // Read file content
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  },

  // Validate CSV filename
  isValidCSVFilename(fileName: string): boolean {
    return (
      !!fileName &&
      fileName.endsWith('.csv') &&
      !fileName.includes('..') &&
      !fileName.includes('/')
    );
  },
};
