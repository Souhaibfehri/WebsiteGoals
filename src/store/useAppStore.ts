import { create } from 'zustand';
import { repository } from '../data/localRepository';
import { todayIso, daysBetween } from '../lib/date';
import { coinsForXp, levelFromXp, xpForCompletion } from '../lib/xp';
import { questToggleXp } from '../lib/quest';
import type { Goal, QuestStep, Stat, StatName, Streak, Wallet } from '../types';

export interface LevelUpEvent {
  id: string;
  statName: StatName;
  newLevel: number;
}

export interface QuestDoneEvent {
  id: string;
  title: string;
}

interface AppState {
  loading: boolean;
  stats: Stat[];
  goals: Goal[];
  questSteps: QuestStep[];
  streaks: Streak[];
  wallet: Wallet;
  levelUpQueue: LevelUpEvent[];
  questDone: QuestDoneEvent | null;

  init: () => Promise<void>;
  completeHabit: (goalId: string) => Promise<void>;
  logMilestoneValue: (goalId: string, newValue: number) => Promise<void>;
  toggleQuestStep: (stepId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>, stepTitles?: string[]) => Promise<void>;
  duplicateQuest: (goalId: string, location: string, title?: string) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addStepToQuest: (goalId: string, title: string) => Promise<void>;
  dismissLevelUp: (id: string) => void;
  dismissQuestDone: () => void;
  resetAll: () => Promise<void>;
}

async function refresh(set: (partial: Partial<AppState>) => void) {
  const [stats, goals, questSteps, streaks, wallet] = await Promise.all([
    repository.getStats(),
    repository.getGoals(),
    repository.getQuestSteps(),
    repository.getStreaks(),
    repository.getWallet(),
  ]);
  set({ stats, goals, questSteps, streaks, wallet });
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

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  stats: [],
  goals: [],
  questSteps: [],
  streaks: [],
  wallet: { userId: 'local-user', coins: 0 },
  levelUpQueue: [],
  questDone: null,

  init: async () => {
    set({ loading: true });
    await refresh(set);
    set({ loading: false });
  },

  completeHabit: async (goalId: string) => {
    const { goals, streaks, stats, wallet } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const today = todayIso();
    const existing = streaks.find((s) => s.goalId === goalId);
    if (existing?.lastCompletedDate === today) return; // already logged today, 1-tap is idempotent

    const daysSinceLast = existing?.lastCompletedDate ? daysBetween(existing.lastCompletedDate, today) : null;
    const newStreakCount = daysSinceLast === 1 ? existing!.currentStreak + 1 : 1;
    const bestStreak = Math.max(existing?.bestStreak ?? 0, newStreakCount);

    const xpAwarded = xpForCompletion(goal.xpValue, newStreakCount);

    await repository.upsertStreak({
      goalId,
      currentStreak: newStreakCount,
      bestStreak,
      lastCompletedDate: today,
    });
    await repository.addGoalLog({ goalId, completedAt: new Date().toISOString(), valueLogged: null, xpAwarded });

    const levelUp = await awardXp(goal.statId, xpAwarded, stats, wallet);

    await refresh(set);
    if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });
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

    if (levelUp) set({ levelUpQueue: [...get().levelUpQueue, levelUp] });
    if (questJustCompleted) {
      set({ questDone: { id: goal.id, title: goal.title } });
    }
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

  resetAll: async () => {
    await repository.resetToSeed();
    await refresh(set);
  },
}));
