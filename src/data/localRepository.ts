import { makeId } from '../lib/id';
import { levelFromXp } from '../lib/xp';
import { planCheckpoints } from '../lib/target';
import type {
  Checkpoint,
  DayLog,
  DayRecord,
  HabitEntry,
  StreakState,
  UnlockedAchievement,
  Goal,
  GoalLog,
  LedgerEntry,
  QuestStep,
  Stat,
  StatName,
  Streak,
  UserUnlock,
  Unlockable,
  Profile,
  Wallet,
} from '../types';
import { STAT_ICON, STAT_ORDER } from '../types';
import { QUEST_TEMPLATES } from './templates';
import type { Repository } from './repository';
import { LOCAL_USER_ID } from './localUser';
import { readItem, writeItem } from './safeStorage';

const STORAGE_KEY = 'lifeos.db.v7';

interface Db {
  stats: Stat[];
  goals: Goal[];
  questSteps: QuestStep[];
  checkpoints: Checkpoint[];
  ledger: LedgerEntry[];
  goalLogs: GoalLog[];
  habitEntries: HabitEntry[];
  dayRecords: DayRecord[];
  streakState: StreakState;
  achievements: UnlockedAchievement[];
  streaks: Streak[];
  profile: Profile;
  wallet: Wallet;
  dayLogs: DayLog[];
  unlockables: Unlockable[];
  userUnlocks: UserUnlock[];
}

function seedStats(): Stat[] {
  return STAT_ORDER.map((name: StatName, i) => ({
    id: makeId(),
    userId: LOCAL_USER_ID,
    name,
    currentXp: 0,
    level: 1,
    icon: STAT_ICON[name],
    sortOrder: i,
  }));
}

interface SeedResult {
  goals: Goal[];
  questSteps: QuestStep[];
  checkpoints: Checkpoint[];
}

function seedGoalsAndSteps(stats: Stat[]): SeedResult {
  const statId = (n: StatName) => stats.find((s) => s.name === n)!.id;
  const now = new Date().toISOString();
  const goals: Goal[] = [];
  const questSteps: QuestStep[] = [];
  const checkpoints: Checkpoint[] = [];

  type SeedGoal = Omit<
    Goal,
    | 'id'
    | 'userId'
    | 'createdAt'
    | 'active'
    | 'track'
    | 'location'
    | 'unit'
    | 'trackingMode'
    | 'dailyTarget'
    | 'unitLabel'
    | 'weeklyTarget'
  > &
    Partial<
      Pick<Goal, 'track' | 'location' | 'unit' | 'trackingMode' | 'dailyTarget' | 'unitLabel' | 'weeklyTarget'>
    >;

  const make = (partial: SeedGoal): Goal => {
    const goal: Goal = {
      id: makeId(),
      userId: LOCAL_USER_ID,
      active: true,
      createdAt: now,
      track: null,
      location: null,
      unit: null,
      trackingMode: 'binary',
      dailyTarget: 1,
      unitLabel: null,
      weeklyTarget: null,
      ...partial,
    };
    goals.push(goal);
    return goal;
  };

  // --- Daily habits, one per domain that benefits from a daily rep ---
  const habit = (
    title: string,
    stat: StatName,
    xp: number,
    difficulty: Goal['difficulty'],
    opts: Partial<Pick<Goal, 'trackingMode' | 'dailyTarget' | 'unitLabel' | 'cadence' | 'weeklyTarget'>> = {}
  ) =>
    make({
      title,
      statId: statId(stat),
      type: 'habit',
      difficulty,
      xpValue: xp,
      targetValue: null,
      currentValue: 0,
      cadence: opts.cadence ?? 'daily',
      trackingMode: opts.trackingMode ?? 'binary',
      dailyTarget: opts.dailyTarget ?? 1,
      unitLabel: opts.unitLabel ?? null,
      weeklyTarget: opts.weeklyTarget ?? null,
    });

  // A mix of shapes on purpose: not everything worth tracking is a daily yes/no.
  habit('Train — gym or run', 'Body', 25, 'medium', { cadence: 'weekly', weeklyTarget: 4 });
  habit('Brush teeth', 'Body', 5, 'trivial', { trackingMode: 'count', dailyTarget: 2, unitLabel: 'times' });
  habit('Drink water', 'Body', 10, 'easy', { trackingMode: 'count', dailyTarget: 8, unitLabel: 'glasses' });
  habit('7+ hours sleep', 'Body', 10, 'easy');
  habit('Deep work, no phone', 'Work', 25, 'medium', { trackingMode: 'duration', dailyTarget: 90 });
  habit('Publish or film content', 'Content', 25, 'medium', { cadence: 'weekly', weeklyTarget: 3 });
  habit('Reach out to a new contact', 'Reputation', 10, 'easy');
  habit('Read or study', 'Mind', 10, 'easy', { trackingMode: 'duration', dailyTarget: 30 });
  habit('Review the numbers', 'Wealth', 10, 'easy');

  /** A numeric target always ships with its milestone ladder already laid out. */
  const target = (
    partial: Parameters<typeof make>[0] & { targetValue: number }
  ): Goal => {
    const goal = make(partial);
    for (const cp of planCheckpoints(partial.targetValue, goal.unit, goal.xpValue)) {
      checkpoints.push({
        id: makeId(),
        goalId: goal.id,
        userId: LOCAL_USER_ID,
        label: cp.label,
        value: cp.value,
        reached: false,
        reachedAt: null,
        xpValue: cp.xpValue,
      });
    }
    return goal;
  };

  // --- Targets: the big numbers, each with milestones built in ---
  target({
    title: 'Bank €100,000 in reserves',
    statId: statId('Wealth'),
    type: 'milestone',
    difficulty: 'milestone',
    xpValue: 1000,
    targetValue: 100000,
    currentValue: 0,
    cadence: 'weekly',
    unit: '€',
  });
  target({
    title: 'Reach €20,000 monthly revenue',
    statId: statId('Empire'),
    type: 'milestone',
    difficulty: 'milestone',
    xpValue: 1000,
    targetValue: 20000,
    currentValue: 0,
    cadence: 'weekly',
    unit: '€',
  });
  target({
    title: 'Grow to 50,000 followers',
    statId: statId('Reputation'),
    type: 'milestone',
    difficulty: 'milestone',
    xpValue: 800,
    targetValue: 50000,
    currentValue: 0,
    cadence: 'weekly',
  });
  target({
    title: 'Publish 100 pieces of content',
    statId: statId('Content'),
    type: 'milestone',
    difficulty: 'milestone',
    xpValue: 800,
    targetValue: 100,
    currentValue: 0,
    cadence: 'weekly',
  });

  // --- Quests: multi-step campaigns, seeded from the reusable templates ---
  for (const tpl of QUEST_TEMPLATES) {
    const quest = make({
      title: tpl.title,
      statId: statId(tpl.stat as StatName),
      type: 'quest',
      difficulty: 'hard',
      xpValue: 300,
      targetValue: null,
      currentValue: 0,
      cadence: null,
      track: tpl.track,
      location: null,
    });
    tpl.steps.forEach((title, i) => {
      questSteps.push({
        id: makeId(),
        goalId: quest.id,
        userId: LOCAL_USER_ID,
        title,
        done: false,
        doneAt: null,
        sortOrder: i,
        xpValue: 50,
      });
    });
  }

  return { goals, questSteps, checkpoints };
}

