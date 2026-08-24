import { describe, expect, it } from 'vitest';
import { questProgress, questToggleXp } from './quest';

const base = { stepXp: 50, questXp: 300, totalSteps: 5 };

describe('questToggleXp', () => {
  it('awards the step XP for checking a mid-quest step', () => {
    const r = questToggleXp({ ...base, willBeDone: true, doneCountBefore: 1 });
    expect(r.xpDelta).toBe(50);
    expect(r.questJustCompleted).toBe(false);
  });

  it('refunds the step XP when unchecking, so toggling cannot farm XP', () => {
    const check = questToggleXp({ ...base, willBeDone: true, doneCountBefore: 1 });
    const uncheck = questToggleXp({ ...base, willBeDone: false, doneCountBefore: 2 });
    expect(check.xpDelta + uncheck.xpDelta).toBe(0);
  });

  it('pays the completion bonus on the final step only', () => {
    const secondToLast = questToggleXp({ ...base, willBeDone: true, doneCountBefore: 3 });
    const last = questToggleXp({ ...base, willBeDone: true, doneCountBefore: 4 });
    expect(secondToLast.xpDelta).toBe(50);
    expect(secondToLast.questJustCompleted).toBe(false);
    expect(last.xpDelta).toBe(50 + 300);
    expect(last.questJustCompleted).toBe(true);
  });

  it('takes the bonus back when un-completing a finished quest', () => {
    const r = questToggleXp({ ...base, willBeDone: false, doneCountBefore: 5 });
    expect(r.xpDelta).toBe(-50 - 300);
    expect(r.questJustUncompleted).toBe(true);
  });

  it('completing then un-completing the last step nets to zero', () => {
    const done = questToggleXp({ ...base, willBeDone: true, doneCountBefore: 4 });
    const undone = questToggleXp({ ...base, willBeDone: false, doneCountBefore: 5 });
    expect(done.xpDelta + undone.xpDelta).toBe(0);
  });

  it('never reports completion for a quest with no steps', () => {
    const r = questToggleXp({ ...base, totalSteps: 0, willBeDone: true, doneCountBefore: 0 });
    expect(r.questJustCompleted).toBe(false);
  });
});

describe('questProgress', () => {
  it('is zero for an empty quest rather than NaN', () => {
    expect(questProgress(0, 0)).toBe(0);
  });

  it('reports the done fraction', () => {
    expect(questProgress(3, 12)).toBe(0.25);
    expect(questProgress(15, 15)).toBe(1);
  });
});
