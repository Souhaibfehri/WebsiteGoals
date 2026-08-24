import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { todayIso } from '../../lib/date';
import { streakMultiplier } from '../../lib/xp';
import { playCompleteChime } from '../../lib/sound';
import { Icon } from '../common/Icon';
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
      whileTap={!doneToday ? { scale: 0.98 } : undefined}
      className={`relative w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        doneToday
          ? 'border-border bg-surface/50 text-text-tertiary'
          : 'border-border bg-surface hover:border-accent hover:shadow-[0_0_0_1px_rgba(216,98,47,0.3),0_8px_24px_-12px_rgba(216,98,47,0.4)]'
      }`}
    >
      <AnimatePresence>
        {popups.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute right-4 top-1 font-heading font-bold text-accent"
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
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          doneToday ? 'border-success bg-success/20 text-success' : 'border-text-secondary'
        }`}
        animate={doneToday ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {doneToday && <Icon name="check" width={14} height={14} />}
      </motion.span>
      <span className={`flex-1 font-medium ${doneToday ? 'line-through' : 'text-text'}`}>{goal.title}</span>
      {stat && <span className="text-xs text-text-secondary">{stat.name}</span>}
      {currentStreak > 0 && (
        <motion.span
          className="flex items-center gap-1 text-xs text-accent"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon name="flame" width={14} height={14} />
          {currentStreak}
        </motion.span>
      )}
      <span className="text-xs text-text-tertiary w-14 text-right">
        {doneToday ? `+${xpPreview} XP` : `${xpPreview} XP`}
      </span>
    </motion.button>
  );
}
