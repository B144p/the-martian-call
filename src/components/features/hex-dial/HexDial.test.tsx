import React from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { Socket } from 'socket.io-client';
import { render, screen, act, waitFor } from '@/src/test-utils/render';
import { server } from '@/src/mocks/server';
import { createSocket } from '@/src/lib/socket';
import { mockMessage, mockSentMessage, mockInterruptedMessage } from '@/src/mocks/fixtures';
import { HexDial } from './HexDial';

function makeMockSocket() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
}

describe('HexDial', () => {
  describe('hidden states', () => {
    it('renders nothing when there is no active message', () => {
      const { container } = render(<HexDial />, { initialMessage: null });
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when message status is "sent"', () => {
      const { container } = render(<HexDial />, { initialMessage: mockSentMessage });
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when message status is "interrupted"', () => {
      const { container } = render(<HexDial />, { initialMessage: mockInterruptedMessage });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('active transmission', () => {
    it('shows the TRANSMITTING header', () => {
      render(<HexDial />, { initialMessage: mockMessage });
      expect(screen.getByText(/TRANSMITTING/i)).toBeInTheDocument();
    });

    it('shows the pair progress counter', () => {
      render(<HexDial />, { initialMessage: mockMessage });
      const pairs = mockMessage.hex_sequence.split(' ');
      expect(screen.getByText(new RegExp(`/ ${pairs.length} pairs`))).toBeInTheDocument();
    });

    it('renders the interrupt button', () => {
      render(<HexDial />, { initialMessage: mockMessage });
      expect(
        screen.getByRole('button', { name: /INTERRUPT TRANSMISSION/i }),
      ).toBeInTheDocument();
    });
  });

  describe('interrupt flow', () => {
    it('shows interrupting state while the API call is in-flight', async () => {
      let resolveInterrupt!: () => void;
      server.use(
        http.patch('http://localhost/api/v1/messages/:id/interrupt', () =>
          new Promise<Response>((resolve) => {
            resolveInterrupt = () =>
              resolve(
                HttpResponse.json({ data: mockInterruptedMessage, error: null, meta: {} }),
              );
          }),
        ),
      );

      const user = userEvent.setup();
      render(<HexDial />, { initialMessage: mockMessage });
      user.click(screen.getByRole('button', { name: /INTERRUPT TRANSMISSION/i }));

      await screen.findByText(/INTERRUPTING/i);
      expect(screen.getByRole('button', { name: /INTERRUPTING/i })).toBeDisabled();
      resolveInterrupt();
    });

    it('calls the interrupt endpoint with the correct message id', async () => {
      let capturedId: string | undefined;
      server.use(
        http.patch('http://localhost/api/v1/messages/:id/interrupt', ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({ data: mockInterruptedMessage, error: null, meta: {} });
        }),
      );

      const user = userEvent.setup();
      render(<HexDial />, { initialMessage: mockMessage });
      await user.click(screen.getByRole('button', { name: /INTERRUPT TRANSMISSION/i }));

      await waitFor(() => expect(capturedId).toBe(mockMessage.id));
    });
  });

  describe('socket completion event', () => {
    it('hides the dial when transmission:complete fires with matching message id', async () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      const { container } = render(<HexDial />, { initialMessage: mockMessage });
      expect(screen.getByText(/TRANSMITTING/i)).toBeInTheDocument();

      const calls = mockSocket.on.mock.calls as Array<[string, (d: { message_id: string }) => void]>;
      const handler = calls.find(([e]) => e === 'transmission:complete')?.[1];
      act(() => { handler?.({ message_id: mockMessage.id }); });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('does not hide the dial for a different message id', async () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      render(<HexDial />, { initialMessage: mockMessage });

      const calls = mockSocket.on.mock.calls as Array<[string, (d: { message_id: string }) => void]>;
      const handler = calls.find(([e]) => e === 'transmission:complete')?.[1];
      act(() => { handler?.({ message_id: 'some-other-message-id' }); });

      expect(screen.getByText(/TRANSMITTING/i)).toBeInTheDocument();
    });
  });
});
