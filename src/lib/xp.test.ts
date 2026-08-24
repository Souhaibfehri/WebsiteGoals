import { describe, expect, it } from 'vitest';
import { coinsForXp, computeDecayedXp, levelFromXp, streakMultiplier, xpForCompletion, xpForLevel } from './xp';

describe('xpForLevel', () => {
  it('matches spec worked examples (Section 2.2)', () => {
    expect(xpForLevel(1)).toBe(50); // Level 1->2: 50 XP
    expect(xpForLevel(5)).toBeCloseTo(559, -1); // ~560 XP
    expect(xpForLevel(20)).toBeCloseTo(4472, -1); // ~4,470 XP
  });
});

describe('levelFromXp', () => {
  it('stays at level 1 below the first threshold', () => {
    const p = levelFromXp(20);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(20);
    expect(p.xpForNextLevel).toBe(50);
  });

  it('rolls over into level 2 exactly at the threshold', () => {
    const p = levelFromXp(50);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(0);
  });

  it('accumulates across multiple level boundaries', () => {
    const cumulativeToLevel3 = xpForLevel(1) + xpForLevel(2);
    const p = levelFromXp(cumulativeToLevel3 + 10);
    expect(p.level).toBe(3);
    expect(p.xpIntoLevel).toBe(10);
  });
});

describe('streakMultiplier', () => {
  it('is 1x with no streak', () => {
    expect(streakMultiplier(0)).toBe(1);
  });

  it('caps at +50% around day 25', () => {
    expect(streakMultiplier(25)).toBe(1.5);
    expect(streakMultiplier(100)).toBe(1.5);
  });

  it('scales linearly below the cap', () => {
    expect(streakMultiplier(10)).toBeCloseTo(1.2);
  });
});

describe('xpForCompletion', () => {
  it('applies the streak multiplier to base XP', () => {
    expect(xpForCompletion(25, 0)).toBe(25);
    expect(xpForCompletion(25, 25)).toBe(Math.round(25 * 1.5));
  });
});

describe('coinsForXp', () => {
  it('awards ~1 coin per 10 XP (spec 2.4)', () => {
    expect(coinsForXp(100)).toBe(10);
    expect(coinsForXp(105)).toBe(10);
    expect(coinsForXp(9)).toBe(0);
  });
});

describe('computeDecayedXp', () => {
  it('does not decay within the 7-day grace window (spec 2.3b)', () => {
    expect(computeDecayedXp(1000, 0)).toBe(1000);
    expect(computeDecayedXp(1000, 7)).toBe(1000);
  });

  it('loses 1% per day past the grace window', () => {
    expect(computeDecayedXp(1000, 10)).toBe(970); // 3 days past grace = 3%
  });

  it('caps total loss at 15%', () => {
    expect(computeDecayedXp(1000, 30)).toBe(850);
    expect(computeDecayedXp(1000, 365)).toBe(850);
  });
});
