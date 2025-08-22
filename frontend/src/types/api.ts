export interface FormData {
  brandNames: string;
  brandWebsites: string;
  productsServices: string;
  targetRegions: string;
  competitorBrands: string;
  questionsCount: number;
}

export interface Question {
  id: string;
  question: string;
}

export interface QuestionsResponse {
  questions: Question[];
  reportId?: string;
  fileName?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status?: number;
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

export interface ReportsResponse {
  reports: Report[];
  timestamp: string;
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