export interface QueueJob {
  id: string;
  questions: string[];
  params: {
    brandNames: string[];
    brandWebsites: string[];
    topic: string;
    targetRegions: string;
    competitorBrands: string[];
    questionCount: number;
    fileName: string;
  };
  reportId: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  total: number;
  currentJob?: QueueJob | undefined;
}

export interface QueueJobRequest {
  questions: string[];
  params: QueueJob['params'];
  reportId: string;
}

export interface QueueJobResponse {
  jobId: string;
  position: number;
  estimatedWaitTime?: number; // in seconds
}

export interface QueueStorage {
  addJob(job: Omit<QueueJob, 'id' | 'createdAt' | 'status'>, jobId?: string): Promise<string>;
  getJob(jobId: string): Promise<QueueJob | null>;
  updateJobStatus(jobId: string, status: QueueJob['status'], error?: string): Promise<void>;
  getNextPendingJob(): Promise<QueueJob | null>;
  getAllJobs(): Promise<QueueJob[]>;
  removeJob(jobId: string): Promise<boolean>;
  clearCompletedJobs(): Promise<void>;
}
