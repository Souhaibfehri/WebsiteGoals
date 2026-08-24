import { describe, expect, it } from 'vitest';
import { applyHabitDelta, isDueToday, stepFor, formatHabitValue } from './habit';

const base = { target: 1, xpValue: 20, multiplier: 1 };

describe('applyHabitDelta — binary', () => {
  it('pays XP once when the target is met', () => {
    const r = applyHabitDelta({ ...base, currentValue: 0, delta: 1 });
    expect(r.newValue).toBe(1);
    expect(r.isComplete).toBe(true);
    expect(r.xpDelta).toBe(20);
  });

  it('refunds the XP when undone, so a mis-tap costs nothing', () => {
    const on = applyHabitDelta({ ...base, currentValue: 0, delta: 1 });
    const off = applyHabitDelta({ ...base, currentValue: on.newValue, delta: -1 });
    expect(off.newValue).toBe(0);
    expect(off.isComplete).toBe(false);
    expect(on.xpDelta + off.xpDelta).toBe(0);
  });

  it('never pays twice for the same day', () => {
    const again = applyHabitDelta({ ...base, currentValue: 1, delta: 1 });
    expect(again.xpDelta).toBe(0);
    expect(again.newValue).toBe(1);
  });
});

describe('applyHabitDelta — counted', () => {
  const counted = { target: 8, xpValue: 30, multiplier: 1 };

  it('pays nothing for partial progress', () => {
    const r = applyHabitDelta({ ...counted, currentValue: 3, delta: 1 });
    expect(r.newValue).toBe(4);
    expect(r.isComplete).toBe(false);
    expect(r.xpDelta).toBe(0);
  });

  it('pays on the tap that completes the target', () => {
    const r = applyHabitDelta({ ...counted, currentValue: 7, delta: 1 });
    expect(r.isComplete).toBe(true);
    expect(r.xpDelta).toBe(30);
  });

  it('takes the XP back when dropping below the target again', () => {
    const r = applyHabitDelta({ ...counted, currentValue: 8, delta: -1 });
    expect(r.newValue).toBe(7);
    expect(r.xpDelta).toBe(-30);
  });

  it('clamps to the target and to zero', () => {
    expect(applyHabitDelta({ ...counted, currentValue: 8, delta: 5 }).newValue).toBe(8);
    expect(applyHabitDelta({ ...counted, currentValue: 0, delta: -5 }).newValue).toBe(0);
  });

  it('applies the streak multiplier to the payout', () => {
    const r = applyHabitDelta({ ...counted, currentValue: 7, delta: 1, multiplier: 1.5 });
    expect(r.xpDelta).toBe(45);
  });
});

describe('isDueToday', () => {
  it('asks every day for a daily habit until it is done', () => {
    expect(isDueToday({ cadence: 'daily', weeklyTarget: null, completionsThisWeek: 3, doneToday: false })).toBe(true);
    expect(isDueToday({ cadence: 'daily', weeklyTarget: null, completionsThisWeek: 3, doneToday: true })).toBe(false);
  });

  it('stops asking once a weekly quota is filled', () => {
    expect(isDueToday({ cadence: 'weekly', weeklyTarget: 4, completionsThisWeek: 3, doneToday: false })).toBe(true);
    expect(isDueToday({ cadence: 'weekly', weeklyTarget: 4, completionsThisWeek: 4, doneToday: false })).toBe(false);
  });

  it('treats a missing weekly target as once a week', () => {
    expect(isDueToday({ cadence: 'weekly', weeklyTarget: null, completionsThisWeek: 1, doneToday: false })).toBe(false);
  });
});

describe('stepFor', () => {
  it('steps a long duration in useful chunks rather than one at a time', () => {
    expect(stepFor('duration', 60)).toBe(15);
    expect(stepFor('duration', 20)).toBe(5);
    expect(stepFor('count', 8)).toBe(1);
    expect(stepFor('binary', 1)).toBe(1);
  });
});

describe('formatHabitValue', () => {
  it('reads plainly for each mode', () => {
    expect(formatHabitValue('binary', 1, 1, null)).toBe('Done');
    expect(formatHabitValue('binary', 0, 1, null)).toBe('Not yet');
    expect(formatHabitValue('count', 3, 8, 'glasses')).toBe('3/8 glasses');
    expect(formatHabitValue('duration', 20, 30, null)).toBe('20/30 min');
  });
});
