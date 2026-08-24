import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, isUnlocked, newlyUnlocked, type AchievementSnapshot } from './achievements';
import { rankFor, nextRank } from './rank';

const empty: AchievementSnapshot = {
  totalXp: 0,
  characterLevel: 1,
  currentStreak: 0,
  bestStreak: 0,
  habitCompletions: 0,
  questStepsDone: 0,
  questsCompleted: 0,
  milestonesBanked: 0,
  totalBanked: 0,
  countriesStarted: 0,
  daysActive: 0,
};

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('unlocks nothing on a fresh account', () => {
    expect(newlyUnlocked(empty, [])).toEqual([]);
  });

  it('unlocks on reaching the threshold exactly', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'week-warrior')!;
    expect(isUnlocked(def, { ...empty, bestStreak: 6 })).toBe(false);
    expect(isUnlocked(def, { ...empty, bestStreak: 7 })).toBe(true);
  });

  it('does not re-report an achievement already held', () => {
    const s = { ...empty, habitCompletions: 3 };
    expect(newlyUnlocked(s, [])).toContain('first-step');
    expect(newlyUnlocked(s, ['first-step'])).not.toContain('first-step');
  });

  it('reports every newly satisfied badge at once', () => {
    const s = { ...empty, bestStreak: 30, habitCompletions: 40 };
    const ids = newlyUnlocked(s, []);
    expect(ids).toEqual(expect.arrayContaining(['first-step', 'week-warrior', 'month-strong']));
    expect(ids).not.toContain('century');
  });
});

describe('ranks', () => {
  it('starts at Beginner and climbs with level', () => {
    expect(rankFor(1).title).toBe('Beginner');
    expect(rankFor(6).title).toBe('Operator');
    expect(rankFor(30).title).toBe('Legend');
  });

  it('holds the top rank beyond its threshold', () => {
    expect(rankFor(999).title).toBe('Legend');
    expect(nextRank(999)).toBeNull();
  });

  it('names the rank still ahead', () => {
    expect(nextRank(1)!.title).toBe('Builder');
  });
});
