import { Card, Rank, Suit, MatchType } from '../types';

export function createDeck(): Card[] {
  const cards: Card[] = [];
  const suits = Object.values(Suit);
  const ranks = Object.values(Rank);

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({
        id: `${rank}${suit}${Math.random()}`,
        suit,
        rank,
      });
    }
  }

  return cards.sort(() => Math.random() - 0.5);
}

export function detectMatch(table: Card[]): MatchType | null {
  if (table.length < 4) return null;

  const latestIndex = table.length - 1;
  const fourthBackIndex = latestIndex - 3;
  const latestCard = table[latestIndex];
  const fourthBackCard = table[fourthBackIndex];

  if (latestCard.rank === fourthBackCard.rank) {
    return MatchType.Rank;
  }

  if (latestCard.suit === fourthBackCard.suit) {
    return MatchType.Suit;
  }

  return null;
}

export function applyMatch(table: Card[], match: MatchType): Card[] {
  const newTable = [...table];
  const latestIndex = newTable.length - 1;
  const fourthBackIndex = latestIndex - 3;

  if (match === MatchType.Rank) {
    newTable.splice(fourthBackIndex, 4);
  } else {
    const middleRight = fourthBackIndex + 2;
    const middleLeft = fourthBackIndex + 1;
    newTable.splice(middleRight, 1);
    newTable.splice(middleLeft, 1);
  }

  return newTable;
}

export function getDisplayName(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function getAccessibilityLabel(card: Card): string {
  const suitNames: Record<Suit, string> = {
    [Suit.Clubs]: 'Clubs',
    [Suit.Diamonds]: 'Diamonds',
    [Suit.Hearts]: 'Hearts',
    [Suit.Spades]: 'Spades',
  };

  const rankNames: Record<Rank, string> = {
    [Rank.Ace]: 'Ace',
    [Rank.Two]: 'Two',
    [Rank.Three]: 'Three',
    [Rank.Four]: 'Four',
    [Rank.Five]: 'Five',
    [Rank.Six]: 'Six',
    [Rank.Seven]: 'Seven',
    [Rank.Eight]: 'Eight',
    [Rank.Nine]: 'Nine',
    [Rank.Ten]: 'Ten',
    [Rank.Jack]: 'Jack',
    [Rank.Queen]: 'Queen',
    [Rank.King]: 'King',
  };

  return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
}
