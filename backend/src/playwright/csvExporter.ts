import fs from 'fs/promises';
import path from 'path';
import { OutputRecord } from './types.js';

// Base headers (excluding dynamic brand columns)
const baseHeaders = [
  'no',
  'query',
  'aio',
  'aioOfficialWebsiteExist',
  'aioReference',
  'aioBrandCompare',
  'aioBrandExist',
  'chatgpt',
  'chatgptOfficialWebsiteExist',
  'chatgptReference',
  'chatgptBrandCompare',
  'chatgptBrandExist',
  'brandRelated',
  'contentAnalysis',
  'optimizeDirection',
  'answerEngine',
];

const baseHeaderTitles = [
  'NO.',
  'QUERY',
  'AIO（僅一部分有）',
  '有無官網',
  '引用的資料',
  '品牌比較',
  '有無品牌',
  'ChatGPT 回覆內容',
  '有無官網',
  '引用的資料',
  '品牌比較',
  '有無品牌',
  '品牌相關',
  '內容分析',
  '優化方向',
  'ANSWER ENGINE',
];

/**
 * Converts OutputRecord array to CSV format with dynamic brand columns
 * @param records Array of OutputRecord objects
 * @param brandNames Array of own brand names
 * @param competitorBrands Array of competitor brand names
 * @returns CSV string
 */
export const convertToCSV = (
  records: OutputRecord[],
  brandNames: string[],
  competitorBrands: string[]
): string => {
  // Create own brands column name
  const ownBrandsColumnName = brandNames.join('+');
  
  // Combine base headers with brand columns
  const allHeaders = [...baseHeaders, ownBrandsColumnName, ...competitorBrands];
  const allHeaderTitles = [...baseHeaderTitles, ownBrandsColumnName, ...competitorBrands];

  const csvRows = [allHeaderTitles.join(',')];

  records.forEach(record => {
    const row = allHeaders.map(header => {
      const value = record[header as keyof OutputRecord];
      // Escape commas and quotes in CSV
      const escapedValue = String(value || '').replace(/"/g, '""');
      return `"${escapedValue}"`;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Exports OutputRecord array to CSV file asynchronously
 * @param records Array of OutputRecord objects
 * @param fileName Name of the output CSV file (default: "geo.csv")
 * @param brandNames Array of own brand names
 * @param competitorBrands Array of competitor brand names
 * @returns Promise that resolves when file is written
 */
export const exportToCSV = async (
  records: OutputRecord[],
  fileName: string = 'geo.csv',
  brandNames: string[],
  competitorBrands: string[]
): Promise<void> => {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    try {
      await fs.access(reportsDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(reportsDir, { recursive: true });
      console.log('📁 Created reports directory');
    }

    // Create full file path in reports directory
    const filePath = path.join(reportsDir, fileName);

    const csvContent = convertToCSV(records, brandNames, competitorBrands);
    await fs.writeFile(filePath, csvContent, 'utf-8');

    console.log(
      `✅ Successfully exported ${records.length} records to ${filePath}`
    );
  } catch (error) {
    console.error(`❌ Error exporting to CSV:`, error);
    throw error;
  }
};
