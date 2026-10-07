// context/SocketContext.tsx
// Kontekst Socket.IO — zarządza połączeniem WebSocket i jego cyklem życia.
// Zawiera: SocketContext, SocketProvider oraz hook useSocket.
// Połączenie otwierane po zalogowaniu (gdy accessToken jest dostępny),
// zamykane przy wylogowaniu. JWT przekazywany w handshake.auth.token.
// Właściciel: Osoba C — rozszerza o handlery pokoi i matchmakingu.

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@cardplay/shared';
import { useAuth } from './AuthContext';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: AppSocket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      auth: { token: accessToken },
      autoConnect: true,
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Błąd połączenia:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected: !!socketRef.current?.connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