function seedUnlockables(): Unlockable[] {
  return [
    { id: makeId(), name: 'Streak Freeze', description: 'Skip a day without breaking your streak.', cost: 50, type: 'functional' },
    { id: makeId(), name: 'Sunset Theme', description: 'A warm alternate accent palette.', cost: 100, type: 'cosmetic' },
    { id: makeId(), name: 'Extra Goal Slot', description: 'Unlock an additional active goal category.', cost: 150, type: 'functional' },
  ];
}

function seedDb(): Db {
  const stats = seedStats();
  const { goals, questSteps, checkpoints } = seedGoalsAndSteps(stats);
  return {
    stats,
    goals,
    questSteps,
    checkpoints,
    ledger: [],
    goalLogs: [],
    habitEntries: [],
    dayRecords: [],
    streakState: { userId: LOCAL_USER_ID, current: 0, best: 0, lastGoalDate: null, freezes: 0 },
    achievements: [],
    streaks: [],
    profile: { userId: LOCAL_USER_ID, mascot: 'lion', onboarded: false },
    wallet: { userId: LOCAL_USER_ID, coins: 0 },
    dayLogs: [],
    unlockables: seedUnlockables(),
    userUnlocks: [],
  };
}

function load(): Db {
  const raw = readItem(STORAGE_KEY);
  if (!raw) {
    const db = seedDb();
    save(db);
    return db;
  }
  try {
    const parsed = JSON.parse(raw) as Db;
    // Guard against a half-written or older payload leaving the app empty.
    if (!parsed.stats?.length || !parsed.goals) throw new Error('incomplete');
    parsed.questSteps ??= [];
    parsed.checkpoints ??= [];
    parsed.ledger ??= [];
    parsed.habitEntries ??= [];
    parsed.profile ??= { userId: LOCAL_USER_ID, mascot: 'lion', onboarded: false };
    parsed.dayRecords ??= [];
    parsed.achievements ??= [];
    parsed.streakState ??= {
      userId: LOCAL_USER_ID,
      current: 0,
      best: 0,
      lastGoalDate: null,
      freezes: 0,
    };
    return parsed;
  } catch {
    const db = seedDb();
    save(db);
    return db;
  }
}

