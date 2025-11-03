// Common types shared across frontend, backend, and playwright

export interface FormData {
  brandNames: string;
  brandWebsites: string;
  topic: string;
  targetRegions: string;
  competitorBrands: string;
  questionsCount: number;
  systemPrompt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface TimestampedResponse {
  timestamp: string;
}

export interface SSEMessage {
  type: 'report_status_update' | 'queue_job_added' | 'queue_job_started' | 'queue_job_completed' | 'queue_job_failed' | 'queue_job_cancelled';
  reportId?: string;
  jobId?: string;
  status?: string;
  error?: string;
  position?: number;
  timestamp: string;
}
