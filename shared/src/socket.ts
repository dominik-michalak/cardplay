// socket.ts
// Kompletny kontrakt zdarzeń Socket.IO — jedyne źródło prawdy dla nazw i kształtów payloadów.
// Zawiera: typy payloadów dla pokoju, matchmakingu, akcji gry i powiadomień
// oraz mapy ServerToClientEvents i ClientToServerEvents używane jako typy generyczne
// przez socket.io po obu stronach połączenia.
// Token JWT przekazywany w socket.handshake.auth.token przy nawiązaniu połączenia.
// Zmiany w tym pliku wymagają osobnego PR zatwierdzonego przez cały team.

import type { GameKey, GameAction, GameResult, GameEvent } from './game';
import type { Room } from './room';

// ─── Pokój ───────────────────────────────────────────────────────────────────

export type RoomJoinPayload  = { roomId: string };
export type RoomLeavePayload = { roomId: string };
export type RoomStatePayload = { room: Room };

export type GameDisconnectWarningPayload = {
  userId: string;
  username: string;
  timeoutSeconds: number;
};

// ─── Matchmaking ─────────────────────────────────────────────────────────────

export type MatchmakingJoinPayload = {
  gameKey: GameKey;
  mode: 'competitive' | 'unrated';
};

export type MatchmakingFoundPayload = {
  roomId: string;
  gameKey: GameKey;
  opponent: { id: string; username: string; elo: number };
};

// ─── Gra ─────────────────────────────────────────────────────────────────────

export type GameActionPayload = {
  roomId: string;
  action: GameAction;
};

export type GameStatePayload = {
  roomId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
};

export type GameEventPayload = {
  roomId: string;
  event: GameEvent;
};

export type GameFinishedPayload = {
  roomId: string;
  result: GameResult;
};

// ─── Powiadomienia ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'matchmaking_found'
  | 'player_joined'
  | 'player_left'
  | 'achievement_unlocked'
  | 'friend_request'
  | 'system';

export type NotificationPayload = {
  type: NotificationType;
  message: string;
  data?: Record<string, unknown>;
};

// ─── Mapy zdarzeń ─────────────────────────────────────────────────────────────
// Jedyne miejsce gdzie definiowane są nazwy zdarzeń.
// Kod serwera i klienta używa tych map jako typów generycznych socket.io —
// TypeScript odrzuci literówki i niezgodne payloady przy kompilacji.

export type ServerToClientEvents = {
  'room:state':               (payload: RoomStatePayload) => void;
  'game:disconnect-warning':  (payload: GameDisconnectWarningPayload) => void;
  'matchmaking:found':        (payload: MatchmakingFoundPayload) => void;
  'game:state':               (payload: GameStatePayload) => void;
  'game:event':               (payload: GameEventPayload) => void;
  'game:finished':            (payload: GameFinishedPayload) => void;
  'notification:new':         (payload: NotificationPayload) => void;
  'error':                    (payload: { code: string; message: string }) => void;
};

export type ClientToServerEvents = {
  'room:join':        (payload: RoomJoinPayload) => void;
  'room:leave':       (payload: RoomLeavePayload) => void;
  'matchmaking:join': (payload: MatchmakingJoinPayload) => void;
  'matchmaking:leave': () => void;
  'game:action':      (payload: GameActionPayload) => void;
};
