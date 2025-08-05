import { useMutation } from '@tanstack/react-query';
import { questionsApi } from '../services/api';
import type { FormData, QuestionsResponse, ApiError } from '../types/api';

export const useQuestions = () => {
  return useMutation<QuestionsResponse, ApiError, FormData>({
    mutationFn: questionsApi.submitForm,
    onError: (error) => {
      console.error('API Error:', error);
    },
  });
}; 