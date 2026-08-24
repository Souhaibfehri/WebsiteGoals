import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { playCompleteChime } from '../../lib/sound';
import { Icon } from '../common/Icon';
import type { Goal, QuestStep } from '../../types';

/** The single next step of a quest, actionable straight from the dashboard. */
export function NextActionRow({
  goal,
  step,
  done,
  total,
}: {
  goal: Goal;
  step: QuestStep;
  done: number;
  total: number;
}) {
  const toggleQuestStep = useAppStore((s) => s.toggleQuestStep);
  const [popups, setPopups] = useState<{ id: number; xp: number }[]>([]);

  function handleComplete() {
    playCompleteChime();
    const id = Date.now();
    setPopups((p) => [...p, { id, xp: step.xpValue }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
    toggleQuestStep(step.id);
  }

  return (
    <motion.button
      onClick={handleComplete}
      whileTap={{ scale: 0.98 }}
      className="relative flex w-full items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-accent hover:shadow-[0_0_0_1px_rgba(216,98,47,0.3),0_8px_24px_-12px_rgba(216,98,47,0.4)]"
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

      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-text-secondary" />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{step.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-text-secondary">
          <span className="truncate">{goal.title}</span>
          {goal.location && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Icon name="pin" width={11} height={11} />
              {goal.location}
            </span>
          )}
          <span className="text-text-tertiary tabular-nums">
            {done}/{total}
          </span>
        </span>
      </span>

      <span className="shrink-0 text-xs text-text-tertiary tabular-nums">{step.xpValue} XP</span>
    </motion.button>
  );
}
