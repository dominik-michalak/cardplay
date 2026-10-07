// game.ts
// Typy rdzenia gry współdzielone przez serwer i klienta.
// Znajduje się tu: GameKey, GameMode, FinishReason, GamePlayer, GameAction,
// GameEvent, PlayerResult, GameResult oraz interfejs ServerGameModule.
// Każdy silnik gry (war, macao, texas-clinch, poker) implementuje ServerGameModule.

export type GameKey = 'war' | 'macao' | 'texas_clinch' | 'poker';

export type GameMode = 'competitive' | 'unrated' | 'private';

export type FinishReason = 'normal' | 'disconnect' | 'early_finish' | 'walkover';

// ─── Gracz ───────────────────────────────────────────────────────────────────

export type GamePlayer = {
  id: string;
  username: string;
  /** Indeks miejsca przy stole (0-based). */
  seat: number;
  /** Elo gracza w momencie dołączenia do pokoju — do obliczeń Elo. */
  eloAtStart: number;
};

// ─── Akcja ───────────────────────────────────────────────────────────────────

/**
 * Ogólna akcja gracza wysyłana przez Socket.IO.
 * Każda gra rozszerza `payload` o własne pola.
 *
 * @example
 * // War
 * { type: 'WAR_READY', payload: {} }
 *
 * // Macao
 * { type: 'MACAO_PLAY_CARD', payload: { cardId: 'AH', selectedSuit: 'hearts' } }
 *
 * // Poker
 * { type: 'POKER_RAISE', payload: { amount: 100 } }
 */
export type GameAction = {
  type: string;
  payload: Record<string, unknown>;
};

// ─── Zdarzenie (event) ───────────────────────────────────────────────────────

/**
 * Zdarzenie emitowane przez silnik gry po każdym `applyAction`.
 * Serwer broadcastuje je do pokoju razem z nowym stanem.
 */
export type GameEvent = {
  /** Rodzaj zdarzenia, np. 'ROUND_RESULT', 'CARD_DRAWN', 'PLAYER_FOLDED'. */
  type: string;
  /** Dane zdarzenia — zależne od gry. */
  data: Record<string, unknown>;
};

// ─── Wynik ───────────────────────────────────────────────────────────────────

/**
 * Wynik jednego gracza po zakończeniu gry.
 * Zapisywany przez moduł B (scores) do bazy `game_record_players`.
 */
export type PlayerResult = {
  playerId: string;
  username: string;
  /** Końcowa pozycja (1 = zwycięzca). */
  finalRank: number;
  /** Numeryczny wynik do obliczeń Elo (np. 1 = wygrana, 0.5 = remis, 0 = przegrana). */
  eloScore: number;
  /** Elo przed meczem. */
  eloBefore: number;
  /** Elo po meczu — obliczone przez serwis Elo modułu B. */
  eloAfter: number;
  /** Zmiana Elo (eloAfter - eloBefore). */
  eloDelta: number;
};

/**
 * Zbiorczy wynik gry emitowany przez `game:finished`.
 * Obowiązkowo zawiera wyniki wszystkich graczy.
 */
export type GameResult = {
  gameKey: GameKey;
  roomId: string;
  mode: GameMode;
  /** Czas trwania gry w milisekundach. */
  durationMs: number;
  /** Powód zakończenia gry. */
  finishReason: FinishReason;
  /** Wyniki posortowane według finalRank (rosnąco). */
  players: PlayerResult[];
  /**
   * Dodatkowe dane specyficzne dla gry.
   * War: { roundsTotal }
   * Macao: { penalties }
   * Texas Clinch: { clinchUsed }
   * Poker: { handsPlayed }
   */
  metadata: Record<string, string | number | boolean>;
};

// ─── Interfejs modułu serwerowego ────────────────────────────────────────────

/**
 * Kontrakt implementowany przez każdą grę po stronie serwera.
 * Zapewnia jednolity sposób obsługi przez Socket.IO i system pokoi.
 *
 * GameState  — pełny stan gry (serwer) — nigdy nie opuszcza serwera w całości.
 * ClientGameState — zsanityzowany widok stanu wysyłany konkretnemu graczowi.
 */
export type ServerGameModule<GameState, ClientGameState> = {
  /** Klucz identyfikujący grę — musi być unikalny w registry. */
  key: GameKey;

  /** Minimalna i maksymalna liczba graczy wymagana do startu. */
  minPlayers: number;
  maxPlayers: number;

  /** Tworzy początkowy stan gry dla podanych graczy i tasuje talie. */
  createInitialState(players: GamePlayer[]): GameState;

  /**
   * Aplikuje akcję gracza i zwraca nowy stan oraz listę zdarzeń.
   * Rzuca błąd, jeśli akcja jest niezgodna z regułami.
   */
  applyAction(
    state: GameState,
    action: GameAction,
    playerId: string,
  ): { newState: GameState; events: GameEvent[] };

  /** Zwraca true, gdy gra dobiegła końca i można zapisać wyniki. */
  isTerminal(state: GameState): boolean;

  /**
   * Oblicza wynik końcowy z finalnego stanu gry.
   * Wywoływane tylko gdy isTerminal === true.
   * Sygnatura: getResult(state, roomId, mode, durationMs) — cztery argumenty.
   * Dokument podziału pracy pokazuje skróconą formę getResult(state) — jest nieaktualna.
   * shared/src/game.ts jest jedynym źródłem prawdy dla tej sygnatury.
   */
  getResult(state: GameState, roomId: string, mode: GameMode, durationMs: number): GameResult;

  /**
   * Zwraca widok stanu dozwolony dla konkretnego odbiorcy.
   * Ukrywa karty przeciwników, talię i inne ukryte informacje.
   */
  sanitize(state: GameState, recipientId: string): ClientGameState;
};
