import type { Direction, ApiResponse } from '@/src/types/api';
import { apiPatch } from './client';

export function rotateAntenna(
  direction: Direction,
): Promise<ApiResponse<{ antenna_direction: Direction }>> {
  return apiPatch('/users/me/antenna', { direction });
}
