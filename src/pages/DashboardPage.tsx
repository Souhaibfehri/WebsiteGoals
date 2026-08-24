import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { HabitRow } from '../components/dashboard/HabitRow';
import { MilestoneCard } from '../components/dashboard/MilestoneCard';
import { NextActionRow } from '../components/dashboard/NextActionRow';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { ProgressBar } from '../components/common/ProgressBar';
import { Icon } from '../components/common/Icon';
import { todayIso } from '../lib/date';

export function DashboardPage() {
  const goals = useAppStore((s) => s.goals);
  const stats = useAppStore((s) => s.stats);
  const streaks = useAppStore((s) => s.streaks);
  const questSteps = useAppStore((s) => s.questSteps);
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  const statById = (id: string) => stats.find((s) => s.id === id);

  const habits = goals.filter((g) => g.type === 'habit' && g.active);
  const milestones = goals.filter((g) => g.type === 'milestone' && g.active);

  const doneToday = habits.filter(
    (h) => streaks.find((s) => s.goalId === h.id)?.lastCompletedDate === todayIso()
  ).length;
  const dayProgress = habits.length === 0 ? 0 : doneToday / habits.length;

  /**
   * One next step per unfinished quest. A 15-step house build is paralysing as a
   * list; the only thing that matters today is the next undone step.
   */
  const nextActions = useMemo(() => {
    return goals
      .filter((g) => g.type === 'quest' && g.active)
      .map((g) => {
        const steps = questSteps
          .filter((s) => s.goalId === g.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const next = steps.find((s) => !s.done);
        return next ? { goal: g, step: next, total: steps.length, done: steps.filter((s) => s.done).length } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 5);
  }, [goals, questSteps]);

  return (
    <div className="space-y-7">
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">Today</h2>
            <p className="text-sm text-text-secondary">
              {doneToday} of {habits.length} done
            </p>
          </div>
          <span className="font-heading text-2xl font-extrabold tabular-nums text-accent">
            {Math.round(dayProgress * 100)}%
          </span>
        </div>
        <ProgressBar progress={dayProgress} />
      </section>

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

      {milestones.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-bold">Targets</h2>
          <div className="space-y-2">
            {milestones.map((g) => (
              <MilestoneCard key={g.id} goal={g} stat={statById(g.statId)} />
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
