import { useQuery } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { ReportsResponse, ApiError } from '../types/api';

export const useReports = () => {
  return useQuery<ReportsResponse, ApiError>({
    queryKey: ['reports'],
    queryFn: apis.getReports,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second
  });
};
