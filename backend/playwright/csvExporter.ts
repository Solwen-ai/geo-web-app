import fs from 'fs/promises';
import { OutputRecord } from './types';

const headers = [
  'no',
  'query',
  'aio',
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
const headerTitles = [
  'NO.',
  'QUERY',
  'AIO（僅一部分有）',
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
 * Converts OutputRecord array to CSV format
 * @param records Array of OutputRecord objects
 * @returns CSV string
 */
export const convertToCSV = (records: OutputRecord[]): string => {
  const csvRows = [headerTitles.join(',')];

  records.forEach(record => {
    const row = headers.map(header => {
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
 * @param filePath Path to the output CSV file (default: "geo.csv")
 * @returns Promise that resolves when file is written
 */
export const exportToCSV = async (
  records: OutputRecord[],
  filePath: string = 'geo.csv'
): Promise<void> => {
  try {
    const csvContent = convertToCSV(records);
    await fs.writeFile(filePath, csvContent, 'utf-8');
    console.log(
      `✅ Successfully exported ${records.length} records to ${filePath}`
    );
  } catch (error) {
    console.error(`❌ Error exporting to CSV:`, error);
    throw error;
  }
};
