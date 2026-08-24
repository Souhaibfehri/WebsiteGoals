import { create } from 'zustand';
import { repository } from '../data/localRepository';
import { todayIso, daysBetween } from '../lib/date';
import { coinsForXp, levelFromXp } from '../lib/xp';
import { questToggleXp } from '../lib/quest';
import { applyTargetDelta } from '../lib/target';
import { advanceStreak, streakMilestoneReached } from '../lib/streak';
import { applyHabitDelta, isDueToday } from '../lib/habit';
import { isSameIsoWeek } from '../lib/date';
import { newlyUnlocked, type AchievementSnapshot } from '../lib/achievements';
import { characterLevel } from '../lib/derived';
import type {
  Checkpoint,
  DayRecord,
  HabitEntry,
  StreakState,
  UnlockedAchievement,
  Goal,
  LedgerEntry,
  QuestStep,
  Stat,
  StatName,
  Streak,
  Profile,
  Wallet,
} from '../types';

export const STREAK_FREEZE_COST = 50;

export interface LevelUpEvent {
  id: string;
  statName: StatName;
  newLevel: number;
}

export interface QuestDoneEvent {
  id: string;
  title: string;
}

export interface StreakEvent {
  days: number;
  saved: boolean;
}

export interface AchievementEvent {
  ids: string[];
}

export interface CheckpointEvent {
  id: string;
  label: string;
  goalTitle: string;
  /** True when the balance fell back below this milestone rather than reaching it. */
  lost?: boolean;
}

interface AppState {
  loading: boolean;
  stats: Stat[];
  goals: Goal[];
  questSteps: QuestStep[];
  checkpoints: Checkpoint[];
  ledger: LedgerEntry[];
  habitEntries: HabitEntry[];
  dayRecords: DayRecord[];
  streakState: StreakState;
  achievements: UnlockedAchievement[];
  streaks: Streak[];
  profile: Profile;
  wallet: Wallet;
  levelUpQueue: LevelUpEvent[];
  questDone: QuestDoneEvent | null;
  checkpointHit: CheckpointEvent | null;
  streakHit: StreakEvent | null;
  achievementHit: AchievementEvent | null;

