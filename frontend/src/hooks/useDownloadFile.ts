import { useMutation } from '@tanstack/react-query';
import { apis } from '../services/api';
import type { ApiError } from '../types/api';

export const useDownloadFile = () => {
  return useMutation<Blob, ApiError, string>({
    mutationFn: apis.downloadFile,
  });
};
