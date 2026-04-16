import Pusher from 'pusher-js';

/**
 * Creates a Pusher client. Pass the backend JWT so private-channel
 * auth requests include the Authorization header.
 */
export function createPusherClient(authToken: string | null): Pusher {
  return new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1',
    channelAuthorization: {
      endpoint: `/api/v1/auth/pusher`,
      transport: 'ajax',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  });
}
