import type { SignalEntry, MissedSignal, ApiResponse } from '@/src/types/api';
import { apiGet } from './client';

/** Fetches the last 50 received signals for the user's continent. */
export function getSignalFeed(): Promise<ApiResponse<SignalEntry[]>> {
  return apiGet('/signals/feed');
}

/** Fetches unread missed signals AND marks them as read server-side. */
export function getMissedSignals(): Promise<ApiResponse<MissedSignal[]>> {
  return apiGet('/signals/missed');
}

/** Fetches the count of unread missed signals without marking them as read. */
export function getMissedSignalCount(): Promise<ApiResponse<{ count: number }>> {
  return apiGet('/signals/missed/count');
}
