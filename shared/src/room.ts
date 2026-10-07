// room.ts
// Typy pokoju, lobby i użytkownika współdzielone przez serwer i klienta.
// Zawiera: RoomStatus, RoomVisibility, UserRole, Room, PublicUser,
// GameDefinition oraz stałą GAME_DEFINITIONS z opisem czterech gier.
// GAME_DEFINITIONS jest jedynym źródłem prawdy dla limitów graczy —
// musi być zgodne z funkcją check_max_players_for_game w 001_core.sql.

import type { GameKey, GameMode, GamePlayer } from './game';

export type RoomStatus = 'waiting' | 'in_progress' | 'finished' | 'archived';

export type RoomVisibility = 'public' | 'private';

export type UserRole = 'user' | 'moderator' | 'admin';

export type Room = {
  id: string;
  gameKey: GameKey;
  mode: GameMode;
  status: RoomStatus;
  // visibility: kolumna NIE istnieje jeszcze w tabeli game_rooms (001_core.sql).
  // Osoba C dodaje migrację z kolumną visibility zanim użyje tego pola w API.
  visibility: RoomVisibility;
  hostId: string;
  maxPlayers: number;
  players: GamePlayer[];
  inviteCode?: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  username: string;
  role: UserRole;
  elo: Partial<Record<GameKey, number>>;
};

export type GameDefinition = {
  key: GameKey;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  rulesSnippet: string;
};

// Limity graczy muszą być zgodne z check_max_players_for_game w 001_core.sql.
// Decyzja produktowa (zatwierdzona): Texas Clinch = 1v1 (maxPlayers: 2).
// Jeśli zasady gry zmienią się na 2–4, wymagany jest PR kontraktowy aktualizujący
// jednocześnie: to pole, SQL w 001_core.sql, smoke.test.ts i dokument podziału prac.
// War: 2, Texas Clinch: 2, Macao: 2–4, Poker: 2–6.
export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    key: 'war',
    name: 'Wojna',
    description: 'Klasyczna gra karciana 1 na 1. Wygrywasz rundę wyższą kartą.',
    minPlayers: 2,
    maxPlayers: 2,
    rulesSnippet: '26 rund. Wyższa karta wygrywa rundę.',
  },
  {
    key: 'macao',
    name: 'Macao',
    description: 'Pozbądź się kart jako pierwszy. Specjalne efekty kart 2, 3, 4, As i Walet.',
    minPlayers: 2,
    maxPlayers: 4,
    rulesSnippet: 'Zagraj kartę w tym samym kolorze lub wartości. Macao na ostatnią kartę!',
  },
  {
    key: 'texas_clinch',
    name: 'Texas Clinch',
    description: 'Szybka gra taktyczna 1 na 1. Wykorzystaj atut i akcję Clinch.',
    minPlayers: 2,
    maxPlayers: 2,
    rulesSnippet: '5 rund. Atut losowany co rundę. Clinch można użyć raz.',
  },
  {
    key: 'poker',
    name: 'Poker',
    description: "Texas Hold'em bez prawdziwych pieniędzy. Do 6 graczy.",
    minPlayers: 2,
    maxPlayers: 6,
    rulesSnippet: 'Blindy 10/20. Maks. 10 rozdań lub do jednego gracza z żetonami.',
  },
];