function save(db: Db): void {
  writeItem(STORAGE_KEY, JSON.stringify(db));
}

/** Small artificial async boundary so call sites are already Promise-shaped for a future async backend. */
function tick<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

/**
 * Singletons must leave the repository as fresh objects. Handing out the live
 * internal reference means a mutation-then-read returns the identical object,
 * the store sets state to the same reference, and React correctly concludes
 * nothing changed — so the screen silently fails to update.
 */
function snapshot<T>(value: T): Promise<T> {
  return Promise.resolve({ ...value });
}

export class LocalRepository implements Repository {
  private db: Db = load();

  private persist() {
    save(this.db);
  }

  async getStats(): Promise<Stat[]> {
    return tick([...this.db.stats].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async updateStat(id: string, patch: Partial<Pick<Stat, 'currentXp' | 'level'>>): Promise<Stat> {
    const stat = this.db.stats.find((s) => s.id === id);
    if (!stat) throw new Error(`Stat ${id} not found`);
    Object.assign(stat, patch);
    if (patch.currentXp !== undefined) {
      stat.currentXp = Math.max(0, stat.currentXp);
      stat.level = levelFromXp(stat.currentXp).level;
    }
    this.persist();
    return tick(stat);
  }

  async getGoals(): Promise<Goal[]> {
    return tick([...this.db.goals]);
  }

  async addGoal(goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: makeId(),
      userId: LOCAL_USER_ID,
      createdAt: new Date().toISOString(),
    };
    this.db.goals.push(newGoal);
    this.persist();
    return tick(newGoal);
  }

  async updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
    const goal = this.db.goals.find((g) => g.id === id);
    if (!goal) throw new Error(`Goal ${id} not found`);
    Object.assign(goal, patch);
    this.persist();
    return tick(goal);
  }

  async deleteGoal(id: string): Promise<void> {
    this.db.goals = this.db.goals.filter((g) => g.id !== id);
    this.db.questSteps = this.db.questSteps.filter((s) => s.goalId !== id);
    this.db.checkpoints = this.db.checkpoints.filter((c) => c.goalId !== id);
    this.db.ledger = this.db.ledger.filter((l) => l.goalId !== id);
    this.db.habitEntries = this.db.habitEntries.filter((e) => e.goalId !== id);
    this.persist();
    return tick(undefined);
  }

