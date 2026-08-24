import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DIFFICULTY_XP, type Difficulty, type GoalType } from '../../types';
import { Icon } from '../common/Icon';

export function AddGoalModal({ onClose }: { onClose: () => void }) {
  const stats = useAppStore((s) => s.stats);
  const addGoal = useAppStore((s) => s.addGoal);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('habit');
  const [statId, setStatId] = useState(stats[0]?.id ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [targetValue, setTargetValue] = useState('');

  const canSubmit = title.trim().length > 0 && statId && (type !== 'milestone' || Number(targetValue) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await addGoal({
      title: title.trim(),
      type,
      statId,
      difficulty,
      xpValue: DIFFICULTY_XP[difficulty],
      targetValue: type === 'milestone' ? Number(targetValue) : null,
      currentValue: 0,
      cadence: type === 'milestone' ? 'weekly' : 'daily',
      active: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">New Goal</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <Icon name="x" />
          </button>
        </div>

        <label className="block text-sm text-text-secondary mb-1">Title</label>
        <input
          className="w-full mb-4 rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-accent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Full workout"
          autoFocus
        />

        <label className="block text-sm text-text-secondary mb-1">Type</label>
        <div className="flex gap-2 mb-4">
          {(['habit', 'milestone'] as GoalType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                type === t ? 'border-accent bg-accent/10 text-text' : 'border-border text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-sm text-text-secondary mb-1">Stat</label>
        <select
          className="w-full mb-4 rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-accent"
          value={statId}
          onChange={(e) => setStatId(e.target.value)}
        >
          {stats.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {type === 'milestone' ? (
          <>
            <label className="block text-sm text-text-secondary mb-1">Target value</label>
            <input
              type="number"
              min={1}
              className="w-full mb-4 rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-accent"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g. 10000"
            />
          </>
        ) : (
          <>
            <label className="block text-sm text-text-secondary mb-1">Difficulty</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['trivial', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-2 py-2 text-xs capitalize ${
                    difficulty === d ? 'border-accent bg-accent/10 text-text' : 'border-border text-text-secondary'
                  }`}
                >
                  {d}
                  <div className="text-text-tertiary">{DIFFICULTY_XP[d]} XP</div>
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-accent py-2.5 font-heading font-bold text-white disabled:opacity-40"
        >
          Create Goal
        </button>
      </form>
    </div>
  );
}