  init: () => Promise<void>;
  /** Delta-based so a mis-tap is undone by tapping back, never a dead end. */
  logHabit: (goalId: string, delta: number) => Promise<void>;
  logMilestoneValue: (goalId: string, newValue: number) => Promise<void>;
  recordMovement: (goalId: string, delta: number, note?: string) => Promise<void>;
  toggleQuestStep: (stepId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>, stepTitles?: string[]) => Promise<void>;
  duplicateQuest: (goalId: string, location: string, title?: string) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addStepToQuest: (goalId: string, title: string) => Promise<void>;
  dismissLevelUp: (id: string) => void;
  dismissQuestDone: () => void;
  dismissCheckpoint: () => void;
  dismissStreak: () => void;
  dismissAchievement: () => void;
  buyStreakFreeze: () => Promise<void>;
  chooseMascot: (mascot: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

async function refresh(set: (partial: Partial<AppState>) => void) {
  const [stats, goals, questSteps, checkpoints, ledger, streaks, wallet, profile, habitEntries, dayRecords, streakState, achievements] =
    await Promise.all([
      repository.getStats(),
      repository.getGoals(),
      repository.getQuestSteps(),
      repository.getCheckpoints(),
      repository.getLedger(),
      repository.getStreaks(),
      repository.getWallet(),
      repository.getProfile(),
      repository.getHabitEntries(),
      repository.getDayRecords(),
      repository.getStreakState(),
      repository.getAchievements(),
    ]);
  set({
    stats,
    goals,
    questSteps,
    checkpoints,
    ledger,
    streaks,
    wallet,
    profile,
    habitEntries,
    dayRecords,
    streakState,
    achievements,
  });
}

/** Completions of a habit inside the current week, excluding today. */
function completionsThisWeek(entries: HabitEntry[], goalId: string, today: string): number {
  return entries.filter(
    (e) => e.goalId === goalId && e.completed && e.date !== today && isSameIsoWeek(e.date, today)
  ).length;
}

/** Habits still wanting attention today, which is what the daily goal counts. */
export function dueHabits(goals: Goal[], entries: HabitEntry[], today: string): Goal[] {
  return goals
    .filter((g) => g.type === 'habit' && g.active)
    .filter((g) => {
      const entry = entries.find((e) => e.goalId === g.id && e.date === today);
      return isDueToday({
        cadence: g.cadence === 'weekly' ? 'weekly' : 'daily',
        weeklyTarget: g.weeklyTarget,
        completionsThisWeek: completionsThisWeek(entries, g.id, today),
        doneToday: entry?.completed ?? false,
      });
    });
}

/**
 * Applies an XP delta to a stat and returns a level-up event if the change
 * crossed a level boundary upward. Negative deltas (unchecking a quest step)
 * never emit an event and never take a stat below zero.
 */
async function awardXp(
  statId: string,
  xpDelta: number,
  stats: Stat[],
  wallet: Wallet
): Promise<LevelUpEvent | null> {
  const stat = stats.find((s) => s.id === statId);
  if (!stat) return null;
  const oldLevel = levelFromXp(stat.currentXp).level;
  const newXp = Math.max(0, stat.currentXp + xpDelta);
  const newLevel = levelFromXp(newXp).level;
  await repository.updateStat(stat.id, { currentXp: newXp });
  await repository.updateWallet(wallet.coins + coinsForXp(xpDelta));
  if (newLevel > oldLevel) {
    return { id: `${stat.id}-${Date.now()}`, statName: stat.name, newLevel };
  }
  return null;
}

/**
 * Recomputes today's day record, advances the daily streak when the goal is met,
 * and unlocks any achievement the new state satisfies. Called after every action
 * that earns XP, so the calendar, streak and badges can never drift from the
 * underlying logs.
 */
async function syncDay(
  get: () => AppState,
  xpJustEarned: number
): Promise<{ streakEvent: StreakEvent | null; achievementIds: string[] }> {
  const {
    goals,
    streaks,
    stats,
    questSteps,
    checkpoints,
    habitEntries,
    dayRecords,
    streakState,
    achievements,
  } = get();
  const today = todayIso();

  /*
   * Only habits actually scheduled for today count toward the day's goal, so a
   * weekly habit that has already filled its quota does not hold the day open.
   */
  const scheduled = goals.filter((g) => g.type === 'habit' && g.active).filter((g) => {
    const entry = habitEntries.find((e) => e.goalId === g.id && e.date === today);
    if (entry?.completed) return true;
    return isDueToday({
      cadence: g.cadence === 'weekly' ? 'weekly' : 'daily',
      weeklyTarget: g.weeklyTarget,
      completionsThisWeek: completionsThisWeek(habitEntries, g.id, today),
      doneToday: false,
    });
  });
  const completed = scheduled.filter(
    (h) => habitEntries.find((e) => e.goalId === h.id && e.date === today)?.completed
  ).length;
  const total = scheduled.length;
  const goalMet = total > 0 && completed >= total;

  const existingToday = dayRecords.find((d) => d.date === today);
  await repository.upsertDayRecord({
    date: today,
    completed,
    total,
    goalMet,
    xpEarned: (existingToday?.xpEarned ?? 0) + Math.max(0, xpJustEarned),
    frozen: existingToday?.frozen ?? false,
  });

  let streakEvent: StreakEvent | null = null;
  let nextStreak = streakState;

  // The streak only moves the first time a day's goal is fully met.
  if (goalMet && streakState.lastGoalDate !== today) {
    const result = advanceStreak({
      current: streakState.current,
      best: streakState.best,
      lastGoalDate: streakState.lastGoalDate,
      freezes: streakState.freezes,
      today,
    });
    nextStreak = await repository.saveStreakState({
      current: result.current,
      best: result.best,
      lastGoalDate: result.lastGoalDate,
      freezes: result.freezes,
    });

    // Mark the bridged days so the calendar shows why the run survived.
    for (const date of result.frozenDates) {
      const prior = dayRecords.find((d) => d.date === date);
      await repository.upsertDayRecord({
        date,
        completed: prior?.completed ?? 0,
        total: prior?.total ?? total,
        goalMet: false,
        xpEarned: prior?.xpEarned ?? 0,
        frozen: true,
      });
    }

    const milestone = streakMilestoneReached(streakState.current, result.current);
    if (milestone || result.saved) {
      streakEvent = { days: result.current, saved: result.saved };
    }
  }

  const snapshot: AchievementSnapshot = {
    totalXp: stats.reduce((sum, st) => sum + st.currentXp, 0),
    characterLevel: characterLevel(stats),
    currentStreak: nextStreak.current,
    bestStreak: nextStreak.best,
    habitCompletions: streaks.length,
    questStepsDone: questSteps.filter((q) => q.done).length,
    questsCompleted: goals.filter((g) => {
      if (g.type !== 'quest') return false;
      const steps = questSteps.filter((q) => q.goalId === g.id);
      return steps.length > 0 && steps.every((q) => q.done);
    }).length,
    milestonesBanked: checkpoints.filter((c) => c.reached).length,
    totalBanked: goals
      .filter((g) => g.type === 'milestone')
      .reduce((sum, g) => sum + g.currentValue, 0),
    countriesStarted: new Set(
      goals.filter((g) => g.type === 'quest' && g.location).map((g) => g.location)
    ).size,
    daysActive: dayRecords.length,
  };

  const ids = newlyUnlocked(
    snapshot,
    achievements.map((a) => a.achievementId)
  );
  for (const id of ids) await repository.unlockAchievement(id);

  return { streakEvent, achievementIds: ids };
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  stats: [],
  goals: [],
  questSteps: [],
  checkpoints: [],
  ledger: [],
  habitEntries: [],
  dayRecords: [],
  streakState: { userId: 'local-user', current: 0, best: 0, lastGoalDate: null, freezes: 0 },
  achievements: [],
  streaks: [],
  profile: { userId: 'local-user', mascot: 'lion', onboarded: false },
  wallet: { userId: 'local-user', coins: 0 },
  levelUpQueue: [],
  questDone: null,
  checkpointHit: null,
  streakHit: null,
  achievementHit: null,

  init: async () => {
    set({ loading: true });
    await refresh(set);
    set({ loading: false });
  },

  logHabit: async (goalId: string, delta: number) => {
    const { goals, habitEntries, streaks, stats, wallet } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'habit') return;

    const today = todayIso();
    const entry = habitEntries.find((e) => e.goalId === goalId && e.date === today);
    const currentValue = entry?.value ?? 0;

    const streak = streaks.find((s) => s.goalId === goalId);
    // The streak in force for today's payout, so undo refunds the same amount.
    const streakDays =
      streak?.lastCompletedDate === today
        ? streak.currentStreak
        : (streak?.currentStreak ?? 0) + 1;

    const result = applyHabitDelta({
      currentValue,
      delta,
      target: goal.dailyTarget,
      xpValue: goal.xpValue,
      multiplier: 1 + Math.min(streakDays * 0.02, 0.5),
    });

    if (result.newValue === currentValue) return;

    await repository.upsertHabitEntry({
      goalId,
      date: today,
      value: result.newValue,
      completed: result.isComplete,
    });

    // The per-habit streak follows the day's completion, in both directions.
    if (!result.wasComplete && result.isComplete) {
      const daysSince = streak?.lastCompletedDate
        ? daysBetween(streak.lastCompletedDate, today)
        : null;
      const nextCount = daysSince === 1 ? (streak?.currentStreak ?? 0) + 1 : 1;
      await repository.upsertStreak({
        goalId,
        currentStreak: nextCount,
        bestStreak: Math.max(streak?.bestStreak ?? 0, nextCount),
        lastCompletedDate: today,
      });
    } else if (result.wasComplete && !result.isComplete && streak?.lastCompletedDate === today) {
      await repository.upsertStreak({
        goalId,
        currentStreak: Math.max(0, streak.currentStreak - 1),
        bestStreak: streak.bestStreak,
        lastCompletedDate: null,
      });
    }

    let levelUp: LevelUpEvent | null = null;
    if (result.xpDelta !== 0) {
      await repository.addGoalLog({
        goalId,
        completedAt: new Date().toISOString(),
        valueLogged: result.newValue,
        xpAwarded: result.xpDelta,
      });
      levelUp = await awardXp(goal.statId, result.xpDelta, stats, wallet);
    }

    await refresh(set);
    const { streakEvent, achievementIds } = await syncDay(get, Math.max(0, result.xpDelta));
    await refresh(set);

    if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });
    if (streakEvent) set({ streakHit: streakEvent });
    if (achievementIds.length) set({ achievementHit: { ids: achievementIds } });
  },

  logMilestoneValue: async (goalId: string, newValue: number) => {
    const { goals, stats, wallet } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'milestone' || !goal.targetValue) return;

    const clamped = Math.min(Math.max(newValue, goal.currentValue), goal.targetValue);
    const gained = Math.max(0, clamped - goal.currentValue);
    const xpAwarded = Math.round((gained / goal.targetValue) * goal.xpValue);

    await repository.updateGoal(goalId, {
      currentValue: clamped,
      active: clamped < goal.targetValue,
    });
    if (xpAwarded > 0) {
      await repository.addGoalLog({ goalId, completedAt: new Date().toISOString(), valueLogged: clamped, xpAwarded });
      const levelUp = await awardXp(goal.statId, xpAwarded, stats, wallet);
      await refresh(set);
      if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });
    } else {
      await refresh(set);
    }
  },

  /**
   * The single entry point for money (or followers, or posts) moving on a target.
   * A positive delta is a contribution, a negative one a setback — spending the
   * house fund is a real event, so it is recorded, not edited away, and any
   * checkpoints it drops below are un-banked and their XP returned.
   */
  recordMovement: async (goalId: string, delta: number, note?: string) => {
    const { goals, checkpoints, stats, wallet } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !goal.targetValue || delta === 0) return;

    const ladder = checkpoints.filter((c) => c.goalId === goalId);
    const result = applyTargetDelta({
      currentValue: goal.currentValue,
      delta,
      targetValue: goal.targetValue,
      checkpoints: ladder,
    });

    const appliedDelta = result.newValue - goal.currentValue;
    if (appliedDelta === 0 && result.xpDelta === 0) return;

    await repository.updateGoal(goalId, {
      currentValue: result.newValue,
      active: result.newValue < goal.targetValue,
    });

    await repository.addLedgerEntry({
      goalId,
      delta: appliedDelta,
      note: note?.trim() || null,
      at: new Date().toISOString(),
      balanceAfter: result.newValue,
    });

    const now = new Date().toISOString();
    for (const id of result.crossedUp) {
      await repository.updateCheckpoint(id, { reached: true, reachedAt: now });
    }
    for (const id of result.crossedDown) {
      await repository.updateCheckpoint(id, { reached: false, reachedAt: null });
    }

    if (result.xpDelta !== 0) {
      await repository.addGoalLog({
        goalId,
        completedAt: now,
        valueLogged: result.newValue,
        xpAwarded: result.xpDelta,
      });
    }

    const levelUp = await awardXp(goal.statId, result.xpDelta, stats, wallet);
    await refresh(set);

    if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });

    if (result.crossedUp.length > 0) {
      const top = ladder
        .filter((c) => result.crossedUp.includes(c.id))
        .sort((a, b) => b.value - a.value)[0];
      if (top) set({ checkpointHit: { id: top.id, label: top.label, goalTitle: goal.title } });
    } else if (result.crossedDown.length > 0) {
      // Say plainly which milestone reopened, and replace any lingering
      // "banked" toast — congratulating a milestone the balance just fell
      // below is the one message that must never be on screen here.
      const lowest = ladder
        .filter((c) => result.crossedDown.includes(c.id))
        .sort((a, b) => a.value - b.value)[0];
      set({
        checkpointHit: lowest
          ? { id: lowest.id, label: lowest.label, goalTitle: goal.title, lost: true }
          : null,
      });
    }
  },

  toggleQuestStep: async (stepId: string) => {
    const { questSteps, goals, stats, wallet } = get();
    const step = questSteps.find((s) => s.id === stepId);
    if (!step) return;
    const goal = goals.find((g) => g.id === step.goalId);
    if (!goal) return;

    const nowDone = !step.done;
    await repository.updateQuestStep(stepId, {
      done: nowDone,
      doneAt: nowDone ? new Date().toISOString() : null,
    });

    const siblings = questSteps.filter((s) => s.goalId === step.goalId);
    const { xpDelta, questJustCompleted } = questToggleXp({
      stepXp: step.xpValue,
      questXp: goal.xpValue,
      willBeDone: nowDone,
      totalSteps: siblings.length,
      doneCountBefore: siblings.filter((s) => s.done).length,
    });

    if (nowDone) {
      await repository.addGoalLog({
        goalId: goal.id,
        completedAt: new Date().toISOString(),
        valueLogged: null,
        xpAwarded: xpDelta,
      });
    }

    const levelUp = await awardXp(goal.statId, xpDelta, stats, wallet);
    await refresh(set);

    const { achievementIds } = await syncDay(get, Math.max(0, xpDelta));
    await refresh(set);

    if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });
    if (questJustCompleted) {
      set({ questDone: { id: goal.id, title: goal.title } });
    }
    if (achievementIds.length) set({ achievementHit: { ids: achievementIds } });
  },

  addGoal: async (goal, stepTitles) => {
    const created = await repository.addGoal(goal);
    if (stepTitles?.length) {
      for (let i = 0; i < stepTitles.length; i++) {
        await repository.addQuestStep({
          goalId: created.id,
          title: stepTitles[i],
          done: false,
          doneAt: null,
          sortOrder: i,
          xpValue: 50,
        });
      }
    }
    await refresh(set);
  },

  /**
   * Clones a quest and its step list for another place — the core move when the
   * same playbook (a house, a market entry) runs again somewhere new.
   */
  duplicateQuest: async (goalId: string, location: string, title?: string) => {
    const { goals, questSteps } = get();
    const source = goals.find((g) => g.id === goalId);
    if (!source) return;

    const copy = await repository.addGoal({
      statId: source.statId,
      title: title?.trim() || source.title,
      type: 'quest',
      difficulty: source.difficulty,
      xpValue: source.xpValue,
      targetValue: null,
      currentValue: 0,
      cadence: null,
      active: true,
      track: source.track,
      location: location.trim() || null,
      unit: null,
      trackingMode: source.trackingMode,
      dailyTarget: source.dailyTarget,
      unitLabel: source.unitLabel,
      weeklyTarget: source.weeklyTarget,
    });

    const sourceSteps = questSteps
      .filter((s) => s.goalId === goalId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const s of sourceSteps) {
      await repository.addQuestStep({
        goalId: copy.id,
        title: s.title,
        done: false,
        doneAt: null,
        sortOrder: s.sortOrder,
        xpValue: s.xpValue,
      });
    }
    await refresh(set);
  },

  updateGoal: async (id, patch) => {
    await repository.updateGoal(id, patch);
    await refresh(set);
  },

  deleteGoal: async (id) => {
    await repository.deleteGoal(id);
    await refresh(set);
  },

  addStepToQuest: async (goalId: string, title: string) => {
    const { questSteps } = get();
    const siblings = questSteps.filter((s) => s.goalId === goalId);
    await repository.addQuestStep({
      goalId,
      title,
      done: false,
      doneAt: null,
      sortOrder: siblings.length,
      xpValue: 50,
    });
    await refresh(set);
  },

  dismissLevelUp: (id: string) => {
    set({ levelUpQueue: get().levelUpQueue.filter((e) => e.id !== id) });
  },

  dismissQuestDone: () => set({ questDone: null }),

  dismissCheckpoint: () => set({ checkpointHit: null }),

  chooseMascot: async (mascot: string) => {
    await repository.saveProfile({ mascot, onboarded: true });
    await refresh(set);
  },

  dismissStreak: () => set({ streakHit: null }),

  dismissAchievement: () => set({ achievementHit: null }),

  buyStreakFreeze: async () => {
    const { wallet, streakState } = get();
    if (wallet.coins < STREAK_FREEZE_COST) return;
    await repository.updateWallet(wallet.coins - STREAK_FREEZE_COST);
    await repository.saveStreakState({ freezes: streakState.freezes + 1 });
    await refresh(set);
  },

  resetAll: async () => {
    await repository.resetToSeed();
    await refresh(set);
  },
}));
