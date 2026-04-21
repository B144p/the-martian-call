import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { UserProvider, useUser } from './UserContext';
import { createSocket } from '@/src/lib/socket';
import { mockUser, mockMessage, mockSentMessage } from '@/src/mocks/fixtures';
import type { Direction } from '@/src/types/api';

function makeMockSocket() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
}

// Minimal consumer that exposes context values via data-testid spans
function ContextDisplay() {
  const { user, activeMessage } = useUser();
  return (
    <div>
      <span data-testid="callsign">{user?.callsign ?? 'none'}</span>
      <span data-testid="direction">{user?.antenna_direction ?? 'none'}</span>
      <span data-testid="transmitting">{user?.is_transmitting ? 'yes' : 'no'}</span>
      <span data-testid="message-status">{activeMessage?.status ?? 'none'}</span>
    </div>
  );
}

function ContextActions() {
  const { setAntennaDirection, setTransmitting } = useUser();
  return (
    <div>
      <button onClick={() => setAntennaDirection(270 as Direction)}>rotate to 270</button>
      <button onClick={() => setTransmitting(mockMessage)}>start transmitting</button>
      <button onClick={() => setTransmitting(mockSentMessage)}>finish transmission</button>
      <button onClick={() => setTransmitting(null)}>clear message</button>
    </div>
  );
}

function TestApp(props: React.ComponentProps<typeof UserProvider>) {
  return (
    <UserProvider {...props}>
      <ContextDisplay />
      <ContextActions />
    </UserProvider>
  );
}

describe('UserProvider', () => {
  it('exposes the initial user from props', () => {
    render(
      <TestApp initialUser={mockUser} initialMessage={null} backendToken={null}>
        {null}
      </TestApp>,
    );
    expect(screen.getByTestId('callsign')).toHaveTextContent('W1AW');
  });

  it('exposes null when no initial user', () => {
    render(
      <TestApp initialUser={null} initialMessage={null} backendToken={null}>
        {null}
      </TestApp>,
    );
    expect(screen.getByTestId('callsign')).toHaveTextContent('none');
  });

  describe('setAntennaDirection', () => {
    it('updates the antenna direction on the user', async () => {
      const user = userEvent.setup();
      render(<TestApp initialUser={mockUser} initialMessage={null} backendToken={null}>{null}</TestApp>);
      expect(screen.getByTestId('direction')).toHaveTextContent('90');

      await user.click(screen.getByRole('button', { name: /rotate to 270/i }));
      expect(screen.getByTestId('direction')).toHaveTextContent('270');
    });
  });

  describe('setTransmitting', () => {
    it('sets is_transmitting when message status is transmitting', async () => {
      const user = userEvent.setup();
      render(<TestApp initialUser={mockUser} initialMessage={null} backendToken={null}>{null}</TestApp>);

      await user.click(screen.getByRole('button', { name: /start transmitting/i }));
      expect(screen.getByTestId('transmitting')).toHaveTextContent('yes');
      expect(screen.getByTestId('message-status')).toHaveTextContent('transmitting');
    });

    it('clears is_transmitting when message is sent', async () => {
      const user = userEvent.setup();
      render(<TestApp initialUser={mockUser} initialMessage={mockMessage} backendToken={null}>{null}</TestApp>);

      await user.click(screen.getByRole('button', { name: /finish transmission/i }));
      expect(screen.getByTestId('transmitting')).toHaveTextContent('no');
      expect(screen.getByTestId('message-status')).toHaveTextContent('sent');
    });

    it('clears the active message when called with null', async () => {
      const user = userEvent.setup();
      render(<TestApp initialUser={mockUser} initialMessage={mockMessage} backendToken={null}>{null}</TestApp>);

      await user.click(screen.getByRole('button', { name: /clear message/i }));
      expect(screen.getByTestId('message-status')).toHaveTextContent('none');
    });
  });

  describe('socket lifecycle', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('creates a socket when backendToken and user are present', () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      render(<TestApp initialUser={mockUser} initialMessage={null} backendToken="valid-jwt">{null}</TestApp>);
      expect(createSocket).toHaveBeenCalledWith('valid-jwt');
    });

    it('does not create a socket when backendToken is absent', () => {
      render(<TestApp initialUser={mockUser} initialMessage={null} backendToken={null}>{null}</TestApp>);
      expect(createSocket).not.toHaveBeenCalled();
    });

    it('disconnects the socket on unmount', () => {
      const mockSocket = makeMockSocket();
      jest.mocked(createSocket).mockReturnValue(mockSocket as unknown as Socket);

      const { unmount } = render(
        <TestApp initialUser={mockUser} initialMessage={null} backendToken="valid-jwt">{null}</TestApp>,
      );
      unmount();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});

describe('useUser', () => {
  it('throws when used outside of UserProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    function Orphan() {
      useUser();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useUser must be used inside <UserProvider>');
    spy.mockRestore();
  });
});
