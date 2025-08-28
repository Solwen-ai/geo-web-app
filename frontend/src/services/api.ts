import axios from 'axios';
import type { FormData, QuestionsResponse, ApiError, ReportsResponse } from '../types/api';

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

  async initScraping(questions: string[], params: FormData): Promise<{ message: string; timestamp: string }> {
    try {
      const response = await api.post('/api/scraping/init', { questions, params });
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

  async downloadFile(fileName: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/download/${fileName}`, {
        responseType: 'blob',
      });
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