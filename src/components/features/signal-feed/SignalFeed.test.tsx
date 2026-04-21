import React from 'react';
import type { Socket } from 'socket.io-client';
import { render, screen, act } from '@/src/test-utils/render';
import { createSocket } from '@/src/lib/socket';
import { mockSignalEntries } from '@/src/mocks/fixtures';
import type { SignalEntry } from '@/src/types/api';
import { SignalFeed } from './SignalFeed';

function makeMockSocket() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
}

describe('SignalFeed', () => {
  describe('empty state', () => {
    it('shows no-signals message when initial list is empty', () => {
      render(<SignalFeed initialMessages={[]} />);
      expect(screen.getByText(/No signals received yet/i)).toBeInTheDocument();
    });
  });

  describe('with messages', () => {
    it('renders each signal entry', () => {
      render(<SignalFeed initialMessages={mockSignalEntries} />);
      expect(screen.getByText('DL1ABC')).toBeInTheDocument();
      expect(screen.getByText('VK2XYZ')).toBeInTheDocument();
      expect(screen.getByText('JA1QXY')).toBeInTheDocument();
    });

    it('shows sender callsign and content', () => {
      render(<SignalFeed initialMessages={mockSignalEntries} />);
      expect(screen.getByText('Transmission from the old world. Copy?')).toBeInTheDocument();
    });

    it('shows continent name for each sender', () => {
      render(<SignalFeed initialMessages={mockSignalEntries} />);
      expect(screen.getByText('Europe')).toBeInTheDocument();
      expect(screen.getByText('Oceania')).toBeInTheDocument();
    });

    it('marks interrupted transmissions', () => {
      render(<SignalFeed initialMessages={mockSignalEntries} />);
      expect(screen.getByText(/Transmission got interrupted/i)).toBeInTheDocument();
    });

    it('does not show the interrupted label on clean transmissions', () => {
      render(<SignalFeed initialMessages={[mockSignalEntries[0]]} />);
      expect(screen.queryByText(/Transmission got interrupted/i)).not.toBeInTheDocument();
    });
  });

  describe('real-time socket updates', () => {
    it('prepends a new signal when socket emits signal:received', () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      render(<SignalFeed initialMessages={[]} />);
      expect(screen.getByText(/No signals received yet/i)).toBeInTheDocument();

      const newSignal: SignalEntry = {
        id: 'new-signal-uuid-0001',
        sender_callsign: 'N5XYZ',
        sender_continent: 'na',
        sender_direction: 180,
        content: 'Calling CQ from North America.',
        transmitted_at: new Date().toISOString(),
        is_interrupted: false,
      };

      const calls = mockSocket.on.mock.calls as Array<[string, (d: SignalEntry) => void]>;
      const handler = calls.find(([e]) => e === 'signal:received')?.[1];
      act(() => { handler?.(newSignal); });

      expect(screen.getByText('N5XYZ')).toBeInTheDocument();
      expect(screen.getByText('Calling CQ from North America.')).toBeInTheDocument();
      expect(screen.queryByText(/No signals received yet/i)).not.toBeInTheDocument();
    });

    it('registers and cleans up the socket listener', () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      const { unmount } = render(<SignalFeed initialMessages={[]} />);
      expect(mockSocket.on).toHaveBeenCalledWith('signal:received', expect.any(Function));

      unmount();
      expect(mockSocket.off).toHaveBeenCalledWith('signal:received', expect.any(Function));
    });
  });
});
