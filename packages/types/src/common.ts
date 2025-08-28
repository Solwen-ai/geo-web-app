// Common types shared across frontend, backend, and playwright

export interface FormData {
  brandNames: string;
  brandWebsites: string;
  productsServices: string;
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
