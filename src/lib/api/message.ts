import type { Message, ApiResponse } from '@/src/types/api';
import { apiPatch, apiPost } from './client';

export function sendMessage(content: string): Promise<ApiResponse<Message>> {
  return apiPost('/messages', { content });
}

export function interruptMessage(messageId: string): Promise<ApiResponse<Message>> {
  return apiPatch(`/messages/${messageId}/interrupt`);
}
