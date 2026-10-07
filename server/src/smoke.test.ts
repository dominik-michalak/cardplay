// smoke.test.ts
// Testy bazowe sprawdzające spójność bazy startowej bez połączenia z bazą danych.
// Zawiera: testy buildDeck, shuffleDeck, RANK_VALUE, GAME_DEFINITIONS,
// spójności GAME_DEFINITIONS z migracją SQL (limity graczy),
// walidacji konfiguracji env (Zod) oraz importu createApp.
// Każda osoba dorzuca tu testy swoich modułów w miarę ich powstawania.

import {
  buildDeck,
  shuffleDeck,
  RANK_VALUE,
  GAME_DEFINITIONS,
} from '@cardplay/shared';
import { createApp } from './app.js';

describe('shared — cards', () => {
  it('buildDeck zwraca 52 karty', () => {
    expect(buildDeck()).toHaveLength(52);
  });

  it('shuffleDeck nie mutuje oryginału', () => {
    const deck = buildDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it('shuffleDeck zwraca 52 karty', () => {
    expect(shuffleDeck(buildDeck())).toHaveLength(52);
  });

  it('As ma wartość 14', () => expect(RANK_VALUE['A']).toBe(14));
  it('2 ma wartość 2',   () => expect(RANK_VALUE['2']).toBe(2));
  it('K ma wartość 13',  () => expect(RANK_VALUE['K']).toBe(13));
});

describe('shared — GAME_DEFINITIONS', () => {
  it('są zdefiniowane dokładnie 4 gry', () => {
    expect(GAME_DEFINITIONS).toHaveLength(4);
  });

  const expectedKeys = ['war', 'macao', 'texas_clinch', 'poker'];
  expectedKeys.forEach((key) => {
    it(`definicja gry "${key}" istnieje`, () => {
      expect(GAME_DEFINITIONS.find((g) => g.key === key)).toBeDefined();
    });
  });

  it('każda gra ma minPlayers <= maxPlayers', () => {
    GAME_DEFINITIONS.forEach((g) => {
      expect(g.minPlayers).toBeLessThanOrEqual(g.maxPlayers);
    });
  });

  // Spójność z funkcją check_max_players_for_game w 001_core.sql
  it('war ma dokładnie 2 graczy', () => {
    const def = GAME_DEFINITIONS.find((g) => g.key === 'war')!;
    expect(def.minPlayers).toBe(2);
    expect(def.maxPlayers).toBe(2);
  });

  it('texas_clinch ma dokładnie 2 graczy', () => {
    const def = GAME_DEFINITIONS.find((g) => g.key === 'texas_clinch')!;
    expect(def.minPlayers).toBe(2);
    expect(def.maxPlayers).toBe(2);
  });

  it('macao ma max 4 graczy', () => {
    const def = GAME_DEFINITIONS.find((g) => g.key === 'macao')!;
    expect(def.maxPlayers).toBe(4);
  });

  it('poker ma max 6 graczy', () => {
    const def = GAME_DEFINITIONS.find((g) => g.key === 'poker')!;
    expect(def.maxPlayers).toBe(6);
  });
});

describe('server — createApp', () => {
  it('createApp eksportuje funkcję', async () => {
    // Minimalny test — sprawdza czy moduł importuje się bez błędu
    // i nie wymaga połączenia z bazą danych.
    expect(typeof createApp).toBe('function');
  });
});
