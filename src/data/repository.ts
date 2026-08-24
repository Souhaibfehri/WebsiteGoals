import type {
  Checkpoint,
  DayLog,
  DayRecord,
  StreakState,
  UnlockedAchievement,
  Goal,
  GoalLog,
  LedgerEntry,
  QuestStep,
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

  getQuestSteps(): Promise<QuestStep[]>;
  addQuestStep(step: Omit<QuestStep, 'id' | 'userId'>): Promise<QuestStep>;
  updateQuestStep(id: string, patch: Partial<QuestStep>): Promise<QuestStep>;
  deleteQuestStepsForGoal(goalId: string): Promise<void>;

  getCheckpoints(): Promise<Checkpoint[]>;
  addCheckpoint(cp: Omit<Checkpoint, 'id' | 'userId'>): Promise<Checkpoint>;
  updateCheckpoint(id: string, patch: Partial<Checkpoint>): Promise<Checkpoint>;

  getLedger(): Promise<LedgerEntry[]>;
  addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'userId'>): Promise<LedgerEntry>;

  getDayRecords(): Promise<DayRecord[]>;
  upsertDayRecord(record: Omit<DayRecord, 'id' | 'userId'>): Promise<DayRecord>;

  getStreakState(): Promise<StreakState>;
  saveStreakState(patch: Partial<Omit<StreakState, 'userId'>>): Promise<StreakState>;

  getAchievements(): Promise<UnlockedAchievement[]>;
  unlockAchievement(id: string): Promise<UnlockedAchievement>;

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

  resetToSeed(): Promise<void>;
}
