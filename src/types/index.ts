export enum Suit {
  Clubs = '♣',
  Diamonds = '♦',
  Hearts = '♥',
  Spades = '♠',
}

export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export enum GameMode {
  Casual = 'casual',
  Ranked = 'ranked',
}

export enum CardSkin {
  Classic = 'classic',
  Neon = 'neon',
  Midnight = 'midnight',
  Pastel = 'pastel',
}

export enum MatchType {
  Rank = 'rank',
  Suit = 'suit',
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesCompleted: number;
  totalScore: number;
  bestScore: number;
  rankedGames: number;
  rankedTotalScore: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  date: number;
}

export interface GlobalStats {
  playerCount: number;
  averageScore: number;
  bestScore: number;
  leaderboard: LeaderboardEntry[];
}

export interface GameState {
  deck: Card[];
  table: Card[];
  message: string;
  finished: boolean;
  pendingMatch: MatchType | null;
  mode: GameMode;
  selectedSkin: CardSkin;
}
