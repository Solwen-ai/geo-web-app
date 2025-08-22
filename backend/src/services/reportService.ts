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
  createReport(fileName: string): Report {
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
      
      // Notify SSE clients about the status update
      this.notifySSEClients({
        type: 'report_status_update',
        reportId,
        status,
        error,
        timestamp: new Date().toISOString()
      });
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
