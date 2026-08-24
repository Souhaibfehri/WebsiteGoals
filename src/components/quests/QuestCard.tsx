import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { QuestPath } from './QuestPath';
import { DomainArt } from '../art/DomainArt';
import { Icon } from '../common/Icon';
import { statFill, statInk } from '../../types';
import type { Goal, QuestStep, Stat } from '../../types';

export function QuestCard({
  goal,
  steps,
  stat,
  onDuplicate,
  defaultOpen = false,
}: {
  goal: Goal;
  steps: QuestStep[];
  stat: Stat | undefined;
  onDuplicate: (goal: Goal) => void;
  defaultOpen?: boolean;
}) {
  const addStepToQuest = useAppStore((s) => s.addStepToQuest);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const [open, setOpen] = useState(defaultOpen);
  const [newStep, setNewStep] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;
  const fill = stat ? statFill(stat.name) : 'var(--accent)';
  const ink = stat ? statInk(stat.name) : 'var(--accent-ink)';

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    const title = newStep.trim();
    if (!title) return;
    setNewStep('');
    await addStepToQuest(goal.id, title);
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-b-4"
      style={{ borderColor: complete ? 'var(--success)' : 'var(--border)', background: '#fff' }}
    >
      <button onClick={() => setOpen((o) => !o)} className="w-full p-4 text-left">
        <div className="flex items-center gap-3.5">
          <span className="shrink-0">
            {stat && <DomainArt name={stat.name} size={56} />}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-extrabold text-text">
              {goal.title}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-bold">
              {goal.location && (
                <span className="inline-flex items-center gap-1" style={{ color: ink }}>
                  <Icon name="pin" width={12} height={12} />
                  {goal.location}
                </span>
              )}
              {stat && <span style={{ color: ink }}>{stat.name}</span>}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="relative h-full rounded-full"
                  style={{ background: complete ? 'var(--success)' : fill }}
                  initial={false}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                >
                  <span className="absolute inset-x-1 top-0.5 h-[3px] rounded-full bg-white/45" />
                </motion.div>
              </div>
              <span className="shrink-0 text-xs font-extrabold text-text-secondary tabular-nums">
                {done}/{total}
              </span>
            </div>
          </div>

          <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-text-tertiary">
            <Icon name="chevron" width={20} height={20} strokeWidth={3} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-border bg-well px-3 py-3">
              <QuestPath goal={goal} steps={steps} stat={stat} />

              <form onSubmit={handleAddStep} className="mx-auto mt-3 flex max-w-md gap-2">
                <input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Add a step…"
                  className="min-w-0 flex-1 rounded-xl border-2 border-border bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[color:var(--empire)]"
                />
                <button
                  type="submit"
                  disabled={!newStep.trim()}
                  className="btn3d px-4 py-2.5 text-sm"
                  style={{ '--btn-face': fill, '--btn-lip': ink } as React.CSSProperties}
                >
                  Add
                </button>
              </form>

              <div className="mx-auto mt-3 flex max-w-md items-center justify-between">
                <button
                  onClick={() => onDuplicate(goal)}
                  className="press inline-flex items-center gap-1.5 text-xs font-extrabold"
                  style={{ color: ink }}
                >
                  <Icon name="copy" width={14} height={14} strokeWidth={2.5} />
                  Clone for another place
                </button>
                {confirmDelete ? (
                  <span className="flex items-center gap-2 text-xs font-extrabold">
                    <button onClick={() => deleteGoal(goal.id)} className="text-[color:var(--danger-ink)]">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-text-secondary">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-text-tertiary"
                  >
                    <Icon name="trash" width={14} height={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
