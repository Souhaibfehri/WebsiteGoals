import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ProgressBar } from '../common/ProgressBar';
import type { Goal, Stat } from '../../types';

export function MilestoneCard({ goal, stat }: { goal: Goal; stat: Stat | undefined }) {
  const logMilestoneValue = useAppStore((s) => s.logMilestoneValue);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal.currentValue));

  const target = goal.targetValue ?? 1;
  const progress = goal.currentValue / target;

  async function handleSave() {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      await logMilestoneValue(goal.id, parsed);
    }
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-text">{goal.title}</span>
        {stat && <span className="text-xs text-text-secondary">{stat.name}</span>}
      </div>
      <div className="mb-2">
        <ProgressBar progress={progress} />
      </div>
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          {goal.currentValue.toLocaleString()} / {target.toLocaleString()}
        </span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24 rounded border border-border bg-bg px-2 py-1 text-text outline-none focus:border-accent"
            />
            <button onClick={handleSave} className="text-accent font-medium transition-transform active:scale-95">
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-accent font-medium transition-transform active:scale-95">
            Update
          </button>
        )}
      </div>
    </div>
  );
}
