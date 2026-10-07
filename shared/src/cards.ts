// cards.ts
// Typy i funkcje opisujące pojedynczą kartę oraz talię.
// Znajduje się tu: Suit, Rank, RANK_VALUE, Card, ClientCard, isFaceDown, buildDeck, shuffleDeck.
// Używane przez silniki wszystkich czterech gier po stronie serwera
// oraz przez komponenty kart po stronie klienta.

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

/**
 * Numeryczna wartość karty do porównań (2–14).
 * Używana przez War, Texas Clinch i evaluator Pokera.
 */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

/** Jedna karta w talii. id jest unikalny w ramach rozdania (np. "AH", "10S"). */
export type Card = {
  id: string;
  rank: Rank;
  suit: Suit;
};

/**
 * Karta po stronie klienta.
 * Karta odkryta zawiera pełne dane; karta zakryta tylko liczbę kart w ręce.
 */
export type ClientCard = Card | { faceDown: true };

/** Zwraca true, jeśli karta jest zakryta. */
export function isFaceDown(card: ClientCard): card is { faceDown: true } {
  return 'faceDown' in card && card.faceDown === true;
}

/** Buduje standardową talię 52 kart (bez jokerów). */
export function buildDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${rank}${suit[0].toUpperCase()}`,
      rank,
      suit,
    })),
  );
}

/** Fisher-Yates shuffle — czysta funkcja, nie mutuje wejściowej tablicy. */
export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
