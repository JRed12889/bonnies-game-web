import { PlayerStats, GlobalStats, LeaderboardEntry, CardSkin, GameMode } from '../types';

const STORAGE_KEY = 'bonnies_game_stats';

export interface SavedStats {
  playerName: string;
  selectedSkin: CardSkin;
  mode: GameMode;
  playerStats: PlayerStats;
  globalStats: GlobalStats;
}

const defaultPlayerStats: PlayerStats = {
  gamesPlayed: 0,
  gamesCompleted: 0,
  totalScore: 0,
  bestScore: 52,
  rankedGames: 0,
  rankedTotalScore: 0,
};

const defaultGlobalStats: GlobalStats = {
  playerCount: 1200,
  averageScore: 18.4,
  bestScore: 8,
  leaderboard: [
    { id: '1', playerName: 'Avery', score: 8, date: Date.now() - 3600 * 24 * 1000 },
    { id: '2', playerName: 'Kai', score: 10, date: Date.now() - 3600 * 8 * 1000 },
    { id: '3', playerName: 'Mila', score: 12, date: Date.now() - 3600 * 18 * 1000 },
    { id: '4', playerName: 'Noah', score: 14, date: Date.now() - 3600 * 40 * 1000 },
    { id: '5', playerName: 'Sam', score: 16, date: Date.now() - 3600 * 72 * 1000 },
  ],
};

export function loadStats(): SavedStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }

  return {
    playerName: 'Player',
    selectedSkin: CardSkin.Classic,
    mode: GameMode.Casual,
    playerStats: { ...defaultPlayerStats },
    globalStats: { ...defaultGlobalStats },
  };
}

export function saveStats(stats: SavedStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

export function recordGame(
  stats: SavedStats,
  score: number,
  mode: GameMode
): SavedStats {
  const newStats = { ...stats };
  newStats.playerStats.gamesPlayed += 1;
  newStats.playerStats.gamesCompleted += 1;
  newStats.playerStats.totalScore += score;
  newStats.playerStats.bestScore = Math.min(
    newStats.playerStats.bestScore,
    score
  );

  if (mode === GameMode.Ranked) {
    newStats.playerStats.rankedGames += 1;
    newStats.playerStats.rankedTotalScore += score;
  }

  newStats.globalStats.playerCount += 1;
  newStats.globalStats.averageScore =
    (newStats.globalStats.averageScore * (newStats.globalStats.playerCount - 1) +
      score) /
    newStats.globalStats.playerCount;
  newStats.globalStats.bestScore = Math.min(
    newStats.globalStats.bestScore,
    score
  );

  const entry: LeaderboardEntry = {
    id: Math.random().toString(36).substr(2, 9),
    playerName: newStats.playerName,
    score,
    date: Date.now(),
  };
  newStats.globalStats.leaderboard.push(entry);
  newStats.globalStats.leaderboard.sort((a, b) => a.score - b.score);
  if (newStats.globalStats.leaderboard.length > 10) {
    newStats.globalStats.leaderboard = newStats.globalStats.leaderboard.slice(
      0,
      10
    );
  }

  saveStats(newStats);
  return newStats;
}
