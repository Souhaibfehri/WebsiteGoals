import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { todayIso } from '../../lib/date';
import { streakMultiplier } from '../../lib/xp';
import { playCompleteChime } from '../../lib/sound';
import { Icon, type IconName } from '../common/Icon';
import { statColor } from '../../types';
import type { Goal, Stat } from '../../types';

export function HabitRow({ goal, stat }: { goal: Goal; stat: Stat | undefined }) {
  const streaks = useAppStore((s) => s.streaks);
  const completeHabit = useAppStore((s) => s.completeHabit);
  const [popups, setPopups] = useState<{ id: number; xp: number }[]>([]);

  const streak = streaks.find((s) => s.goalId === goal.id);
  const doneToday = streak?.lastCompletedDate === todayIso();
  const currentStreak = streak?.currentStreak ?? 0;
  const nextMultiplier = streakMultiplier(doneToday ? currentStreak : currentStreak + 1);
  const xpPreview = Math.round(goal.xpValue * nextMultiplier);
  const color = stat ? statColor(stat.name) : 'var(--accent)';

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
      whileTap={!doneToday ? { scale: 0.985 } : undefined}
      className={`card card-hover relative flex w-full items-center gap-3 overflow-hidden py-3 pl-4 pr-3 text-left ${
        doneToday ? 'opacity-55' : ''
      }`}
    >
      {/* Domain stripe — the row's identity, alongside the icon and stat name. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: doneToday ? 'var(--border-strong)' : color }}
      />

      <AnimatePresence>
        {popups.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute right-4 top-1 font-heading font-bold"
            style={{ color }}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -28, scale: 1.1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            +{p.xp} XP
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2"
        style={{
          borderColor: doneToday ? 'var(--success)' : 'var(--text-tertiary)',
          background: doneToday ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'transparent',
          color: 'var(--success)',
        }}
        animate={doneToday ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {doneToday && <Icon name="check" width={14} height={14} />}
      </motion.span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-[15px] font-medium leading-snug ${
            doneToday ? 'text-text-tertiary line-through' : 'text-text'
          }`}
        >
          {goal.title}
        </span>
        {stat && (
          <span className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color }}>
            <Icon name={stat.icon as IconName} width={11} height={11} />
            {stat.name}
          </span>
        )}
      </span>

      {currentStreak > 0 && (
        <motion.span
          className="flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent tabular-nums"
          animate={{ opacity: [1, 0.65, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon name="flame" width={11} height={11} />
          {currentStreak}
        </motion.span>
      )}

      <span className="w-12 shrink-0 text-right text-xs text-text-tertiary tabular-nums">
        {xpPreview} XP
      </span>
    </motion.button>
  );
}
