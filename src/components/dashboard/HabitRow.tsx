import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { todayIso, isSameIsoWeek } from '../../lib/date';
import { streakMultiplier } from '../../lib/xp';
import { stepFor } from '../../lib/habit';
import { playCompleteChime } from '../../lib/sound';
import { Icon, type IconName } from '../common/Icon';
import { statFill, statInk } from '../../types';
import type { Goal, Stat } from '../../types';

export function HabitRow({ goal, stat }: { goal: Goal; stat: Stat | undefined }) {
  const streaks = useAppStore((s) => s.streaks);
  const habitEntries = useAppStore((s) => s.habitEntries);
  const logHabit = useAppStore((s) => s.logHabit);
  const [popups, setPopups] = useState<{ id: number; xp: number }[]>([]);

  const today = todayIso();
  const entry = habitEntries.find((e) => e.goalId === goal.id && e.date === today);
  const value = entry?.value ?? 0;
  const target = Math.max(1, goal.dailyTarget);
  const done = value >= target;

  const streak = streaks.find((s) => s.goalId === goal.id);
  const currentStreak = streak?.currentStreak ?? 0;
  const xpPreview = Math.round(
    goal.xpValue * streakMultiplier(done ? currentStreak : currentStreak + 1)
  );

  const fill = stat ? statFill(stat.name) : 'var(--accent)';
  const ink = stat ? statInk(stat.name) : 'var(--accent-ink)';
  const step = stepFor(goal.trackingMode, target);
  const isCounted = goal.trackingMode !== 'binary';

  const weekDone = habitEntries.filter(
    (e) => e.goalId === goal.id && e.completed && isSameIsoWeek(e.date, today)
  ).length;

  function bump(delta: number) {
    if (delta > 0) {
      playCompleteChime();
      // Only the tap that completes the day pays out, so only that one pops.
      if (value + delta >= target && !done) {
        const id = Date.now();
        setPopups((p) => [...p, { id, xp: xpPreview }]);
        setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
      }
    }
    logHabit(goal.id, delta);
  }

  return (
    <div
      className="relative rounded-2xl border-2 border-b-4 p-3"
      style={{
        borderColor: done ? 'var(--success)' : 'var(--border)',
        background: done ? 'color-mix(in srgb, var(--success) 10%, #fff)' : '#fff',
      }}
    >
      <AnimatePresence>
        {popups.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute right-4 top-1 font-heading text-lg font-extrabold"
            style={{ color: ink }}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1.15 }}
            exit={{ opacity: 0, y: -44 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            +{p.xp} XP
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-3.5">
        {/* Binary habits toggle from the tile; counted ones use +/- instead. */}
        <button
          onClick={() => bump(done ? -target : step)}
          aria-label={done ? `Undo ${goal.title}` : `Complete ${goal.title}`}
          className="press grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: done ? 'var(--success)' : fill }}
        >
          {done ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >
              <Icon name="check" width={28} height={28} strokeWidth={3.5} />
            </motion.span>
          ) : (
            stat && <Icon name={stat.icon as IconName} width={26} height={26} strokeWidth={2.5} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span
            className={`block font-heading text-[15px] font-extrabold leading-snug ${
              done ? 'text-text-tertiary line-through' : 'text-text'
            }`}
          >
            {goal.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-bold">
            {stat && <span style={{ color: ink }}>{stat.name}</span>}
            {isCounted && (
              <span className="text-text-secondary tabular-nums">
                {value}/{target} {goal.unitLabel ?? (goal.trackingMode === 'duration' ? 'min' : '')}
              </span>
            )}
            {goal.cadence === 'weekly' && goal.weeklyTarget && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                style={{ background: 'var(--empire)' }}
              >
                {weekDone}/{goal.weeklyTarget} this week
              </span>
            )}
            {!isCounted && <span className="text-text-tertiary tabular-nums">+{xpPreview} XP</span>}
          </span>

          {isCounted && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full"
                style={{ background: done ? 'var(--success)' : fill }}
                initial={false}
                animate={{ width: `${Math.min(100, (value / target) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              />
            </div>
          )}
        </div>

        {isCounted ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => bump(-step)}
              disabled={value === 0}
              aria-label={`Remove ${step} from ${goal.title}`}
              className="press grid h-10 w-10 place-items-center rounded-xl border-2 border-border text-text-secondary disabled:opacity-30"
            >
              <Icon name="x" width={16} height={16} strokeWidth={3} />
            </button>
            <button
              onClick={() => bump(step)}
              disabled={done}
              aria-label={`Add ${step} to ${goal.title}`}
              className="press grid h-10 w-10 place-items-center rounded-xl text-white disabled:opacity-30"
              style={{ background: fill }}
            >
              <Icon name="plus" width={18} height={18} strokeWidth={3} />
            </button>
          </div>
        ) : (
          currentStreak > 0 && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold text-white tabular-nums"
              style={{ background: 'var(--accent)' }}
            >
              <Icon name="flame" width={12} height={12} />
              {currentStreak}
            </span>
          )
        )}
      </div>

      {/* An explicit way back, because a habit tapped by accident should not
          be a permanent entry in your record. */}
      {done && (
        <button
          onClick={() => bump(-target)}
          className="press mt-2 w-full rounded-xl border-2 border-border py-1.5 text-xs font-extrabold text-text-secondary"
        >
          Undo
        </button>
      )}
    </div>
  );
}
