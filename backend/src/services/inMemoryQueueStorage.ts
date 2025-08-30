import type { QueueJob, QueueStorage } from '@geo-web-app/types';

export class InMemoryQueueStorage implements QueueStorage {
  private jobs = new Map<string, QueueJob>();

  async addJob(job: Omit<QueueJob, 'id' | 'createdAt' | 'status'>, jobId?: string): Promise<string> {
    const id = jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueJob: QueueJob = {
      ...job,
      id,
      createdAt: new Date(),
      status: 'pending',
    };
    
    this.jobs.set(id, queueJob);
    return id;
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJobStatus(jobId: string, status: QueueJob['status'], error?: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (error) {
        job.error = error;
      }
      this.jobs.set(jobId, job);
    }
  }

  async getNextPendingJob(): Promise<QueueJob | null> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return pendingJobs[0] || null;
  }

  async getAllJobs(): Promise<QueueJob[]> {
    return Array.from(this.jobs.values());
  }

  async removeJob(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async clearCompletedJobs(): Promise<void> {
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled');
    
    completedJobs.forEach(job => {
      this.jobs.delete(job.id);
    });
  }
}
