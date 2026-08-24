import { daysBetween } from './date';

export interface StreakInput {
  current: number;
  best: number;
  lastGoalDate: string | null;
  freezes: number;
  /** The day whose goal was just met. */
  today: string;
}

export interface StreakResult {
  current: number;
  best: number;
  lastGoalDate: string;
  freezes: number;
  /** Days that a freeze covered, so the calendar can mark them. */
  frozenDates: string[];
  /** True when the run ended and restarted from one. */
  broke: boolean;
  /** True when a freeze saved the run. */
  saved: boolean;
}

function isoPlusDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Advances the daily streak when a day's goal is met.
 *
 * A streak freeze is spent automatically to bridge missed days rather than
 * being something to remember to activate — the point of owning one is that a
 * single bad day doesn't wipe weeks of work, which is the cliff that makes
 * habit apps feel punishing.
 */
export function advanceStreak({
  current,
  best,
  lastGoalDate,
  freezes,
  today,
}: StreakInput): StreakResult {
  // First ever goal, or same day again — the day only counts once.
  if (!lastGoalDate) {
    const next = Math.max(1, current === 0 ? 1 : current);
    return {
      current: next,
      best: Math.max(best, next),
      lastGoalDate: today,
      freezes,
      frozenDates: [],
      broke: false,
      saved: false,
    };
  }

  const gap = daysBetween(lastGoalDate, today);

  if (gap <= 0) {
    return {
      current,
      best,
      lastGoalDate,
      freezes,
      frozenDates: [],
      broke: false,
      saved: false,
    };
  }

  if (gap === 1) {
    const next = current + 1;
    return {
      current: next,
      best: Math.max(best, next),
      lastGoalDate: today,
      freezes,
      frozenDates: [],
      broke: false,
      saved: false,
    };
  }

  // Gap of N days means N-1 missed days between the two goals.
  const missed = gap - 1;
  if (freezes >= missed) {
    const frozenDates = Array.from({ length: missed }, (_, i) => isoPlusDays(lastGoalDate, i + 1));
    const next = current + 1;
    return {
      current: next,
      best: Math.max(best, next),
      lastGoalDate: today,
      freezes: freezes - missed,
      frozenDates,
      broke: false,
      saved: true,
    };
  }

  return {
    current: 1,
    best: Math.max(best, 1),
    lastGoalDate: today,
    freezes,
    frozenDates: [],
    broke: true,
    saved: false,
  };
}

/** Whether a run is still alive as of `today`, without mutating anything. */
export function streakIsAlive(lastGoalDate: string | null, today: string, freezes: number): boolean {
  if (!lastGoalDate) return false;
  const gap = daysBetween(lastGoalDate, today);
  return gap <= 1 + freezes;
}

/** Celebration thresholds — the runs worth making a moment of. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function streakMilestoneReached(previous: number, next: number): number | null {
  return STREAK_MILESTONES.find((m) => previous < m && next >= m) ?? null;
}
