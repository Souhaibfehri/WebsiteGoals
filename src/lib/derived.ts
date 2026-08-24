import { levelFromXp } from './xp';
import type { Stat } from '../types';

/** Spec 2.1: "Total character Level = weighted average or sum, shown as a summary number." */
export function characterLevel(stats: Stat[]): number {
  if (stats.length === 0) return 1;
  const total = stats.reduce((sum, s) => sum + levelFromXp(s.currentXp).level, 0);
  return Math.floor(total / stats.length);
}

export function totalXp(stats: Stat[]): number {
  return stats.reduce((sum, s) => sum + s.currentXp, 0);
}
