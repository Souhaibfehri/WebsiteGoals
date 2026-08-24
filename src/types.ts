// Domain types — mirror the Supabase/Postgres schema in the spec (Section 4) 1:1
// so the local repository and a future Supabase repository are interchangeable.

export type StatName = 'Wealth' | 'Body' | 'Career' | 'Discipline' | 'Mind';

export interface Stat {
  id: string;
  userId: string;
  name: StatName;
  currentXp: number;
  level: number;
  icon: string;
  sortOrder: number;
}

export type GoalType = 'habit' | 'milestone' | 'quest' | 'rating' | 'weekly';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'milestone';

export type Cadence = 'daily' | 'weekly' | null;

export interface Goal {
  id: string;
  userId: string;
  statId: string;
  title: string;
  type: GoalType;
  difficulty: Difficulty;
  xpValue: number;
  targetValue: number | null; // milestones, e.g. 10000
  currentValue: number; // milestones, running progress
  cadence: Cadence;
  active: boolean;
  createdAt: string;
}

export interface GoalLog {
  id: string;
  goalId: string;
  userId: string;
  completedAt: string;
  valueLogged: number | null; // for milestone/partial progress updates
  xpAwarded: number;
}

export interface Streak {
  goalId: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null; // ISO date (yyyy-mm-dd)
}

export interface Unlockable {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'cosmetic' | 'functional';
}

export interface UserUnlock {
  userId: string;
  unlockableId: string;
  unlockedAt: string;
}

export interface DayLog {
  id: string;
  userId: string;
  logDate: string; // ISO date
  workRating: number | null; // 1-5
  healthRating: number | null;
  moodRating: number | null;
  notes: string | null;
}

export interface Wallet {
  userId: string;
  coins: number;
}

// Difficulty -> suggested XP value, per spec Section 2.2
export const DIFFICULTY_XP: Record<Difficulty, number> = {
  trivial: 5,
  easy: 10,
  medium: 25,
  hard: 100,
  milestone: 500,
};

export const STAT_ORDER: StatName[] = ['Wealth', 'Body', 'Career', 'Discipline', 'Mind'];

export const STAT_ICON: Record<StatName, string> = {
  Wealth: 'coins',
  Body: 'activity',
  Career: 'briefcase',
  Discipline: 'target',
  Mind: 'brain',
};
