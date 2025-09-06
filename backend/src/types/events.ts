export interface QueueEvent {
  type: 'queue_job_added' | 'queue_job_cancelled' | 'queue_job_started' | 'queue_job_completed' | 'queue_job_failed';
  jobId: string;
  reportId?: string;
  timestamp: string;
  position?: number;
  error?: string;
}

export interface EventConsumer {
  handle(event: QueueEvent): void;
}
