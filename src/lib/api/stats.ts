import type { StatsResponse, ApiResponse } from '@/src/types/api';
import { apiGet } from './client';

export function getStats(): Promise<ApiResponse<StatsResponse>> {
  return apiGet('/stats');
}
