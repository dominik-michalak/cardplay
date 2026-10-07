// api.ts
// Typy żądań i odpowiedzi REST API współdzielone przez serwer i klienta.
// Znajduje się tu: ApiError, typy auth (RegisterRequest, LoginRequest, AuthResponse),
// typy pokoi i matchmakingu, LeaderboardEntry, ProfileResponse, Ticket oraz Achievement.
// Każdy endpoint REST ma tu odpowiadający typ żądania i typ odpowiedzi.

import type { GameKey, GameMode, GameResult } from './game';
import type { PublicUser, Room, UserRole } from './room';

// ─── Błąd API ────────────────────────────────────────────────────────────────

export type ApiError = {
  error: {
    /** Maszynowy kod błędu, np. 'INVALID_CREDENTIALS', 'ROOM_FULL'. */
    code: string;
    /** Czytelny opis błędu (może być wyświetlony użytkownikowi). */
    message: string;
  };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

// ─── Pokoje ──────────────────────────────────────────────────────────────────

export type CreateRoomRequest = {
  gameKey: GameKey;
  mode: GameMode;
  maxPlayers: number;
  // visibility: kolumna NIE istnieje jeszcze w tabeli game_rooms.
  // Osoba C dodaje migrację z tą kolumną zanim endpoint zacznie ją przyjmować.
  visibility: 'public' | 'private';
};

export type CreateRoomResponse = {
  room: Room;
};

export type JoinRoomResponse = {
  room: Room;
};

export type JoinByCodeRequest = {
  inviteCode: string;
};

// ─── Matchmaking ─────────────────────────────────────────────────────────────

export type JoinQueueRequest = {
  gameKey: GameKey;
  mode: 'competitive' | 'unrated';
};

// ─── Wyniki i ranking ────────────────────────────────────────────────────────

export type SaveScoreRequest = {
  gameRecordId: string;
  result: GameResult;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
};

export type LeaderboardResponse = {
  gameKey: GameKey;
  period: 'all_time' | 'weekly';
  entries: LeaderboardEntry[];
};

// ─── Profil ──────────────────────────────────────────────────────────────────

export type UserStats = {
  gameKey: GameKey;
  gamesPlayed: number;
  gamesWon: number;
  elo: number;
  bestScore: number;
};

export type ProfileResponse = {
  user: PublicUser;
  stats: UserStats[];
};

// ─── Zgłoszenia ──────────────────────────────────────────────────────────────

export type CreateTicketRequest = {
  subject: string;
  body: string;
};

export type TicketStatus = 'open' | 'in_review' | 'resolved' | 'closed';

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: TicketStatus;
  createdAt: string;
  replies: TicketReply[];
};

export type TicketReply = {
  id: string;
  authorId: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
};

// ─── Osiągnięcia ─────────────────────────────────────────────────────────────

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  gameKey: GameKey | null;
  /** 0–100 — postęp w odblokowaniu. */
  progress: number;
  unlockedAt: string | null;
};
