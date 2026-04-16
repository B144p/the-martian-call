import axios from 'axios';
import type { ApiResponse } from '@/src/types/api';

// Always use the relative path — the Next.js rewrite in next.config.ts
// proxies /api/v1/* to the backend, so no cross-origin requests are made.
const BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Typed GET helper. Returns the full ApiResponse<T> body.
 */
export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const res = await apiClient.get<ApiResponse<T>>(path);
  return res.data;
}

/**
 * Typed POST helper. Returns the full ApiResponse<T> body.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await apiClient.post<ApiResponse<T>>(path, body);
  return res.data;
}

/**
 * Typed PATCH helper. Returns the full ApiResponse<T> body.
 */
export async function apiPatch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await apiClient.patch<ApiResponse<T>>(path, body);
  return res.data;
}
