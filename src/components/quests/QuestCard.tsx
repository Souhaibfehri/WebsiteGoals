import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { playCompleteChime } from '../../lib/sound';
import { Icon } from '../common/Icon';
import { RadialProgress } from '../common/RadialProgress';
import { statColor } from '../../types';
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
  const toggleQuestStep = useAppStore((s) => s.toggleQuestStep);
  const addStepToQuest = useAppStore((s) => s.addStepToQuest);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const [open, setOpen] = useState(defaultOpen);
  const [newStep, setNewStep] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progress = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;
  const nextStep = steps.find((s) => !s.done);
  const color = stat ? statColor(stat.name) : 'var(--accent)';

  function handleToggle(step: QuestStep) {
    if (!step.done) playCompleteChime();
    toggleQuestStep(step.id);
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    const title = newStep.trim();
    if (!title) return;
    setNewStep('');
    await addStepToQuest(goal.id, title);
  }

  return (
    <div
      className={`card card-hover overflow-hidden ${complete ? 'opacity-70' : ''}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: complete ? 'var(--success)' : color }}
      />
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <RadialProgress progress={progress} size={46} strokeWidth={3.5} color={color}>
          <span className="font-heading text-[11px] font-extrabold tabular-nums">
            {done}/{total}
          </span>
        </RadialProgress>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate font-heading font-bold ${complete ? 'text-text-secondary line-through' : ''}`}>
              {goal.title}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
            {goal.location && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <Icon name="pin" width={12} height={12} />
                {goal.location}
              </span>
            )}
            {stat && <span style={{ color }}>{stat.name}</span>}
            {nextStep && !complete && (
              <span className="truncate text-text-tertiary">· next: {nextStep.title}</span>
            )}
          </div>
        </div>

        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-text-secondary">
          <Icon name="chevron" width={18} height={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3">
              <ol className="space-y-1">
                {steps.map((step, i) => (
                  <li key={step.id}>
                    <button
                      onClick={() => handleToggle(step)}
                      className="group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-right font-heading text-[11px] tabular-nums text-text-tertiary">
                        {i + 1}
                      </span>
                      <motion.span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                          step.done
                            ? 'border-success bg-success/20 text-success'
                            : 'border-text-secondary group-hover:border-accent'
                        }`}
                        animate={step.done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.done && <Icon name="check" width={12} height={12} />}
                      </motion.span>
                      <span
                        className={`flex-1 text-sm ${
                          step.done ? 'text-text-tertiary line-through' : 'text-text'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-text-tertiary tabular-nums">
                        {step.xpValue} XP
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <form onSubmit={handleAddStep} className="mt-3 flex gap-2">
                <input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Add a step…"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!newStep.trim()}
                  className="rounded-lg border border-border px-3 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text disabled:opacity-40"
                >
                  Add
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => onDuplicate(goal)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-transform active:scale-95"
                >
                  <Icon name="copy" width={14} height={14} />
                  Clone for another place
                </button>
                {confirmDelete ? (
                  <span className="flex items-center gap-2 text-xs">
                    <button onClick={() => deleteGoal(goal.id)} className="font-medium text-red-400">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-text-secondary">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-red-400"
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
