import axios from 'axios';
import type { FormData, QuestionsResponse, ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const questionsApi = {
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
}; 