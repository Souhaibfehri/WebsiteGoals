import { useAppStore } from '../../store/useAppStore';
import { todayIso } from '../../lib/date';
import { streakMultiplier } from '../../lib/xp';
import { Icon } from '../common/Icon';
import type { Goal, Stat } from '../../types';

export function HabitRow({ goal, stat }: { goal: Goal; stat: Stat | undefined }) {
  const streaks = useAppStore((s) => s.streaks);
  const completeHabit = useAppStore((s) => s.completeHabit);

  const streak = streaks.find((s) => s.goalId === goal.id);
  const doneToday = streak?.lastCompletedDate === todayIso();
  const currentStreak = streak?.currentStreak ?? 0;
  const nextMultiplier = streakMultiplier(doneToday ? currentStreak : currentStreak + 1);

  return (
    <button
      onClick={() => !doneToday && completeHabit(goal.id)}
      disabled={doneToday}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        doneToday
          ? 'border-border bg-surface/50 text-text-tertiary'
          : 'border-border bg-surface hover:border-accent'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          doneToday ? 'border-success bg-success/20 text-success' : 'border-text-secondary'
        }`}
      >
        {doneToday && <Icon name="check" width={14} height={14} />}
      </span>
      <span className={`flex-1 font-medium ${doneToday ? 'line-through' : 'text-text'}`}>{goal.title}</span>
      {stat && <span className="text-xs text-text-secondary">{stat.name}</span>}
      {currentStreak > 0 && (
        <span className="flex items-center gap-1 text-xs text-accent">
          <Icon name="flame" width={14} height={14} />
          {currentStreak}
        </span>
      )}
      <span className="text-xs text-text-tertiary w-14 text-right">
        {doneToday ? `+${Math.round(goal.xpValue * nextMultiplier)} XP` : `${Math.round(goal.xpValue * nextMultiplier)} XP`}
      </span>
    </button>
  );
}
