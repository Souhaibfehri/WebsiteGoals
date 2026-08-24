// Domain types — mirror the Supabase/Postgres schema in the spec (Section 4) 1:1
// so the local repository and a future Supabase repository are interchangeable.

export type StatName =
  | 'Wealth'
  | 'Empire'
  | 'Work'
  | 'Body'
  | 'Reputation'
  | 'Content'
  | 'Mind';

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

/** Top-level grouping for quests — a "campaign" the quest belongs to. */
export type Track = 'Property' | 'Empire' | 'Work' | 'Health' | 'Reputation' | 'Content' | 'Personal';

export const TRACKS: Track[] = ['Property', 'Empire', 'Work', 'Health', 'Reputation', 'Content', 'Personal'];

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
  /** Quests only: campaign grouping and where in the world it happens. */
  track: Track | null;
  location: string | null;
  unit: string | null; // milestones: '$', 'kg', 'subs'...
}

/**
 * A named threshold inside a numeric target — "€25,000 banked" on the way to
 * €100,000. Reaching one pays XP; falling back below it takes that XP back, so
 * the sheet always reflects where the money actually is.
 */
export interface Checkpoint {
  id: string;
  goalId: string;
  userId: string;
  label: string;
  value: number;
  reached: boolean;
  reachedAt: string | null;
  xpValue: number;
}

/**
 * One movement on a target: money put in, or money taken back out. Withdrawals
 * are first-class rather than an edit, because spending the house fund is a real
 * event with a date and a reason, and the chart should show the dip.
 */
export interface LedgerEntry {
  id: string;
  goalId: string;
  userId: string;
  delta: number; // positive = contribution, negative = setback
  note: string | null;
  at: string;
  balanceAfter: number;
}

/** An ordered checklist item inside a quest. Awards XP when checked. */
export interface QuestStep {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  done: boolean;
  doneAt: string | null;
  sortOrder: number;
  xpValue: number;
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

/**
 * Display order is load-bearing: the stat hues were validated as a categorical
 * palette in exactly this sequence (worst adjacent CVD ΔE 8.4). Reordering
 * without re-running the validator can put two indistinguishable hues side by
 * side.
 */
export const STAT_ORDER: StatName[] = [
  'Wealth',
  'Empire',
  'Body',
  'Content',
  'Reputation',
  'Work',
  'Mind',
];

/** CSS custom-property name carrying each domain's identity hue. */
export const STAT_COLOR_VAR: Record<StatName, string> = {
  Wealth: '--stat-wealth',
  Empire: '--stat-empire',
  Body: '--stat-body',
  Content: '--stat-content',
  Reputation: '--stat-reputation',
  Work: '--stat-work',
  Mind: '--stat-mind',
};

export function statColor(name: StatName): string {
  return `var(${STAT_COLOR_VAR[name]})`;
}

export const STAT_ICON: Record<StatName, string> = {
  Wealth: 'coins',
  Empire: 'building',
  Work: 'briefcase',
  Body: 'activity',
  Reputation: 'star',
  Content: 'video',
  Mind: 'brain',
};

/** Compact labels for the dashboard's seven-column domain strip. */
export const STAT_SHORT: Record<StatName, string> = {
  Wealth: 'Wealth',
  Empire: 'Empire',
  Body: 'Body',
  Content: 'Content',
  Reputation: 'Rep',
  Work: 'Work',
  Mind: 'Mind',
};

export const STAT_BLURB: Record<StatName, string> = {
  Wealth: 'Money, savings, property value',
  Empire: 'Businesses built, countries entered, systems that run without you',
  Work: 'Craft, deep work, client and job outcomes',
  Body: 'Training, sleep, food, hygiene',
  Reputation: 'Network, brand, how you are known',
  Content: 'Things published — video, writing, posts',
  Mind: 'Learning, reflection, discipline',
};

/** Completing every step of a quest pays this multiple of the quest's own xpValue. */
export const QUEST_COMPLETION_BONUS = 1;
