import type { IconName } from '../components/common/Icon';

/**
 * The facts an achievement can be judged against. Kept as a flat snapshot so
 * the definitions stay pure and testable, with no store access.
 */
export interface AchievementSnapshot {
  totalXp: number;
  characterLevel: number;
  currentStreak: number;
  bestStreak: number;
  habitCompletions: number;
  questStepsDone: number;
  questsCompleted: number;
  milestonesBanked: number;
  totalBanked: number;
  countriesStarted: number;
  daysActive: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  color: string;
  /** Current value and the value needed, so locked badges can show progress. */
  progress: (s: AchievementSnapshot) => { have: number; need: number };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your first habit',
    icon: 'check',
    color: 'var(--body)',
    progress: (s) => ({ have: s.habitCompletions, need: 1 }),
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Hold a 7-day streak',
    icon: 'flame',
    color: 'var(--accent)',
    progress: (s) => ({ have: s.bestStreak, need: 7 }),
  },
  {
    id: 'month-strong',
    title: 'Unbreakable',
    description: 'Hold a 30-day streak',
    icon: 'flame',
    color: 'var(--danger)',
    progress: (s) => ({ have: s.bestStreak, need: 30 }),
  },
  {
    id: 'century',
    title: 'Century',
    description: 'Hold a 100-day streak',
    icon: 'star',
    color: 'var(--content)',
    progress: (s) => ({ have: s.bestStreak, need: 100 }),
  },
  {
    id: 'xp-1k',
    title: 'Getting Going',
    description: 'Earn 1,000 XP',
    icon: 'activity',
    color: 'var(--empire)',
    progress: (s) => ({ have: s.totalXp, need: 1000 }),
  },
  {
    id: 'xp-10k',
    title: 'Serious Player',
    description: 'Earn 10,000 XP',
    icon: 'activity',
    color: 'var(--mind)',
    progress: (s) => ({ have: s.totalXp, need: 10000 }),
  },
  {
    id: 'level-10',
    title: 'Double Digits',
    description: 'Reach character level 10',
    icon: 'grid',
    color: 'var(--work)',
    progress: (s) => ({ have: s.characterLevel, need: 10 }),
  },
  {
    id: 'quest-first',
    title: 'Campaigner',
    description: 'Finish a whole quest',
    icon: 'map',
    color: 'var(--reputation)',
    progress: (s) => ({ have: s.questsCompleted, need: 1 }),
  },
  {
    id: 'steps-50',
    title: 'Ground Covered',
    description: 'Complete 50 quest steps',
    icon: 'arrow-right',
    color: 'var(--empire)',
    progress: (s) => ({ have: s.questStepsDone, need: 50 }),
  },
  {
    id: 'first-milestone',
    title: 'Money Moves',
    description: 'Bank your first target milestone',
    icon: 'coins',
    color: 'var(--wealth)',
    progress: (s) => ({ have: s.milestonesBanked, need: 1 }),
  },
  {
    id: 'banked-100k',
    title: 'Six Figures',
    description: 'Bank 100,000 across your targets',
    icon: 'coins',
    color: 'var(--content)',
    progress: (s) => ({ have: s.totalBanked, need: 100000 }),
  },
  {
    id: 'globe',
    title: 'Two Flags',
    description: 'Run a quest in two different places',
    icon: 'pin',
    color: 'var(--work)',
    progress: (s) => ({ have: s.countriesStarted, need: 2 }),
  },
];

export function isUnlocked(def: AchievementDef, s: AchievementSnapshot): boolean {
  const { have, need } = def.progress(s);
  return have >= need;
}

/** Ids newly satisfied that were not already recorded as unlocked. */
export function newlyUnlocked(s: AchievementSnapshot, already: string[]): string[] {
  const owned = new Set(already);
  return ACHIEVEMENTS.filter((d) => !owned.has(d.id) && isUnlocked(d, s)).map((d) => d.id);
}
