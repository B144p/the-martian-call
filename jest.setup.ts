import React from 'react';
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// MSW lifecycle — runs around every test file
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Prevent real WebSocket connections in all tests
jest.mock('@/src/lib/socket', () => ({
  createSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Default next-auth/react mock — unauthenticated. Override per-test with jest.mocked().
jest.mock('next-auth/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const _React = require('react') as typeof React;
  return {
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
    SessionProvider: function MockSessionProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return _React.createElement(_React.Fragment, null, children);
    },
  };
});
