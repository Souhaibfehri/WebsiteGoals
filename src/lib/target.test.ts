import { describe, expect, it } from 'vitest';
import { applyTargetDelta, nextCheckpoint, planCheckpoints } from './target';

const ladder = (reachedUpTo = 0) =>
  [
    { id: 'a', value: 10000, xpValue: 100, reached: reachedUpTo >= 10000 },
    { id: 'b', value: 25000, xpValue: 150, reached: reachedUpTo >= 25000 },
    { id: 'c', value: 50000, xpValue: 200, reached: reachedUpTo >= 50000 },
    { id: 'd', value: 75000, xpValue: 250, reached: reachedUpTo >= 75000 },
    { id: 'e', value: 100000, xpValue: 300, reached: reachedUpTo >= 100000 },
  ];

describe('planCheckpoints', () => {
  it('lays a ladder up to the target with the finish line last', () => {
    const cps = planCheckpoints(100000, '€', 1000);
    expect(cps.map((c) => c.value)).toEqual([10000, 25000, 50000, 75000, 100000]);
    expect(cps.at(-1)!.label).toBe('€100k');
  });

  it('pays more for later checkpoints than earlier ones', () => {
    const cps = planCheckpoints(100000, '€', 1000);
    expect(cps.at(-1)!.xpValue).toBeGreaterThan(cps[0].xpValue);
  });
});

describe('applyTargetDelta — contributions', () => {
  it('banks every checkpoint a single big contribution passes', () => {
    const r = applyTargetDelta({
      currentValue: 0,
      delta: 30000,
      targetValue: 100000,
      checkpoints: ladder(0),
    });
    expect(r.newValue).toBe(30000);
    expect(r.crossedUp).toEqual(['a', 'b']);
    expect(r.xpDelta).toBe(250);
    expect(r.isSetback).toBe(false);
  });

  it('never exceeds the target', () => {
    const r = applyTargetDelta({
      currentValue: 90000,
      delta: 50000,
      targetValue: 100000,
      checkpoints: ladder(75000),
    });
    expect(r.newValue).toBe(100000);
  });
});

describe('applyTargetDelta — setbacks', () => {
  it('takes back the XP for checkpoints the balance falls below', () => {
    const r = applyTargetDelta({
      currentValue: 30000,
      delta: -25000,
      targetValue: 100000,
      checkpoints: ladder(25000),
    });
    expect(r.newValue).toBe(5000);
    expect(r.crossedDown).toEqual(['a', 'b']);
    expect(r.xpDelta).toBe(-250);
    expect(r.isSetback).toBe(true);
  });

  it('keeps checkpoints that the withdrawal did not undercut', () => {
    const r = applyTargetDelta({
      currentValue: 60000,
      delta: -5000,
      targetValue: 100000,
      checkpoints: ladder(50000),
    });
    expect(r.newValue).toBe(55000);
    expect(r.crossedDown).toEqual([]);
    expect(r.xpDelta).toBe(0);
  });

  it('contributing then withdrawing the same amount nets to zero XP', () => {
    const up = applyTargetDelta({
      currentValue: 0,
      delta: 30000,
      targetValue: 100000,
      checkpoints: ladder(0),
    });
    const down = applyTargetDelta({
      currentValue: up.newValue,
      delta: -30000,
      targetValue: 100000,
      checkpoints: ladder(25000),
    });
    expect(up.xpDelta + down.xpDelta).toBe(0);
    expect(down.newValue).toBe(0);
  });

  it('cannot drive the balance below zero', () => {
    const r = applyTargetDelta({
      currentValue: 1000,
      delta: -9999,
      targetValue: 100000,
      checkpoints: ladder(0),
    });
    expect(r.newValue).toBe(0);
  });
});

describe('nextCheckpoint', () => {
  it('returns the lowest unreached checkpoint', () => {
    expect(nextCheckpoint(ladder(25000))!.id).toBe('c');
  });

  it('returns undefined once everything is banked', () => {
    expect(nextCheckpoint(ladder(100000))).toBeUndefined();
  });
});
