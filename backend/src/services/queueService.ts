import type { QueueJob, QueueStatus, QueueStorage } from '@geo-web-app/types';
import { scrapingService } from './scrapingService.js';
import { InMemoryQueueStorage } from './inMemoryQueueStorage.js';
import { eventBus } from './eventBus.js';
import type { QueueEvent } from '../types/events.js';

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
    
    // Emit queue_job_added event
    const event: QueueEvent = {
      type: 'queue_job_added',
      jobId: finalJobId,
      reportId: job.reportId,
      position: await this.getJobPosition(finalJobId),
      timestamp: new Date().toISOString()
    };
    eventBus.emit('queue_job_added', event);

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
      
      // Emit queue_job_cancelled event
      const event: QueueEvent = {
        type: 'queue_job_cancelled',
        jobId,
        reportId: job.reportId,
        timestamp: new Date().toISOString()
      };
      eventBus.emit('queue_job_cancelled', event);

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
      
      // Emit queue_job_started event
      const startedEvent: QueueEvent = {
        type: 'queue_job_started',
        jobId: nextJob.id,
        reportId: nextJob.reportId,
        timestamp: new Date().toISOString()
      };
      eventBus.emit('queue_job_started', startedEvent);

      // Start the scraping process
      await scrapingService.runScraping({
        questions: nextJob.questions,
        params: nextJob.params,
      });

      // Update job status to completed
      await this.storage.updateJobStatus(nextJob.id, 'completed');
      
      // Emit queue_job_completed event
      const completedEvent: QueueEvent = {
        type: 'queue_job_completed',
        jobId: nextJob.id,
        reportId: nextJob.reportId,
        timestamp: new Date().toISOString()
      };
      eventBus.emit('queue_job_completed', completedEvent);

    } catch (error) {
      console.error('❌ Job processing failed:', error);
      
      // Update job status to failed
      await this.storage.updateJobStatus(
        nextJob.id, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Emit queue_job_failed event
      const failedEvent: QueueEvent = {
        type: 'queue_job_failed',
        jobId: nextJob.id,
        reportId: nextJob.reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      eventBus.emit('queue_job_failed', failedEvent);
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
