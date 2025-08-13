import axios from 'axios';
import type { FormData, QuestionsResponse, ApiError, Question } from '../types/api';

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

  async initScraping(questions: Question[]): Promise<{ message: string; timestamp: string }> {
    try {
      const response = await api.post('/api/init-scraping', { questions });
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