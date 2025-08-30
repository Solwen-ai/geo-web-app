import type { QueueJob, QueueStatus, QueueStorage } from '@geo-web-app/types';
import { scrapingService } from './scrapingService.js';
import { reportService } from './reportService.js';
import { InMemoryQueueStorage } from './inMemoryQueueStorage.js';

export class QueueService {
  private storage: QueueStorage;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(storage?: QueueStorage) {
    this.storage = storage || new InMemoryQueueStorage();
    this.startProcessing();
  }

  async addJob(job: Omit<QueueJob, 'id' | 'createdAt' | 'status'>, jobId?: string): Promise<string> {
    const finalJobId = await this.storage.addJob(job, jobId);
    
    // Notify SSE clients about new job
    reportService.notifySSEClients({
      type: 'queue_job_added',
      jobId: finalJobId,
      position: await this.getJobPosition(finalJobId),
      timestamp: new Date().toISOString()
    });

    // Trigger processing if not already running
    this.processNextJob();
    
    return finalJobId;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.storage.getJob(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'pending') {
      await this.storage.updateJobStatus(jobId, 'cancelled');
      
      // Notify SSE clients about job cancellation
      reportService.notifySSEClients({
        type: 'queue_job_cancelled',
        jobId,
        timestamp: new Date().toISOString()
      });

      return true;
    }

    return false; // Can only cancel pending jobs
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.storage.getJob(jobId);
  }



  async getQueueStatus(): Promise<QueueStatus> {
    const allJobs = await this.storage.getAllJobs();
    const pending = allJobs.filter(job => job.status === 'pending').length;
    const processing = allJobs.filter(job => job.status === 'processing').length;
    const currentJob = allJobs.find(job => job.status === 'processing');

    return {
      pending,
      processing,
      total: allJobs.length,
      currentJob,
    };
  }

  async getJobPosition(jobId: string): Promise<number> {
    const allJobs = await this.storage.getAllJobs();
    const pendingJobs = allJobs
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const position = pendingJobs.findIndex(job => job.id === jobId);
    return position >= 0 ? position + 1 : -1;
  }

  private async processNextJob(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    const nextJob = await this.storage.getNextPendingJob();
    if (!nextJob) {
      return; // No pending jobs
    }

    this.isProcessing = true;

    try {
      // Update job status to processing
      await this.storage.updateJobStatus(nextJob.id, 'processing');
      
      // Notify SSE clients about job starting
      reportService.notifySSEClients({
        type: 'queue_job_started',
        jobId: nextJob.id,
        timestamp: new Date().toISOString()
      });

      // Start the scraping process
      await scrapingService.runScraping({
        questions: nextJob.questions,
        params: nextJob.params,
        reportId: nextJob.reportId,
      });

      // Update job status to completed
      await this.storage.updateJobStatus(nextJob.id, 'completed');
      
      // Notify SSE clients about job completion
      reportService.notifySSEClients({
        type: 'queue_job_completed',
        jobId: nextJob.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Job processing failed:', error);
      
      // Update job status to failed
      await this.storage.updateJobStatus(
        nextJob.id, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Notify SSE clients about job failure
      reportService.notifySSEClients({
        type: 'queue_job_failed',
        jobId: nextJob.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isProcessing = false;
      
      // The setInterval in startProcessing() will automatically pick up the next job
    }
  }

  private startProcessing(): void {
    // Start processing loop
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 5000); // Check every 5 seconds
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async clearCompletedJobs(): Promise<void> {
    await this.storage.clearCompletedJobs();
  }
}

// Create singleton instance
export const queueService = new QueueService();
