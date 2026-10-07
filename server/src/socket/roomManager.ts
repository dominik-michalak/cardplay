// socket/roomManager.ts
// Centralny menedżer pokoi i przepływu akcji gry. Właściciel: Osoba C.
// Zawiera: typ RoomState przechowujący stan aktywnej gry w pamięci,
// oraz klasę RoomManager z metodami handleAction i handleDisconnect.
// Każda akcja gracza przechodzi przez ten plik przed wywołaniem silnika gry:
//   1. Sprawdź czy roomId istnieje i gracz należy do pokoju
//   2. Sprawdź czy to tura gracza (deleguje do modułu gry)
//   3. Wywołaj module.applyAction — jedyne miejsce gdzie zmienia się stan gry
//   4. Zapisz nowy stan do bazy (game_records.state)
//   5. Wyślij module.sanitize(state, recipientId) osobno do każdego gracza
// Silniki gier (war, macao, texas-clinch, poker) NIE importują socket.io.

import type { Server, Socket } from 'socket.io';
import type {
  ServerGameModule,
  GameAction,
  GamePlayer,
} from '@cardplay/shared';
import type { GameActionPayload, ServerToClientEvents, ClientToServerEvents } from '@cardplay/shared';

type SocketData = { userId: string; username: string; role: string };
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// Stan aktywnej gry trzymany w pamięci (per instancja serwera).
// Przy restarcie serwera odtwarzany z game_records.state w bazie.
type ActiveRoom = {
  roomId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: ServerGameModule<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  players: GamePlayer[];
  socketIds: Map<string, string>; // userId → socketId
};

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>();

  // Właściciel C rejestruje aktywny pokój gdy matchmaking znajdzie graczy.
  registerRoom(
    roomId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: ServerGameModule<any, any>,
    players: GamePlayer[],
  ): void {
    const state = module.createInitialState(players);
    this.rooms.set(roomId, {
      roomId,
      module,
      state,
      players,
      socketIds: new Map(),
    });
  }

  bindSocket(roomId: string, userId: string, socketId: string): void {
    this.rooms.get(roomId)?.socketIds.set(userId, socketId);
  }

  // Centralny punkt obsługi każdej akcji gracza.
  // Wywołany przez handler 'game:action' w socket/index.ts.
  handleAction(io: AppServer, socket: AppSocket, payload: GameActionPayload): void {
    const { roomId, action } = payload;
    const room = this.rooms.get(roomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Pokój nie istnieje.' });
      return;
    }

    if (!room.players.find((p) => p.id === socket.data.userId)) {
      socket.emit('error', { code: 'NOT_IN_ROOM', message: 'Nie należysz do tego pokoju.' });
      return;
    }

    try {
      const { newState, events } = room.module.applyAction(
        room.state,
        action as GameAction,
        socket.data.userId,
      );

      room.state = newState;

      // Wyślij zsanityzowany stan osobno do każdego gracza.
      for (const player of room.players) {
        const socketId = room.socketIds.get(player.id);
        if (!socketId) continue;

        const clientState = room.module.sanitize(newState, player.id);
        io.to(socketId).emit('game:state', { roomId, state: clientState });
      }

      // Wyślij zdarzenia narracyjne do całego pokoju.
      for (const event of events) {
        io.to(roomId).emit('game:event', { roomId, event });
      }

      // Gdy gra się skończyła — emituj wynik (Osoba B zapisuje go do bazy).
      if (room.module.isTerminal(newState)) {
        const result = room.module.getResult(newState, roomId, 'unrated', 0);
        io.to(roomId).emit('game:finished', { roomId, result });
        this.rooms.delete(roomId);
      }
    } catch (err) {
      socket.emit('error', {
        code: 'INVALID_ACTION',
        message: err instanceof Error ? err.message : 'Niedozwolona akcja.',
      });
    }
  }

  handleDisconnect(io: AppServer, socket: AppSocket): void {
    // Właściciel C implementuje logikę 60-sekundowego timeoutu i walkowera.
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, socketId] of room.socketIds.entries()) {
        if (socketId === socket.id) {
          room.socketIds.delete(userId);
          io.to(roomId).emit('game:disconnect-warning', {
            userId,
            username: socket.data.username,
            timeoutSeconds: 60,
          });
          return;
        }
      }
    }
  }
}

export const roomManager = new RoomManager();
