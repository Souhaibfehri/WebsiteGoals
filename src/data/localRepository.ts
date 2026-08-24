import { makeId } from '../lib/id';
import { levelFromXp } from '../lib/xp';
import type {
  DayLog,
  Goal,
  GoalLog,
  QuestStep,
  Stat,
  StatName,
  Streak,
  UserUnlock,
  Unlockable,
  Wallet,
} from '../types';
import { STAT_ICON, STAT_ORDER } from '../types';
import { QUEST_TEMPLATES } from './templates';
import type { Repository } from './repository';
import { LOCAL_USER_ID } from './localUser';
import { readItem, writeItem } from './safeStorage';

const STORAGE_KEY = 'lifeos.db.v2';

interface Db {
  stats: Stat[];
  goals: Goal[];
  questSteps: QuestStep[];
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

interface SeedResult {
  goals: Goal[];
  questSteps: QuestStep[];
}

function seedGoalsAndSteps(stats: Stat[]): SeedResult {
  const statId = (n: StatName) => stats.find((s) => s.name === n)!.id;
  const now = new Date().toISOString();
  const goals: Goal[] = [];
  const questSteps: QuestStep[] = [];

  const make = (
    partial: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'active' | 'track' | 'location' | 'unit'> &
      Partial<Pick<Goal, 'track' | 'location' | 'unit'>>
  ): Goal => {
    const goal: Goal = {
      id: makeId(),
      userId: LOCAL_USER_ID,
      active: true,
      createdAt: now,
      track: null,
      location: null,
      unit: null,
      ...partial,
    };
    goals.push(goal);
    return goal;
  };

  // --- Daily habits, one per domain that benefits from a daily rep ---
  const habit = (title: string, stat: StatName, xp: number, difficulty: Goal['difficulty']) =>
    make({
      title,
      statId: statId(stat),
      type: 'habit',
      difficulty,
      xpValue: xp,
      targetValue: null,
      currentValue: 0,
      cadence: 'daily',
    });

  habit('Train — gym or run', 'Body', 25, 'medium');
  habit('Brush teeth (morning + night)', 'Body', 5, 'trivial');
  habit('7+ hours sleep', 'Body', 10, 'easy');
  habit('One deep work block, no phone', 'Work', 25, 'medium');
  habit('Publish or film one piece of content', 'Content', 25, 'medium');
  habit('Reach out to one new contact', 'Reputation', 10, 'easy');
  habit('Read or study 30 minutes', 'Mind', 10, 'easy');
  habit('Review the numbers — revenue and spend', 'Wealth', 10, 'easy');

  // --- Milestones: the big numeric targets ---
  make({
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
  make({
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
  make({
    title: 'Grow to 50,000 followers',
    statId: statId('Reputation'),
    type: 'milestone',
    difficulty: 'milestone',
    xpValue: 800,
    targetValue: 50000,
    currentValue: 0,
    cadence: 'weekly',
  });
  make({
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

  return { goals, questSteps };
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
  const { goals, questSteps } = seedGoalsAndSteps(stats);
  return {
    stats,
    goals,
    questSteps,
    goalLogs: [],
    streaks: [],
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
    this.db.wallet.coins = Math.max(0, coins);
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

  async resetToSeed(): Promise<void> {
    this.db = seedDb();
    this.persist();
    return tick(undefined);
  }
}

export const repository: Repository = new LocalRepository();
