import { useMutation } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { Question, ApiError } from '../types/api';

export const useInitScraping = () => {
  return useMutation<{ message: string; timestamp: string }, ApiError, Question[]>({
    mutationFn: apis.initScraping,
    onError: (error) => {
      console.error('Init Scraping Error:', error);
    },
  });
};
