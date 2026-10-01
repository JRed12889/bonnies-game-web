import { StoryProgress } from '../types';

export const STORY_LEVEL_COUNT = 24;

export interface StoryOutcome {
  progress: StoryProgress;
  level: number;
  scoreLimit: number;
  winsRequired: number;
  passed: boolean;
  levelCompleted: boolean;
  campaignCompleted: boolean;
  alreadyComplete: boolean;
}

export function createInitialStoryProgress(): StoryProgress {
  return { level: 1, winsInLevel: 0, completed: false };
}

export function getStoryChallenge(progress: StoryProgress) {
  const level = Math.min(Math.max(progress.level, 1), STORY_LEVEL_COUNT);
  return {
    level,
    scoreLimit: 28 - 2 * Math.ceil(level / 2),
    winsRequired: level % 2 === 0 ? 2 : 1,
  };
}

export function advanceStoryProgress(progress: StoryProgress, score: number): StoryOutcome {
  const challenge = getStoryChallenge(progress);
  if (progress.completed) {
    return {
      progress,
      ...challenge,
      passed: false,
      levelCompleted: false,
      campaignCompleted: true,
      alreadyComplete: true,
    };
  }

  const passed = score <= challenge.scoreLimit;
  const nextWins = passed ? progress.winsInLevel + 1 : 0;
  const levelCompleted = passed && nextWins >= challenge.winsRequired;
  const campaignCompleted = levelCompleted && challenge.level === STORY_LEVEL_COUNT;
  const nextProgress: StoryProgress = campaignCompleted
    ? { level: challenge.level, winsInLevel: nextWins, completed: true }
    : levelCompleted
      ? { level: challenge.level + 1, winsInLevel: 0, completed: false }
      : { ...progress, winsInLevel: nextWins };

  return {
    progress: nextProgress,
    ...challenge,
    passed,
    levelCompleted,
    campaignCompleted,
    alreadyComplete: false,
  };
}