// TypeScript interfaces
export interface InitScrapingRequest {
  questions: string[];
  params: FormData;
}

export interface InitScrapingResponse {
  message: string;
  timestamp: string;
}

// Report management interfaces
export interface Report {
  id: string;
  fileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface FormData {
  brandNames: string;
  brandWebsites: string;
  productsServices: string;
  targetRegions: string;
  competitorBrands: string;
  questionsCount: number;
}

export interface QuestionsResponse {
  questions: string[];
  reportId?: string;
  fileName?: string;
  timestamp: string;
}
