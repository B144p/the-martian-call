import { createSocket } from '@/src/lib/socket';
import { mockStats } from '@/src/mocks/fixtures';
import { act, render, screen, waitFor } from '@/src/test-utils/render';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import type { Socket } from 'socket.io-client';
import { StatusBar } from './StatusBar';

function makeMockSocket() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
}

describe('StatusBar', () => {
  describe('authenticated user', () => {
    it('shows the callsign', () => {
      render(<StatusBar initialStats={mockStats} />);
      expect(screen.getByText('W1AW')).toBeInTheDocument();
    });

    it('shows continent name', () => {
      render(<StatusBar initialStats={mockStats} />);
      expect(screen.getByText('North America')).toBeInTheDocument();
    });

    it('shows antenna direction', () => {
      render(<StatusBar initialStats={mockStats} />);
      expect(screen.getByText(/90/)).toBeInTheDocument();
    });

    it('shows online count badge when stats provided', () => {
      render(<StatusBar initialStats={mockStats} />);
      expect(screen.getByText(/12 online/i)).toBeInTheDocument();
    });

    it('does not show online count when stats are null', () => {
      render(<StatusBar initialStats={null} />);
      expect(screen.queryByText(/online/i)).not.toBeInTheDocument();
    });

    it('renders the sign-out button', () => {
      render(<StatusBar initialStats={null} />);
      expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
    });

    it('calls signOut when SIGN OUT is clicked', async () => {
      const user = userEvent.setup();
      render(<StatusBar initialStats={null} />);
      await user.click(screen.getByRole('button', { name: /SIGN OUT/i }));
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('unauthenticated', () => {
    it('shows "not signed in" text', () => {
      render(<StatusBar initialStats={null} />, { initialUser: null, backendToken: null });
      expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
    });

    it('does not show the sign-out button', () => {
      render(<StatusBar initialStats={null} />, { initialUser: null, backendToken: null });
      expect(screen.queryByRole('button', { name: /SIGN OUT/i })).not.toBeInTheDocument();
    });
  });

  describe('real-time updates', () => {
    it('updates online count when socket emits presence:update', async () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      render(<StatusBar initialStats={mockStats} />);
      expect(screen.getByText(/12 online/i)).toBeInTheDocument();

      const calls = mockSocket.on.mock.calls as Array<[string, (d: { online_count: number }) => void]>;
      const handler = calls.find(([e]) => e === 'presence:update')?.[1];
      act(() => { handler?.({ online_count: 31 }); });

      expect(screen.getByText(/31 online/i)).toBeInTheDocument();
    });
  });

  describe('stats polling', () => {
    it('polls the stats endpoint every 30 seconds', async () => {
      jest.useFakeTimers();
      // initialStats null — badge should appear after first poll fires
      render(<StatusBar initialStats={null} />);
      expect(screen.queryByText(/online/i)).not.toBeInTheDocument();

      act(() => { jest.advanceTimersByTime(30_000); });

      await waitFor(() => {
        expect(screen.getByText(/12 online/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
