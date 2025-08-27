// API types shared between frontend and backend
import type { FormData, TimestampedResponse } from './common';

export interface QuestionsResponse extends TimestampedResponse {
  questions: string[];
  reportId?: string;
  fileName?: string;
}

export interface InitScrapingRequest {
  questions: string[];
  params: FormData;
}

export interface InitScrapingResponse extends TimestampedResponse {
  message: string;
}

// Report management types
export interface Report {
  id: string;
  fileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ReportsResponse extends TimestampedResponse {
  reports: Report[];
}

export interface SSEMessage {
  type: string;
  message?: string;
  timestamp: string;
  error?: string;
  fileName?: string;
  reportId?: string;
  status?: Report['status'];
}
