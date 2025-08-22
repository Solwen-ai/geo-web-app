import axios from 'axios';
import type { FormData, QuestionsResponse, ApiError, Question, ReportsResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apis = {
  async submitForm(formData: FormData): Promise<QuestionsResponse> {
    try {
      const response = await api.post<QuestionsResponse>('/api/questions', formData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'An unexpected error occurred',
      } as ApiError;
    }
  },

  async initScraping(questions: Question[], reportId: string): Promise<{ message: string; timestamp: string }> {
    try {
      const response = await api.post('/api/scraping/init', { questions, reportId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'An unexpected error occurred',
      } as ApiError;
    }
  },

  async startScraping(): Promise<{ message: string; timestamp: string }> {
    try {
      const response = await api.post('/api/scraping/start');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'An unexpected error occurred',
      } as ApiError;
    }
  },

  async getReports(): Promise<ReportsResponse> {
    try {
      const response = await api.get<ReportsResponse>('/api/reports');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'An unexpected error occurred',
      } as ApiError;
    }
  },
}; 