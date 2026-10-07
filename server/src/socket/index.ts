// socket/index.ts
// Centralny punkt montażowy serwera Socket.IO. Właściciel: Osoba C.
// Zawiera: walidację JWT przy handshake, rate limiting akcji gry (max 10/s per socket),
// centralny handler game:action delegujący do RoomManager oraz funkcję cleanup()
// zatrzymującą timer rate limitera. Plik chroniony — zmiany tylko przez PR.

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { ServerToClientEvents, ClientToServerEvents } from '@cardplay/shared';

type SocketData = {
  userId: string;
  username: string;
  role: string;
};

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export type SocketServer = {
  io: AppServer;
  cleanup: () => void;
};

const GAME_ACTION_RATE_LIMIT = 10;

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  // ─── Middleware: weryfikacja JWT przy handshake ───────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('UNAUTHORIZED: Brak tokenu JWT'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        username: string;
        role: string;
      };

      socket.data.userId = payload.sub;
      socket.data.username = payload.username;
      socket.data.role = payload.role;

      next();
    } catch {
      next(new Error('UNAUTHORIZED: Nieprawidłowy lub wygasły token'));
    }
  });

  // ─── Rate limit akcji gry ────────────────────────────────────────────────
  // unref() sprawia że timer nie blokuje zakończenia procesu Node.js,
  // co eliminuje konieczność używania --forceExit w testach.
  const actionCounts = new Map<string, number>();
  const rateLimitInterval = setInterval(() => actionCounts.clear(), 1000).unref();

  function isRateLimited(socketId: string): boolean {
    const count = (actionCounts.get(socketId) ?? 0) + 1;
    actionCounts.set(socketId, count);
    return count > GAME_ACTION_RATE_LIMIT;
  }

  // ─── Połączenie ──────────────────────────────────────────────────────────
  io.on('connection', (socket: AppSocket) => {
    console.log(`[Socket] Połączono: ${socket.data.username} (${socket.id})`);

    // Właściciel C montuje tu handlery pokoi i matchmakingu:
    // mountRoomHandlers(io, socket, roomManager);
    // mountMatchmakingHandlers(io, socket, roomManager);

    // Właściciel A montuje handler War:
    // mountWarHandlers(io, socket, roomManager);

    // Właściciel B montuje handler Macao:
    // mountMacaoHandlers(io, socket, roomManager);

    // Właściciel C montuje handlery Texas Clinch i Poker:
    // mountTexasClinchHandlers(io, socket, roomManager);
    // mountPokerHandlers(io, socket, roomManager);

    // ─── Centralny handler akcji gry ─────────────────────────────────────
    // Przepływ: rate limit → walidacja roomId → sprawdzenie członkostwa
    // → sprawdzenie tury → module.applyAction → zapis → sanitize per odbiorca.
    // Konkretne silniki gier NIE obsługują Socket.IO bezpośrednio —
    // RoomManager wywołuje je i rozsyła wynik.
    socket.on('game:action', (_payload) => {
      if (isRateLimited(socket.id)) {
        socket.emit('error', {
          code: 'RATE_LIMITED',
          message: 'Zbyt wiele akcji. Zwolnij.',
        });
        return;
      }

      // Właściciel C implementuje tu wywołanie roomManager.handleAction(socket, payload).
      // roomManager.handleAction(socket, payload);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Rozłączono: ${socket.data.username} — ${reason}`);
      actionCounts.delete(socket.id);
      // Właściciel C implementuje tu obsługę rozłączenia w roomManager.
      // roomManager.handleDisconnect(socket);
    });
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  function cleanup() {
    clearInterval(rateLimitInterval);
    io.close();
  }

  return { io, cleanup };
}
