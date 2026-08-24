import { QUEST_COMPLETION_BONUS } from '../types';

export interface QuestToggleInput {
  stepXp: number;
  questXp: number;
  /** State the step is moving *into*. */
  willBeDone: boolean;
  totalSteps: number;
  /** How many steps were done before this toggle, including this one if it was done. */
  doneCountBefore: number;
}

export interface QuestToggleResult {
  xpDelta: number;
  questJustCompleted: boolean;
  questJustUncompleted: boolean;
}

/**
 * XP for checking or unchecking a quest step. Unchecking refunds the XP so a
 * step cannot be farmed by toggling, and the all-steps-done bonus is applied
 * (or taken back) only on the transition across the finish line.
 */
export function questToggleXp({
  stepXp,
  questXp,
  willBeDone,
  totalSteps,
  doneCountBefore,
}: QuestToggleInput): QuestToggleResult {
  const doneAfter = willBeDone ? doneCountBefore + 1 : doneCountBefore - 1;
  const questJustCompleted = willBeDone && totalSteps > 0 && doneAfter === totalSteps;
  const questJustUncompleted = !willBeDone && totalSteps > 0 && doneCountBefore === totalSteps;

  let xpDelta = willBeDone ? stepXp : -stepXp;
  if (questJustCompleted) xpDelta += questXp * QUEST_COMPLETION_BONUS;
  if (questJustUncompleted) xpDelta -= questXp * QUEST_COMPLETION_BONUS;

  return { xpDelta, questJustCompleted, questJustUncompleted };
}

/** Fraction of a quest's steps that are done. */
export function questProgress(doneCount: number, totalSteps: number): number {
  if (totalSteps === 0) return 0;
  return doneCount / totalSteps;
}
