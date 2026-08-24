import { create } from 'zustand';
import { repository } from '../data/localRepository';
import { todayIso, daysBetween } from '../lib/date';
import { coinsForXp, levelFromXp, xpForCompletion } from '../lib/xp';
import type { Goal, Stat, StatName, Streak, Wallet } from '../types';

export interface LevelUpEvent {
  id: string;
  statName: StatName;
  newLevel: number;
}

interface AppState {
  loading: boolean;
  stats: Stat[];
  goals: Goal[];
  streaks: Streak[];
  wallet: Wallet;
  levelUpQueue: LevelUpEvent[];

  init: () => Promise<void>;
  completeHabit: (goalId: string) => Promise<void>;
  logMilestoneValue: (goalId: string, newValue: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  dismissLevelUp: (id: string) => void;
}

async function refresh(set: (partial: Partial<AppState>) => void) {
  const [stats, goals, streaks, wallet] = await Promise.all([
    repository.getStats(),
    repository.getGoals(),
    repository.getStreaks(),
    repository.getWallet(),
  ]);
  set({ stats, goals, streaks, wallet });
}

/** Awards XP/coins to a stat and returns a level-up event if one occurred. */
async function awardXp(statId: string, xpAwarded: number, stats: Stat[], wallet: Wallet): Promise<LevelUpEvent | null> {
  const stat = stats.find((s) => s.id === statId);
  if (!stat) return null;
  const oldLevel = levelFromXp(stat.currentXp).level;
  const newXp = stat.currentXp + xpAwarded;
  const newLevel = levelFromXp(newXp).level;
  await repository.updateStat(stat.id, { currentXp: newXp });
  await repository.updateWallet(wallet.coins + coinsForXp(xpAwarded));
  if (newLevel > oldLevel) {
    return { id: `${stat.id}-${Date.now()}`, statName: stat.name, newLevel };
  }
  return null;
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  stats: [],
  goals: [],
  streaks: [],
  wallet: { userId: 'local-user', coins: 0 },
  levelUpQueue: [],

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

  addGoal: async (goal) => {
    await repository.addGoal(goal);
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

  dismissLevelUp: (id: string) => {
    set({ levelUpQueue: get().levelUpQueue.filter((e) => e.id !== id) });
  },
}));
