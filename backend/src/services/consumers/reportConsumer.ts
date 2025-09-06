import type { EventConsumer, QueueEvent } from '../../types/events.js';
import type { Report } from '@geo-web-app/types';
import { reportService } from '../reportService.js';

export class ReportConsumer implements EventConsumer {
  /**
   * Handle queue events and update report status accordingly
   * Only processes events that have a reportId (report-related events)
   */
  handle(event: QueueEvent): void {
    // Only handle events that have a reportId (report-related events)
    if (!event.reportId) {
      console.log(`⚠️ ReportConsumer ignoring event ${event.type} - no reportId`);
      return;
    }

    // Map queue event types to report status
    const statusMapping: Record<QueueEvent['type'], Report['status']> = {
      'queue_job_added': 'pending',
      'queue_job_started': 'running',
      'queue_job_completed': 'completed',
      'queue_job_failed': 'failed',
      'queue_job_cancelled': 'cancelled',
    };

    const reportStatus = statusMapping[event.type];
    
    // Update report status
    reportService.updateReportStatus(event.reportId, reportStatus, event.error);

    // Transform queue event to SSE notification format
    const sseData = {
      type: event.type,
      jobId: event.jobId,
      reportId: event.reportId,
      timestamp: event.timestamp,
      ...(event.position !== undefined && { position: event.position }),
      ...(event.error && { error: event.error }),
    };

    // Notify SSE clients
    reportService.notifySSEClients(sseData);
    
    console.log(`📡 ReportConsumer updated report ${event.reportId} to ${reportStatus} and forwarded ${event.type} event`);
  }
}
