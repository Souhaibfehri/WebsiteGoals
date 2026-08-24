import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { HabitRow } from '../components/dashboard/HabitRow';
import { MilestoneCard } from '../components/dashboard/MilestoneCard';
import { NextActionRow } from '../components/dashboard/NextActionRow';
import { StatTile } from '../components/dashboard/StatTile';
import { HeroCard } from '../components/dashboard/HeroCard';
import { TargetDetail } from '../components/targets/TargetDetail';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { Icon } from '../components/common/Icon';
import { todayIso, toIsoDate } from '../lib/date';
import { totalXp } from '../lib/derived';
import type { Goal } from '../types';

/** XP earned per day over the last `days` days, for the header sparkline. */
function xpTrend(logs: { completedAt: string; xpAwarded: number }[], days = 14): number[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(toIsoDate(d), 0);
  }
  for (const log of logs) {
    const key = log.completedAt.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + log.xpAwarded);
  }
  return Array.from(buckets.values());
}

export function DashboardPage() {
  const goals = useAppStore((s) => s.goals);
  const stats = useAppStore((s) => s.stats);
  const streaks = useAppStore((s) => s.streaks);
  const questSteps = useAppStore((s) => s.questSteps);
  const checkpoints = useAppStore((s) => s.checkpoints);
  const ledger = useAppStore((s) => s.ledger);
  const [showAdd, setShowAdd] = useState(false);
  const [openTarget, setOpenTarget] = useState<Goal | null>(null);
  const navigate = useNavigate();

  const statById = (id: string) => stats.find((s) => s.id === id);

  /*
   * Ordered by stat, not creation date. Two purposes: habits cluster by domain
   * so the list reads as grouped, and neighbouring rows then follow the exact
   * sequence the stat palette was validated in — arbitrary order can otherwise
   * put two hues side by side that were never checked against each other.
   */
  const statRank = (id: string) => stats.find((s) => s.id === id)?.sortOrder ?? 99;
  const byStat = (a: Goal, b: Goal) => statRank(a.statId) - statRank(b.statId);

  const habits = goals.filter((g) => g.type === 'habit' && g.active).sort(byStat);
  const targets = goals.filter((g) => g.type === 'milestone').sort(byStat);

  const doneToday = habits.filter(
    (h) => streaks.find((s) => s.goalId === h.id)?.lastCompletedDate === todayIso()
  ).length;

  const bestStreak = streaks.reduce((m, s) => Math.max(m, s.currentStreak), 0);
  const stepsDone = questSteps.filter((s) => s.done).length;
  const milestonesBanked = checkpoints.filter((c) => c.reached).length;

  // Ledger doubles as the XP trend source once movements exist.
  const trend = useMemo(
    () => xpTrend(ledger.map((l) => ({ completedAt: l.at, xpAwarded: Math.abs(l.delta) }))),
    [ledger]
  );

  const nextActions = useMemo(() => {
    return goals
      .filter((g) => g.type === 'quest' && g.active)
      .map((g) => {
        const steps = questSteps
          .filter((s) => s.goalId === g.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const next = steps.find((s) => !s.done);
        return next
          ? { goal: g, step: next, total: steps.length, done: steps.filter((s) => s.done).length }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 5);
  }, [goals, questSteps]);

  return (
    <div className="space-y-6">
      <HeroCard doneToday={doneToday} totalToday={habits.length} />

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <StatTile
          label="Total XP"
          value={totalXp(stats).toLocaleString()}
          sub="across all stats"
          trend={trend.some((v) => v > 0) ? trend : undefined}
        />
        <StatTile label="Best streak" value={String(bestStreak)} sub="days running" />
        <StatTile label="Steps done" value={String(stepsDone)} sub="quest progress" />
        <StatTile label="Milestones" value={String(milestonesBanked)} sub="banked in targets" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Daily habits</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-sm font-medium text-accent transition-transform active:scale-95"
          >
            <Icon name="plus" width={16} height={16} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {habits.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
              No habits yet — add the first one.
            </p>
          )}
          {habits.map((g) => (
            <HabitRow key={g.id} goal={g} stat={statById(g.statId)} />
          ))}
        </div>
      </section>

      <div className="space-y-6">
      {nextActions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Next moves</h2>
            <button
              onClick={() => navigate('/quests')}
              className="flex items-center gap-1 text-sm font-medium text-accent transition-transform active:scale-95"
            >
              All quests
              <Icon name="arrow-right" width={14} height={14} />
            </button>
          </div>
          <div className="space-y-2">
            {nextActions.map(({ goal, step, done, total }) => (
              <NextActionRow key={step.id} goal={goal} step={step} done={done} total={total} />
            ))}
          </div>
        </section>
      )}

      {targets.length > 0 && (
        <section>
          <h2 className="mb-1 font-heading text-lg font-bold">Targets</h2>
          <p className="mb-3 text-xs text-text-secondary">
            Tap one to log money in or out and see its milestones.
          </p>
          <div className="space-y-2">
            {targets.map((g) => (
              <MilestoneCard
                key={g.id}
                goal={g}
                stat={statById(g.statId)}
                onOpen={setOpenTarget}
              />
            ))}
          </div>
        </section>
      )}

        </div>
      </div>

      <AnimatePresence>
        {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
        {openTarget && (
          <TargetDetail
            goal={goals.find((g) => g.id === openTarget.id) ?? openTarget}
            onClose={() => setOpenTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
