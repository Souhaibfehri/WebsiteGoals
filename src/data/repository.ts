import type {
  DayLog,
  Goal,
  GoalLog,
  Stat,
  Streak,
  UserUnlock,
  Unlockable,
  Wallet,
} from '../types';

/**
 * Storage-agnostic data access contract. Every method is async so a future
 * Supabase-backed implementation is a drop-in swap for LocalRepository with
 * no changes to call sites (store/useAppStore.ts).
 */
export interface Repository {
  getStats(): Promise<Stat[]>;
  updateStat(id: string, patch: Partial<Pick<Stat, 'currentXp' | 'level'>>): Promise<Stat>;

  getGoals(): Promise<Goal[]>;
  addGoal(goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>): Promise<Goal>;
  updateGoal(id: string, patch: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  getStreaks(): Promise<Streak[]>;
  upsertStreak(streak: Streak): Promise<Streak>;

  addGoalLog(log: Omit<GoalLog, 'id' | 'userId'>): Promise<GoalLog>;
  getGoalLogs(goalId?: string): Promise<GoalLog[]>;

  getWallet(): Promise<Wallet>;
  updateWallet(coins: number): Promise<Wallet>;

  getDayLogs(): Promise<DayLog[]>;
  addDayLog(log: Omit<DayLog, 'id' | 'userId'>): Promise<DayLog>;

  getUnlockables(): Promise<Unlockable[]>;
  getUserUnlocks(): Promise<UserUnlock[]>;
  unlock(unlockableId: string): Promise<UserUnlock>;
}
