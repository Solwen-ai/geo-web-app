export interface Question {
  id: string;
  question: string;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface FormData {
  brandNames: string;
  brandWebsites: string;
  productsServices: string;
  targetRegions: string;
  competitorBrands: string;
}

export interface ApiError {
  message: string;
  status?: number;
} 