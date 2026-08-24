import type { Checkpoint } from '../types';

/** Default milestone ladder for a numeric target: quarters, plus the finish line. */
export const DEFAULT_CHECKPOINT_FRACTIONS = [0.1, 0.25, 0.5, 0.75, 1];

export interface PlannedCheckpoint {
  label: string;
  value: number;
  xpValue: number;
}

function formatAmount(value: number, unit: string | null): string {
  const n = value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));
  if (!unit) return n;
  return unit.length <= 2 ? `${unit}${n}` : `${n} ${unit}`;
}

/**
 * Builds the checkpoint ladder for a target. Later checkpoints are worth more,
 * so the last stretch to the goal pays better than the first easy tenth.
 */
export function planCheckpoints(
  targetValue: number,
  unit: string | null,
  questXp: number,
  fractions: number[] = DEFAULT_CHECKPOINT_FRACTIONS
): PlannedCheckpoint[] {
  return fractions.map((f) => ({
    label: formatAmount(targetValue * f, unit),
    value: Math.round(targetValue * f),
    // Weight XP by how far in the checkpoint sits: the 100% mark pays the most.
    xpValue: Math.round((questXp / fractions.length) * (0.5 + f)),
  }));
}

export interface ApplyDeltaInput {
  currentValue: number;
  delta: number;
  targetValue: number;
  checkpoints: Pick<Checkpoint, 'id' | 'value' | 'reached' | 'xpValue'>[];
}

export interface ApplyDeltaResult {
  newValue: number;
  /** Checkpoints newly reached by this movement. */
  crossedUp: string[];
  /** Checkpoints lost because the balance fell back below them. */
  crossedDown: string[];
  xpDelta: number;
  isSetback: boolean;
}

/**
 * Applies a contribution or withdrawal and reconciles the checkpoint ladder.
 * A setback that drops below already-banked checkpoints un-reaches them and
 * refunds their XP — progress you no longer have shouldn't still be counted.
 */
export function applyTargetDelta({
  currentValue,
  delta,
  targetValue,
  checkpoints,
}: ApplyDeltaInput): ApplyDeltaResult {
  const newValue = Math.max(0, Math.min(currentValue + delta, targetValue));

  const crossedUp: string[] = [];
  const crossedDown: string[] = [];
  let xpDelta = 0;

  for (const cp of checkpoints) {
    const shouldBeReached = newValue >= cp.value;
    if (shouldBeReached && !cp.reached) {
      crossedUp.push(cp.id);
      xpDelta += cp.xpValue;
    } else if (!shouldBeReached && cp.reached) {
      crossedDown.push(cp.id);
      xpDelta -= cp.xpValue;
    }
  }

  return { newValue, crossedUp, crossedDown, xpDelta, isSetback: delta < 0 };
}

/** The next checkpoint still ahead of the current balance, if any. */
export function nextCheckpoint<T extends { value: number; reached: boolean }>(
  checkpoints: T[]
): T | undefined {
  return [...checkpoints].sort((a, b) => a.value - b.value).find((c) => !c.reached);
}

/** How far along the bar a checkpoint sits, 0..1, for drawing its tick. */
export function checkpointPosition(value: number, targetValue: number): number {
  if (targetValue <= 0) return 0;
  return Math.min(1, Math.max(0, value / targetValue));
}
