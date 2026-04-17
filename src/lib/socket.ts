import { io, Socket } from 'socket.io-client';

export function createSocket(token: string): Socket {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const wsUrl = apiUrl ? new URL(apiUrl).origin : '';
  return io(wsUrl, { auth: { token } });
}
