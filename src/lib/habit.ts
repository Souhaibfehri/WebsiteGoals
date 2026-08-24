/**
 * Habit tracking rules.
 *
 * A habit is no longer a one-way "tapped it, done forever" flag. Every habit
 * holds a value for each day, so a mis-tap is reversible, partial progress is
 * real progress, and "four times this week" is expressible without pretending
 * it is a daily task.
 */

export type TrackingMode = 'binary' | 'count' | 'duration';

export interface HabitDeltaInput {
  currentValue: number;
  delta: number;
  target: number;
  /** XP paid once, when the day's target is first met. */
  xpValue: number;
  /** Streak multiplier applied to that XP. */
  multiplier: number;
}

export interface HabitDeltaResult {
  newValue: number;
  wasComplete: boolean;
  isComplete: boolean;
  /** Positive when the target is newly met, negative when it is given back. */
  xpDelta: number;
}

/**
 * Applies a change to today's value. XP is paid on the transition into
 * completion and taken back on the transition out, so tapping up and down
 * nets to zero and an accidental tap costs nothing to correct.
 */
export function applyHabitDelta({
  currentValue,
  delta,
  target,
  xpValue,
  multiplier,
}: HabitDeltaInput): HabitDeltaResult {
  const safeTarget = Math.max(1, target);
  const newValue = Math.max(0, Math.min(currentValue + delta, safeTarget));
  const wasComplete = currentValue >= safeTarget;
  const isComplete = newValue >= safeTarget;

  let xpDelta = 0;
  if (!wasComplete && isComplete) xpDelta = Math.round(xpValue * multiplier);
  if (wasComplete && !isComplete) xpDelta = -Math.round(xpValue * multiplier);

  return { newValue, wasComplete, isComplete, xpDelta };
}

export interface DueInput {
  cadence: 'daily' | 'weekly';
  /** For weekly habits: how many times it should happen in a week. */
  weeklyTarget: number | null;
  /** Days already completed in the current week, excluding today. */
  completionsThisWeek: number;
  /** Whether today's entry already hits its target. */
  doneToday: boolean;
}

/**
 * Whether a habit still wants attention today. A weekly habit stops asking
 * once its quota is filled, which is what makes "gym 4x a week" honest rather
 * than a daily task you fail three times.
 */
export function isDueToday({
  cadence,
  weeklyTarget,
  completionsThisWeek,
  doneToday,
}: DueInput): boolean {
  if (doneToday) return false;
  if (cadence === 'daily') return true;
  const quota = Math.max(1, weeklyTarget ?? 1);
  return completionsThisWeek < quota;
}

/** Step size for one tap, so a 30-minute habit isn't 30 taps. */
export function stepFor(mode: TrackingMode, target: number): number {
  if (mode === 'binary') return 1;
  if (mode === 'duration') return target >= 60 ? 15 : 5;
  return 1;
}

export function formatHabitValue(
  mode: TrackingMode,
  value: number,
  target: number,
  unitLabel: string | null
): string {
  if (mode === 'binary') return value >= 1 ? 'Done' : 'Not yet';
  const unit = unitLabel ?? (mode === 'duration' ? 'min' : '');
  return `${value}/${target}${unit ? ` ${unit}` : ''}`;
}
