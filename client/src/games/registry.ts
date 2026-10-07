// client/src/games/registry.ts
// Rejestr gier łączący klucz gry z komponentami React i ścieżkami URL.
// Znajduje się tu: typ GameRoute oraz tablica GAME_REGISTRY.
// Każda gra dostarcza własny plik gameDefinition.ts — Osoba A scala je tu w PR.
// Plik chroniony — zmiany tylko przez PR.

import type { GameKey } from '@cardplay/shared';
import type { ComponentType } from 'react';

export type GameRoute = {
  key: GameKey;
  /** Ścieżka do strony pokoju oczekiwania */
  roomPath: string;
  /** Ścieżka do aktywnej gry */
  gamePath: string;
  /** Lazy-loaded komponent pokoju */
  RoomPage: ComponentType;
  /** Lazy-loaded komponent gry */
  GamePage: ComponentType;
};

// Rejestr będzie uzupełniany przez każdą osobę w osobnym PR:
//
// import { warDefinition }          from './war/warDefinition';
// import { macaoDefinition }        from './macao/macaoDefinition';
// import { texasClinchDefinition }  from './texas-clinch/texasClinchDefinition';
// import { pokerDefinition }        from './poker/pokerDefinition';
//
// export const GAME_REGISTRY: GameRoute[] = [
//   warDefinition,
//   macaoDefinition,
//   texasClinchDefinition,
//   pokerDefinition,
// ];

export const GAME_REGISTRY: GameRoute[] = [];
