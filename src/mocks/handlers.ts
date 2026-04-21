import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockMessage,
  mockSignalEntries,
  mockMissedSignals,
  mockStats,
} from './fixtures';

// Matches requests from axios with baseURL '/api/v1' resolved against
// jsdom's default origin (http://localhost).
const BASE = 'http://localhost/api/v1';

export const handlers = [
  http.get(`${BASE}/stats`, () =>
    HttpResponse.json({ data: mockStats, error: null, meta: {} }),
  ),

  http.get(`${BASE}/users/me`, () =>
    HttpResponse.json({
      data: { user: mockUser, activeMessage: null },
      error: null,
      meta: {},
    }),
  ),

  http.patch(`${BASE}/users/me/antenna`, async ({ request }) => {
    const body = await request.json() as { direction: number };
    return HttpResponse.json({
      data: { antenna_direction: body.direction },
      error: null,
      meta: {},
    });
  }),

  http.get(`${BASE}/signals/feed`, () =>
    HttpResponse.json({ data: mockSignalEntries, error: null, meta: {} }),
  ),

  http.get(`${BASE}/signals/missed`, () =>
    HttpResponse.json({ data: mockMissedSignals, error: null, meta: {} }),
  ),

  http.get(`${BASE}/signals/missed/count`, () =>
    HttpResponse.json({ data: { count: mockMissedSignals.length }, error: null, meta: {} }),
  ),

  http.post(`${BASE}/messages`, async ({ request }) => {
    const body = await request.json() as { content: string };
    return HttpResponse.json({
      data: { ...mockMessage, content: body.content },
      error: null,
      meta: {},
    });
  }),

  http.patch(`${BASE}/messages/:id/interrupt`, ({ params }) =>
    HttpResponse.json({
      data: { ...mockMessage, id: params.id as string, status: 'interrupted' },
      error: null,
      meta: {},
    }),
  ),
];
