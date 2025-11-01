import type { Report } from '../types/index.js';

// In-memory storage for reports
const reports = new Map<string, Report>();

// SSE clients management
let sseClients: any[] = [];

export const reportService = {
  // Get all reports sorted by creation date (newest first)
  getAllReports(): Report[] {
    return Array.from(reports.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Create a new report
  createReport(fileNameKeyword?: string): Report {
    // Generate fileName with date and sequential number
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    // Count existing reports for today
    const todayReports = Array.from(reports.values()).filter(report => 
      report.fileName.startsWith(today)
    );
    
    // Generate next report number (1, 2, 3, etc.)
    const reportNumber = String(todayReports.length + 1);
    const fileName = `${today}_${reportNumber}${fileNameKeyword ? `_${fileNameKeyword}` : ''}.csv`;
    
    // TODO: should use uuid
    const id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
  },

  // Update report status
  updateReportStatus(reportId: string, status: Report['status'], error?: string): void {
    const report = reports.get(reportId);
    if (report) {
      report.status = status;
      report.updatedAt = new Date().toISOString();
      if (error) {
        report.error = error;
      }
      reports.set(reportId, report);
    }
  },

  // Find report by fileName
  findReportByFileName(fileName: string): Report | undefined {
    return Array.from(reports.values()).find(report => report.fileName === fileName);
  },

  // Get report by ID
  getReportById(reportId: string): Report | undefined {
    return reports.get(reportId);
  },

  // SSE client management
  addSSEClient(client: any): void {
    sseClients.push(client);
  },

  removeSSEClient(client: any): void {
    const index = sseClients.indexOf(client);
    if (index > -1) {
      sseClients.splice(index, 1);
    }
  },

  notifySSEClients(data: any): void {
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  },

  // Get SSE clients count (for debugging)
  getSSEClientsCount(): number {
    return sseClients.length;
  }
};