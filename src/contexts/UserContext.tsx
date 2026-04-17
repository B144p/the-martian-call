'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type { User, Message, Direction } from '@/src/types/api';
import { apiClient } from '@/src/lib/api/client';
import { createSocket } from '@/src/lib/socket';

interface UserContextValue {
  user: User | null;
  activeMessage: Message | null;
  backendToken: string | null;
  socket: Socket | null;
  setAntennaDirection: (direction: Direction) => void;
  setTransmitting: (message: Message | null) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  initialUser: User | null;
  initialMessage: Message | null;
  backendToken: string | null;
  children: React.ReactNode;
}

export function UserProvider({
  initialUser,
  initialMessage,
  backendToken,
  children,
}: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [activeMessage, setActiveMessage] = useState<Message | null>(initialMessage);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (backendToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [backendToken]);

  useEffect(() => {
    if (!backendToken || !initialUser) return;

    const s = createSocket(backendToken);
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [backendToken, initialUser?.id]);

  function setAntennaDirection(direction: Direction) {
    setUser((prev) => (prev ? { ...prev, antenna_direction: direction } : prev));
  }

  function setTransmitting(message: Message | null) {
    setActiveMessage(message);
    setUser((prev) =>
      prev ? { ...prev, is_transmitting: message?.status === 'transmitting' } : prev,
    );
  }

  return (
    <UserContext.Provider
      value={{ user, activeMessage, backendToken, socket, setAntennaDirection, setTransmitting }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
