import { useMutation } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { FormData, QuestionsResponse, ApiError, Question } from '../types/api';

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
    { questions: Question[]; reportId: string }
  >({
    mutationFn: ({ questions, reportId }) => apis.initScraping(questions, reportId),
    onError: (error) => {
      console.error('Init Scraping Error:', error);
    },
  });

  return {
    submitForm,
    initScraping,
  };
}; 