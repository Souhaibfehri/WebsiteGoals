import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { todayIso } from '../../lib/date';
import { streakMultiplier } from '../../lib/xp';
import { playCompleteChime } from '../../lib/sound';
import { Icon, type IconName } from '../common/Icon';
import { statFill, statInk } from '../../types';
import type { Goal, Stat } from '../../types';

export function HabitRow({ goal, stat }: { goal: Goal; stat: Stat | undefined }) {
  const streaks = useAppStore((s) => s.streaks);
  const completeHabit = useAppStore((s) => s.completeHabit);
  const [popups, setPopups] = useState<{ id: number; xp: number }[]>([]);

  const streak = streaks.find((s) => s.goalId === goal.id);
  const doneToday = streak?.lastCompletedDate === todayIso();
  const currentStreak = streak?.currentStreak ?? 0;
  const xpPreview = Math.round(
    goal.xpValue * streakMultiplier(doneToday ? currentStreak : currentStreak + 1)
  );
  const fill = stat ? statFill(stat.name) : 'var(--accent)';
  const ink = stat ? statInk(stat.name) : 'var(--accent-ink)';

  function handleComplete() {
    if (doneToday) return;
    playCompleteChime();
    const id = Date.now();
    setPopups((p) => [...p, { id, xp: xpPreview }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
    completeHabit(goal.id);
  }

  return (
    <motion.button
      onClick={handleComplete}
      disabled={doneToday}
      className="press relative flex w-full items-center gap-3.5 rounded-2xl border-2 border-b-4 p-3 text-left"
      style={{
        borderColor: doneToday ? 'var(--success)' : 'var(--border)',
        background: doneToday ? 'color-mix(in srgb, var(--success) 10%, #fff)' : '#fff',
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

      {/* Big colour tile: the domain reads instantly, and it gives the row weight. */}
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white"
        style={{ background: doneToday ? 'var(--success)' : fill }}
      >
        {doneToday ? (
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
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block font-heading text-[15px] font-extrabold leading-snug ${
            doneToday ? 'text-text-tertiary line-through' : 'text-text'
          }`}
        >
          {goal.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-bold">
          {stat && <span style={{ color: ink }}>{stat.name}</span>}
          <span className="text-text-tertiary tabular-nums">+{xpPreview} XP</span>
        </span>
      </span>

      {currentStreak > 0 && (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold text-white tabular-nums"
          style={{ background: 'var(--accent)' }}
        >
          <Icon name="flame" width={12} height={12} />
          {currentStreak}
        </span>
      )}
    </motion.button>
  );
}
