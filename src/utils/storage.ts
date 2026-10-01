import { PlayerStats, GlobalStats, LeaderboardEntry, CardSkin, GameMode, StoryProgress } from '../types';
import { createInitialStoryProgress } from './storyMode';

const STORAGE_KEY = 'bonnies_game_stats';

export interface SavedStats {
  playerName: string;
  selectedSkin: CardSkin;
  mode: GameMode;
  playerStats: PlayerStats;
  globalStats: GlobalStats;
  storyProgress: StoryProgress;
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
  playerCount: 0,
  averageScore: 0,
  bestScore: 999,
  leaderboard: [],
};

export function loadStats(): SavedStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SavedStats>;
      return {
        playerName: parsed.playerName ?? 'Player',
        selectedSkin: parsed.selectedSkin ?? CardSkin.Classic,
        mode: parsed.mode ?? GameMode.Casual,
        playerStats: { ...defaultPlayerStats, ...parsed.playerStats },
        globalStats: {
          ...defaultGlobalStats,
          ...parsed.globalStats,
          leaderboard: parsed.globalStats?.leaderboard ?? [],
        },
        storyProgress: { ...createInitialStoryProgress(), ...parsed.storyProgress },
      };
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
    storyProgress: createInitialStoryProgress(),
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

  // Update global aggregates (count, average, best) but do NOT auto-add to leaderboard.
  newStats.globalStats.playerCount += 1;
  newStats.globalStats.averageScore =
    (newStats.globalStats.averageScore * (newStats.globalStats.playerCount - 1) + score) /
    newStats.globalStats.playerCount;
  newStats.globalStats.bestScore = Math.min(newStats.globalStats.bestScore, score);

  // leaderboard entries are only added when the player explicitly saves their score.

  saveStats(newStats);
  return newStats;
}

export function addLeaderboardEntry(stats: SavedStats, playerName: string, score: number): SavedStats {
  const newStats = { ...stats };
  const entry: LeaderboardEntry = {
    id: Math.random().toString(36).substr(2, 9),
    playerName,
    score,
    date: Date.now(),
  };
  newStats.globalStats.leaderboard.push(entry);
  newStats.globalStats.leaderboard.sort((a, b) => a.score - b.score);
  if (newStats.globalStats.leaderboard.length > 20) {
    newStats.globalStats.leaderboard = newStats.globalStats.leaderboard.slice(0, 20);
  }
  newStats.globalStats.bestScore = Math.min(newStats.globalStats.bestScore, score);
  saveStats(newStats);
  return newStats;
}

export function clearLeaderboardAndHistory(stats: SavedStats): SavedStats {
  // Preserve playerName and selectedSkin, wipe leaderboard and aggregate history
  const newStats: SavedStats = {
    playerName: stats.playerName || 'Player',
    selectedSkin: stats.selectedSkin || (CardSkin.Classic as CardSkin),
    mode: stats.mode,
    playerStats: {
      gamesPlayed: 0,
      gamesCompleted: 0,
      totalScore: 0,
      bestScore: 52,
      rankedGames: 0,
      rankedTotalScore: 0,
    },
    globalStats: { ...defaultGlobalStats },
    storyProgress: createInitialStoryProgress(),
  };
  saveStats(newStats);
  return newStats;
}
