import { describe, expect, it } from 'vitest';
import { advanceStreak, streakIsAlive, streakMilestoneReached } from './streak';

const base = { current: 5, best: 9, freezes: 0 };

describe('advanceStreak', () => {
  it('starts a run at one on the first ever goal', () => {
    const r = advanceStreak({ ...base, current: 0, best: 0, lastGoalDate: null, today: '2026-03-10' });
    expect(r.current).toBe(1);
    expect(r.best).toBe(1);
  });

  it('is a no-op when the same day is completed twice', () => {
    const r = advanceStreak({ ...base, lastGoalDate: '2026-03-10', today: '2026-03-10' });
    expect(r.current).toBe(5);
    expect(r.freezes).toBe(0);
  });

  it('increments on a consecutive day and raises the best', () => {
    const r = advanceStreak({ ...base, current: 9, lastGoalDate: '2026-03-10', today: '2026-03-11' });
    expect(r.current).toBe(10);
    expect(r.best).toBe(10);
    expect(r.broke).toBe(false);
  });

  it('resets to one after a missed day with no freeze', () => {
    const r = advanceStreak({ ...base, lastGoalDate: '2026-03-10', today: '2026-03-12' });
    expect(r.current).toBe(1);
    expect(r.broke).toBe(true);
    expect(r.best).toBe(9);
  });

  it('spends a freeze to bridge one missed day', () => {
    const r = advanceStreak({
      ...base,
      freezes: 1,
      lastGoalDate: '2026-03-10',
      today: '2026-03-12',
    });
    expect(r.current).toBe(6);
    expect(r.saved).toBe(true);
    expect(r.freezes).toBe(0);
    expect(r.frozenDates).toEqual(['2026-03-11']);
  });

  it('spends one freeze per missed day', () => {
    const r = advanceStreak({
      ...base,
      freezes: 2,
      lastGoalDate: '2026-03-10',
      today: '2026-03-13',
    });
    expect(r.frozenDates).toEqual(['2026-03-11', '2026-03-12']);
    expect(r.freezes).toBe(0);
    expect(r.current).toBe(6);
  });

  it('breaks when the gap outruns the freezes held', () => {
    const r = advanceStreak({
      ...base,
      freezes: 1,
      lastGoalDate: '2026-03-10',
      today: '2026-03-14',
    });
    expect(r.broke).toBe(true);
    expect(r.current).toBe(1);
    // A freeze that could not save the run is not consumed.
    expect(r.freezes).toBe(1);
  });
});

describe('streakIsAlive', () => {
  it('is alive today and yesterday, dead beyond that without freezes', () => {
    expect(streakIsAlive('2026-03-10', '2026-03-10', 0)).toBe(true);
    expect(streakIsAlive('2026-03-10', '2026-03-11', 0)).toBe(true);
    expect(streakIsAlive('2026-03-10', '2026-03-12', 0)).toBe(false);
  });

  it('extends its life by the freezes held', () => {
    expect(streakIsAlive('2026-03-10', '2026-03-12', 1)).toBe(true);
  });

  it('is dead when no goal was ever met', () => {
    expect(streakIsAlive(null, '2026-03-10', 5)).toBe(false);
  });
});

describe('streakMilestoneReached', () => {
  it('fires only on the crossing', () => {
    expect(streakMilestoneReached(6, 7)).toBe(7);
    expect(streakMilestoneReached(7, 8)).toBeNull();
  });

  it('returns the first milestone crossed by a jump', () => {
    expect(streakMilestoneReached(1, 30)).toBe(3);
  });
});
