import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { CheckpointMeter } from './CheckpointMeter';
import { BalanceChart } from '../charts/BalanceChart';
import { Icon } from '../common/Icon';
import { nextCheckpoint } from '../../lib/target';
import type { Goal } from '../../types';

const GOOD = 'var(--success-ink)';
const BAD = 'var(--danger-ink)';

function fmt(value: number, unit: string | null): string {
  const n = Math.round(value).toLocaleString();
  if (!unit) return n;
  return unit.length <= 2 ? `${unit}${n}` : `${n} ${unit}`;
}

export function TargetDetail({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const checkpoints = useAppStore((s) => s.checkpoints);
  const ledger = useAppStore((s) => s.ledger);
  const recordMovement = useAppStore((s) => s.recordMovement);

  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const ladder = useMemo(
    () => checkpoints.filter((c) => c.goalId === goal.id).sort((a, b) => a.value - b.value),
    [checkpoints, goal.id]
  );
  const entries = useMemo(
    () => ledger.filter((l) => l.goalId === goal.id),
    [ledger, goal.id]
  );

  const target = goal.targetValue ?? 0;
  const next = nextCheckpoint(ladder);
  const remaining = next ? next.value - goal.currentValue : 0;
  const banked = ladder.filter((c) => c.reached).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return;
    await recordMovement(goal.id, mode === 'add' ? n : -n, note);
    setAmount('');
    setNote('');
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-2xl border-2 border-border bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-heading text-lg font-bold">{goal.title}</h2>
            <p className="text-xs text-text-secondary">
              {banked} of {ladder.length} milestones banked
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 text-text-secondary hover:text-text">
            <Icon name="x" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-heading text-3xl font-extrabold tabular-nums text-accent">
                {fmt(goal.currentValue, goal.unit)}
              </div>
              <div className="text-xs text-text-secondary tabular-nums">
                of {fmt(target, goal.unit)}
              </div>
            </div>
            {next && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
                  Next milestone
                </div>
                <div className="font-heading text-sm font-bold tabular-nums">
                  {fmt(remaining, goal.unit)} to {next.label}
                </div>
              </div>
            )}
          </div>

          <CheckpointMeter
            currentValue={goal.currentValue}
            targetValue={target}
            checkpoints={ladder}
          />

          <h3 className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
            Balance over time
          </h3>
          <BalanceChart entries={entries} targetValue={target} unit={goal.unit} />

          <form onSubmit={submit} className="mt-5">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition-transform active:scale-95 ${
                  mode === 'add'
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                    : 'border-border text-text-secondary'
                }`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setMode('remove')}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition-transform active:scale-95 ${
                  mode === 'remove'
                    ? 'border-[color:var(--danger)] bg-[color:var(--danger)]/12 text-text'
                    : 'border-border text-text-secondary'
                }`}
              >
                Take out
              </button>
            </div>

            <div className="mb-2 flex gap-2">
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={goal.unit ? `Amount in ${goal.unit}` : 'Amount'}
                className="min-w-0 flex-1 rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
              />
              <button
                type="submit"
                disabled={!Number(amount)}
                className="btn3d shrink-0 px-5 font-heading"
              >
                Log
              </button>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'remove' ? 'What did it go on? (optional)' : 'Note (optional)'}
              className="w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold text-sm outline-none focus:border-[color:var(--empire)]"
            />
            {mode === 'remove' && (
              <p className="mt-2 text-[11px] leading-snug text-text-secondary">
                Taking money out drops the balance and un-banks any milestone it falls below —
                the XP for those goes back too.
              </p>
            )}
          </form>

          {entries.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                History
              </h3>
              <ul className="space-y-1 pb-2">
                {[...entries].reverse().map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-well px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm tabular-nums" style={{ color: e.delta < 0 ? BAD : GOOD }}>
                        {e.delta < 0 ? '−' : '+'}
                        {fmt(Math.abs(e.delta), goal.unit)}
                      </div>
                      {e.note && <div className="truncate text-xs text-text-secondary">{e.note}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs tabular-nums text-text-secondary">
                        {fmt(e.balanceAfter, goal.unit)}
                      </div>
                      <div className="text-[10px] text-text-tertiary">
                        {new Date(e.at).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
