import { makeId } from '../lib/id';
import { levelFromXp } from '../lib/xp';
import type {
  DayLog,
  Goal,
  GoalLog,
  Stat,
  Streak,
  StatName,
  UserUnlock,
  Unlockable,
  Wallet,
} from '../types';
import { STAT_ICON, STAT_ORDER } from '../types';
import type { Repository } from './repository';
import { LOCAL_USER_ID } from './localUser';

const STORAGE_KEY = 'lifeos.db.v1';

interface Db {
  stats: Stat[];
  goals: Goal[];
  goalLogs: GoalLog[];
  streaks: Streak[];
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

function seedGoals(stats: Stat[]): Goal[] {
  const byName = (n: StatName) => stats.find((s) => s.name === n)!.id;
  const now = new Date().toISOString();
  const goal = (partial: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'active'>): Goal => ({
    id: makeId(),
    userId: LOCAL_USER_ID,
    active: true,
    createdAt: now,
    ...partial,
  });
  return [
    goal({
      title: 'Brush teeth',
      statId: byName('Body'),
      type: 'habit',
      difficulty: 'trivial',
      xpValue: 5,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    }),
    goal({
      title: 'Short walk',
      statId: byName('Body'),
      type: 'habit',
      difficulty: 'easy',
      xpValue: 10,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    }),
    goal({
      title: 'Full workout',
      statId: byName('Body'),
      type: 'habit',
      difficulty: 'medium',
      xpValue: 25,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    }),
    goal({
      title: 'Deep work session',
      statId: byName('Career'),
      type: 'habit',
      difficulty: 'medium',
      xpValue: 25,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    }),
    goal({
      title: 'Journal / reflect',
      statId: byName('Mind'),
      type: 'habit',
      difficulty: 'easy',
      xpValue: 10,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    }),
    goal({
      title: 'Save $10,000',
      statId: byName('Wealth'),
      type: 'milestone',
      difficulty: 'milestone',
      xpValue: 500,
      targetValue: 10000,
      currentValue: 0,
      cadence: 'weekly',
    }),
  ];
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
  return {
    stats,
    goals: seedGoals(stats),
    goalLogs: [],
    streaks: [],
    wallet: { userId: LOCAL_USER_ID, coins: 0 },
    dayLogs: [],
    unlockables: seedUnlockables(),
    userUnlocks: [],
  };
}

function load(): Db {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const db = seedDb();
    save(db);
    return db;
  }
  try {
    return JSON.parse(raw) as Db;
  } catch {
    const db = seedDb();
    save(db);
    return db;
  }
}

function save(db: Db): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Small artificial async boundary so call sites are already Promise-shaped for a future async backend. */
function tick<T>(value: T): Promise<T> {
  return Promise.resolve(value);
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
    this.persist();
    return tick(undefined);
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

  async getWallet(): Promise<Wallet> {
    return tick(this.db.wallet);
  }

  async updateWallet(coins: number): Promise<Wallet> {
    this.db.wallet.coins = coins;
    this.persist();
    return tick(this.db.wallet);
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
}

export const repository: Repository = new LocalRepository();
