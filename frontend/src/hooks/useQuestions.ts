import { useMutation } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { FormData, QuestionsResponse, ApiError } from '../types/api';

export const useQuestions = () => {
  const submitForm = useMutation<QuestionsResponse, ApiError, FormData>({
    mutationFn: apis.submitForm,
    onError: (error) => {
      console.error('API Error:', error);
    },
  });

  const initScraping = useMutation<
    { message: string; timestamp: string },
    ApiError,
    { questions: string[]; params: FormData }
  >({
    mutationFn: ({ questions, params }) => apis.initScraping(questions, params),
    onError: (error) => {
      console.error('Init Scraping Error:', error);
    },
  });

  return {
    submitForm,
    initScraping,
  };
}; 