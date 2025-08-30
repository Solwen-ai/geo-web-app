import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apis } from '../services/api';

export const useQueueStatus = () => {
  return useQuery({
    queryKey: ['queue-status'],
    queryFn: apis.getQueueStatus,
  });
};

export const useJobInfo = (jobId: string) => {
  return useQuery({
    queryKey: ['job-info', jobId],
    queryFn: () => apis.getJobInfo(jobId),
    enabled: !!jobId,
  });
};

export const useCancelJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apis.cancelJob,
    onSuccess: () => {
      // Invalidate and refetch queue status and reports
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
