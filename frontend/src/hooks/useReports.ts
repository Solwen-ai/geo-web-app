import { useQuery } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { ReportsResponse, ApiError } from '../types/api';

export const useReports = () => {
  return useQuery<ReportsResponse, ApiError>({
    queryKey: ['reports'],
    queryFn: apis.getReports,
  });
};
