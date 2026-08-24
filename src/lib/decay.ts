import { daysBetween, todayIso } from './date';
import { computeDecayedXp } from './xp';
import type { Goal, Stat, Streak } from '../types';

/**
 * Decay is computed at read time, never mutated into storage — it's a
 * non-destructive view over the stat's real XP (spec 2.3b: "decay pauses
 * immediately the moment you log that habit again", which falls out for
 * free here since missed-days recomputes from lastCompletedDate).
 */
export function missedDaysForGoal(goal: Goal, streak: Streak | undefined): number {
  if (goal.type !== 'habit' || goal.cadence !== 'daily') return 0; // milestones/quests never decay
  const today = todayIso();
  const lastDate = streak?.lastCompletedDate ?? goal.createdAt.slice(0, 10);
  return Math.max(0, daysBetween(lastDate, today));
}

export interface StatDecayInfo {
  displayedXp: number;
  isDecaying: boolean;
  missedDays: number;
}

export function decayInfoForStat(
  stat: Stat,
  goals: Goal[],
  streaks: Streak[]
): StatDecayInfo {
  const habitsForStat = goals.filter((g) => g.statId === stat.id && g.type === 'habit' && g.cadence === 'daily' && g.active);
  const streakByGoal = new Map(streaks.map((s) => [s.goalId, s]));
  const maxMissed = habitsForStat.reduce(
    (max, g) => Math.max(max, missedDaysForGoal(g, streakByGoal.get(g.id))),
    0
  );
  const displayedXp = computeDecayedXp(stat.currentXp, maxMissed);
  return {
    displayedXp,
    isDecaying: maxMissed > 7,
    missedDays: maxMissed,
  };
}
