import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ProgressBar } from '../common/ProgressBar';
import { Icon } from '../common/Icon';
import { nextCheckpoint } from '../../lib/target';
import { statColor } from '../../types';
import type { Goal, Stat } from '../../types';

function fmt(value: number, unit: string | null) {
  const n = Math.round(value).toLocaleString();
  if (!unit) return n;
  return unit.length <= 2 ? `${unit}${n}` : `${n} ${unit}`;
}

export function MilestoneCard({
  goal,
  stat,
  onOpen,
}: {
  goal: Goal;
  stat: Stat | undefined;
  onOpen: (goal: Goal) => void;
}) {
  const checkpoints = useAppStore((s) => s.checkpoints);

  const ladder = useMemo(
    () => checkpoints.filter((c) => c.goalId === goal.id).sort((a, b) => a.value - b.value),
    [checkpoints, goal.id]
  );

  const target = goal.targetValue ?? 1;
  const progress = goal.currentValue / target;
  const next = nextCheckpoint(ladder);
  const banked = ladder.filter((c) => c.reached).length;
  const color = stat ? statColor(stat.name) : 'var(--accent)';

  return (
    <button
      onClick={() => onOpen(goal)}
      className="card card-hover w-full overflow-hidden px-4 py-3 text-left"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: color }}
      />
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-text">{goal.title}</div>
          {stat && <div className="text-xs" style={{ color }}>{stat.name}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-heading text-lg font-extrabold tabular-nums" style={{ color }}>
            {fmt(goal.currentValue, goal.unit)}
          </div>
          <div className="text-[10px] text-text-tertiary tabular-nums">
            of {fmt(target, goal.unit)}
          </div>
        </div>
      </div>

      <ProgressBar progress={progress} />

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Icon name="check" width={12} height={12} />
          <span className="tabular-nums">
            {banked}/{ladder.length} milestones
          </span>
        </span>
        {next ? (
          <span className="text-text-tertiary tabular-nums">
            {fmt(next.value - goal.currentValue, goal.unit)} to next
          </span>
        ) : (
          <span className="text-success">complete</span>
        )}
      </div>
    </button>
  );
}
