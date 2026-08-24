// Pure XP/leveling math — no I/O, fully unit-testable.
// Spec Section 2.2: XP required for level N -> N+1 = 50 * N^1.5

export function xpForLevel(level: number): number {
  return Math.round(50 * Math.pow(level, 1.5));
}

/** Total cumulative XP required to *reach* `level` starting from level 1 (0 XP). */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let n = 1; n < level; n++) total += xpForLevel(n);
  return total;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
}

/** Derive level + progress-within-level from a total lifetime XP value. */
export function levelFromXp(totalXp: number): LevelProgress {
  let level = 1;
  let floor = 0;
  while (true) {
    const step = xpForLevel(level);
    if (floor + step > totalXp) {
      return {
        level,
        xpIntoLevel: totalXp - floor,
        xpForNextLevel: step,
        progress: step === 0 ? 0 : (totalXp - floor) / step,
      };
    }
    floor += step;
    level++;
  }
}

/** Spec 2.3: 1 + min(streak_days * 0.02, 0.5) — caps at +50% around day 25. */
export function streakMultiplier(currentStreakDays: number): number {
  return 1 + Math.min(currentStreakDays * 0.02, 0.5);
}

export function xpForCompletion(baseXp: number, currentStreakDays: number): number {
  return Math.round(baseXp * streakMultiplier(currentStreakDays));
}

/** Spec 2.4: ~1 coin per 10 XP. */
export function coinsForXp(xp: number): number {
  return Math.floor(xp / 10);
}

/**
 * Spec 2.3b: decay only starts after 7+ consecutive missed days, at 1% of the
 * stat's XP (as it stood when decay began) per day past the grace window,
 * capped at 15% total loss. `baselineXp` is the stat's XP at the moment the
 * 7-day grace window closed (i.e. before any decay has been applied).
 */
export function computeDecayedXp(baselineXp: number, consecutiveMissedDays: number): number {
  const decayDays = Math.max(0, consecutiveMissedDays - 7);
  const decayPct = Math.min(decayDays * 0.01, 0.15);
  return Math.round(baselineXp * (1 - decayPct));
}