  async getQuestSteps(): Promise<QuestStep[]> {
    return tick([...this.db.questSteps].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async addQuestStep(step: Omit<QuestStep, 'id' | 'userId'>): Promise<QuestStep> {
    const newStep: QuestStep = { ...step, id: makeId(), userId: LOCAL_USER_ID };
    this.db.questSteps.push(newStep);
    this.persist();
    return tick(newStep);
  }

  async updateQuestStep(id: string, patch: Partial<QuestStep>): Promise<QuestStep> {
    const step = this.db.questSteps.find((s) => s.id === id);
    if (!step) throw new Error(`Step ${id} not found`);
    Object.assign(step, patch);
    this.persist();
    return tick(step);
  }

  async deleteQuestStepsForGoal(goalId: string): Promise<void> {
    this.db.questSteps = this.db.questSteps.filter((s) => s.goalId !== goalId);
    this.persist();
    return tick(undefined);
  }

  async getCheckpoints(): Promise<Checkpoint[]> {
    return tick([...this.db.checkpoints].sort((a, b) => a.value - b.value));
  }

  async addCheckpoint(cp: Omit<Checkpoint, 'id' | 'userId'>): Promise<Checkpoint> {
    const newCp: Checkpoint = { ...cp, id: makeId(), userId: LOCAL_USER_ID };
    this.db.checkpoints.push(newCp);
    this.persist();
    return tick(newCp);
  }

  async updateCheckpoint(id: string, patch: Partial<Checkpoint>): Promise<Checkpoint> {
    const cp = this.db.checkpoints.find((c) => c.id === id);
    if (!cp) throw new Error(`Checkpoint ${id} not found`);
    Object.assign(cp, patch);
    this.persist();
    return tick(cp);
  }

  async getLedger(): Promise<LedgerEntry[]> {
    return tick([...this.db.ledger].sort((a, b) => a.at.localeCompare(b.at)));
  }

  async addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'userId'>): Promise<LedgerEntry> {
    const newEntry: LedgerEntry = { ...entry, id: makeId(), userId: LOCAL_USER_ID };
    this.db.ledger.push(newEntry);
    this.persist();
    return tick(newEntry);
  }

  async getHabitEntries(): Promise<HabitEntry[]> {
    return tick([...this.db.habitEntries]);
  }

  async upsertHabitEntry(entry: Omit<HabitEntry, 'id' | 'userId'>): Promise<HabitEntry> {
    const existing = this.db.habitEntries.find(
      (e) => e.goalId === entry.goalId && e.date === entry.date
    );
    if (existing) {
      Object.assign(existing, entry);
      this.persist();
      return tick(existing);
    }
    const created: HabitEntry = { ...entry, id: makeId(), userId: LOCAL_USER_ID };
    this.db.habitEntries.push(created);
    this.persist();
    return tick(created);
  }

  async getDayRecords(): Promise<DayRecord[]> {
    return tick([...this.db.dayRecords].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async upsertDayRecord(record: Omit<DayRecord, 'id' | 'userId'>): Promise<DayRecord> {
    const existing = this.db.dayRecords.find((d) => d.date === record.date);
    if (existing) {
      Object.assign(existing, record);
      this.persist();
      return tick(existing);
    }
    const created: DayRecord = { ...record, id: makeId(), userId: LOCAL_USER_ID };
    this.db.dayRecords.push(created);
    this.persist();
    return tick(created);
  }

  async getStreakState(): Promise<StreakState> {
    return snapshot(this.db.streakState);
  }

  async saveStreakState(patch: Partial<Omit<StreakState, 'userId'>>): Promise<StreakState> {
    Object.assign(this.db.streakState, patch);
    this.persist();
    return snapshot(this.db.streakState);
  }

  async getAchievements(): Promise<UnlockedAchievement[]> {
    return tick([...this.db.achievements]);
  }

  async unlockAchievement(id: string): Promise<UnlockedAchievement> {
    const existing = this.db.achievements.find((a) => a.achievementId === id);
    if (existing) return tick(existing);
    const created: UnlockedAchievement = {
      userId: LOCAL_USER_ID,
      achievementId: id,
      unlockedAt: new Date().toISOString(),
    };
    this.db.achievements.push(created);
    this.persist();
    return tick(created);
  }

  async getStreaks(): Promise<Streak[]> {
    return tick([...this.db.streaks]);
  }

  async upsertStreak(streak: Streak): Promise<Streak> {
    const idx = this.db.streaks.findIndex((s) => s.goalId === streak.goalId);
    if (idx >= 0) this.db.streaks[idx] = streak;
    else this.db.streaks.push(streak);
    this.persist();
    return tick(streak);
  }

  async addGoalLog(log: Omit<GoalLog, 'id' | 'userId'>): Promise<GoalLog> {
    const newLog: GoalLog = { ...log, id: makeId(), userId: LOCAL_USER_ID };
    this.db.goalLogs.push(newLog);
    this.persist();
    return tick(newLog);
  }

  async getGoalLogs(goalId?: string): Promise<GoalLog[]> {
    const logs = goalId ? this.db.goalLogs.filter((l) => l.goalId === goalId) : [...this.db.goalLogs];
    return tick(logs);
  }

  async getProfile(): Promise<Profile> {
    return snapshot(this.db.profile);
  }

  async saveProfile(patch: Partial<Omit<Profile, 'userId'>>): Promise<Profile> {
    Object.assign(this.db.profile, patch);
    this.persist();
    return snapshot(this.db.profile);
  }

  async getWallet(): Promise<Wallet> {
    return snapshot(this.db.wallet);
  }

  async updateWallet(coins: number): Promise<Wallet> {
    this.db.wallet.coins = Math.max(0, coins);
    this.persist();
    return snapshot(this.db.wallet);
  }

  async getDayLogs(): Promise<DayLog[]> {
    return tick([...this.db.dayLogs]);
  }

  async addDayLog(log: Omit<DayLog, 'id' | 'userId'>): Promise<DayLog> {
    const newLog: DayLog = { ...log, id: makeId(), userId: LOCAL_USER_ID };
    this.db.dayLogs.push(newLog);
    this.persist();
    return tick(newLog);
  }

  async getUnlockables(): Promise<Unlockable[]> {
    return tick([...this.db.unlockables]);
  }

  async getUserUnlocks(): Promise<UserUnlock[]> {
    return tick([...this.db.userUnlocks]);
  }

  async unlock(unlockableId: string): Promise<UserUnlock> {
    const newUnlock: UserUnlock = {
      userId: LOCAL_USER_ID,
      unlockableId,
      unlockedAt: new Date().toISOString(),
    };
    this.db.userUnlocks.push(newUnlock);
    this.persist();
    return tick(newUnlock);
  }

  async resetToSeed(): Promise<void> {
    this.db = seedDb();
    this.persist();
    return tick(undefined);
  }
}

export const repository: Repository = new LocalRepository();
