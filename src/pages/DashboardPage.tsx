import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { HabitRow } from '../components/dashboard/HabitRow';
import { MilestoneCard } from '../components/dashboard/MilestoneCard';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { Icon } from '../components/common/Icon';

export function DashboardPage() {
  const goals = useAppStore((s) => s.goals);
  const stats = useAppStore((s) => s.stats);
  const [showAdd, setShowAdd] = useState(false);

  const statById = (id: string) => stats.find((s) => s.id === id);

  const habits = goals.filter((g) => g.type === 'habit' && g.active);
  const milestones = goals.filter((g) => g.type === 'milestone' && g.active);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg">Today</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-sm text-accent font-medium"
          >
            <Icon name="plus" width={16} height={16} />
            Add goal
          </button>
        </div>
        <div className="space-y-2">
          {habits.length === 0 && (
            <p className="text-text-secondary text-sm">No habits yet — add your first one.</p>
          )}
          {habits.map((g) => (
            <HabitRow key={g.id} goal={g} stat={statById(g.statId)} />
          ))}
        </div>
      </section>

      {milestones.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Milestones</h2>
          <div className="space-y-2">
            {milestones.map((g) => (
              <MilestoneCard key={g.id} goal={g} stat={statById(g.statId)} />
            ))}
          </div>
        </section>
      )}

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
