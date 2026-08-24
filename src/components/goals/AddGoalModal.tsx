import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { QUEST_TEMPLATES } from '../../data/templates';
import {
  DIFFICULTY_XP,
  TRACKS,
  type Difficulty,
  type GoalType,
  type Track,
  type TrackingMode,
} from '../../types';
import { Icon } from '../common/Icon';

const TYPES: { value: GoalType; label: string; hint: string }[] = [
  { value: 'habit', label: 'Habit', hint: 'Repeats every day' },
  { value: 'milestone', label: 'Target', hint: 'A number to reach' },
  { value: 'quest', label: 'Quest', hint: 'A project with steps' },
];

export function AddGoalModal({
  onClose,
  initialType = 'habit',
}: {
  onClose: () => void;
  initialType?: GoalType;
}) {
  const stats = useAppStore((s) => s.stats);
  const addGoal = useAppStore((s) => s.addGoal);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>(initialType);
  const [statId, setStatId] = useState(stats[0]?.id ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [track, setTrack] = useState<Track>('Empire');
  const [location, setLocation] = useState('');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('binary');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [unitLabel, setUnitLabel] = useState('');
  const [habitCadence, setHabitCadence] = useState<'daily' | 'weekly'>('daily');
  const [weeklyTarget, setWeeklyTarget] = useState('3');
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDraft, setStepDraft] = useState('');

  const canSubmit =
    title.trim().length > 0 &&
    statId &&
    (type !== 'milestone' || Number(targetValue) > 0) &&
    (type !== 'quest' || steps.length > 0);

  function applyTemplate(key: string) {
    const tpl = QUEST_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setTitle(tpl.title);
    setTrack(tpl.track);
    setSteps(tpl.steps);
    const match = stats.find((s) => s.name === tpl.stat);
    if (match) setStatId(match.id);
  }

  function addStep() {
    const t = stepDraft.trim();
    if (!t) return;
    setSteps((s) => [...s, t]);
    setStepDraft('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await addGoal(
      {
        title: title.trim(),
        type,
        statId,
        difficulty: type === 'quest' ? 'hard' : type === 'milestone' ? 'milestone' : difficulty,
        xpValue:
          type === 'quest' ? 300 : type === 'milestone' ? 800 : DIFFICULTY_XP[difficulty],
        targetValue: type === 'milestone' ? Number(targetValue) : null,
        currentValue: 0,
        cadence: type === 'habit' ? habitCadence : type === 'milestone' ? 'weekly' : null,
        active: true,
        track: type === 'quest' ? track : null,
        location: type === 'quest' && location.trim() ? location.trim() : null,
        unit: type === 'milestone' && unit.trim() ? unit.trim() : null,
        trackingMode,
        dailyTarget: trackingMode === 'binary' ? 1 : Math.max(1, Number(dailyTarget) || 1),
        unitLabel: trackingMode === 'count' && unitLabel.trim() ? unitLabel.trim() : null,
        weeklyTarget: type === 'habit' && habitCadence === 'weekly' ? Number(weeklyTarget) || 3 : null,
      },
      type === 'quest' ? steps : undefined
    );
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        className="max-h-[85svh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-border bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">New goal</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text">
            <Icon name="x" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-xl border-2 px-2 py-2 text-left transition-transform active:scale-95 ${
                type === t.value
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                  : 'border-border text-text-secondary'
              }`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-[10px] leading-tight text-text-tertiary">{t.hint}</div>
            </button>
          ))}
        </div>

        {type === 'quest' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-text-secondary">Start from a playbook</label>
            <div className="flex flex-wrap gap-2">
              {QUEST_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t.key)}
                  className="rounded-full border-2 border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-text"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mb-1 block text-sm text-text-secondary">Title</label>
        <input
          className="mb-4 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'quest' ? 'e.g. Build house — Marrakech' : 'e.g. Train — gym or run'}
        />

        <label className="mb-1 block text-sm text-text-secondary">Feeds which stat</label>
        <select
          className="mb-4 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
          value={statId}
          onChange={(e) => setStatId(e.target.value)}
        >
          {stats.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {type === 'quest' && (
          <>
            <label className="mb-1 block text-sm text-text-secondary">Track</label>
            <select
              className="mb-4 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
              value={track}
              onChange={(e) => setTrack(e.target.value as Track)}
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm text-text-secondary">Country or place (optional)</label>
            <input
              className="mb-4 w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Morocco"
            />

            <label className="mb-1 block text-sm text-text-secondary">
              Steps {steps.length > 0 && <span className="text-text-tertiary">({steps.length})</span>}
            </label>
            {steps.length > 0 && (
              <ol className="mb-2 space-y-1">
                {steps.map((s, i) => (
                  <li
                    key={`${s}-${i}`}
                    className="flex items-start gap-2 rounded-xl bg-well px-3 py-2 text-sm"
                  >
                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-text-tertiary">
                      {i + 1}
                    </span>
                    <span className="flex-1">{s}</span>
                    <button
                      type="button"
                      onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 text-text-tertiary hover:text-red-400"
                    >
                      <Icon name="x" width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="mb-4 flex gap-2">
              <input
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStep();
                  }
                }}
                placeholder="Add a step…"
                className="min-w-0 flex-1 rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold text-sm outline-none focus:border-[color:var(--empire)]"
              />
              <button
                type="button"
                onClick={addStep}
                disabled={!stepDraft.trim()}
                className="rounded-lg border-2 border-border px-3 text-sm text-text-secondary hover:border-accent hover:text-text disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </>
        )}

        {type === 'milestone' && (
          <>
            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-sm text-text-secondary">Target</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-sm text-text-secondary">Unit</label>
                <input
                  className="w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="€"
                />
              </div>
            </div>
          </>
        )}

        {type === 'habit' && (
          <>
            <label className="mb-1 block text-sm text-text-secondary">How do you track it?</label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(
                [
                  { v: 'binary', l: 'Yes / no', h: 'Did it' },
                  { v: 'count', l: 'Count', h: 'e.g. 8 glasses' },
                  { v: 'duration', l: 'Minutes', h: 'e.g. 30 min' },
                ] as { v: TrackingMode; l: string; h: string }[]
              ).map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => {
                    setTrackingMode(t.v);
                    setDailyTarget(t.v === 'binary' ? '1' : t.v === 'duration' ? '30' : '8');
                  }}
                  className={`rounded-xl border-2 px-2 py-2 text-left transition-transform active:scale-95 ${
                    trackingMode === t.v
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                      : 'border-border text-text-secondary'
                  }`}
                >
                  <div className="text-xs font-extrabold">{t.l}</div>
                  <div className="text-[10px] leading-tight text-text-tertiary">{t.h}</div>
                </button>
              ))}
            </div>

            {trackingMode !== 'binary' && (
              <div className="mb-4 flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-text-secondary">
                    Daily target{trackingMode === 'duration' ? ' (minutes)' : ''}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
                  />
                </div>
                {trackingMode === 'count' && (
                  <div className="w-32">
                    <label className="mb-1 block text-sm text-text-secondary">Unit</label>
                    <input
                      value={unitLabel}
                      onChange={(e) => setUnitLabel(e.target.value)}
                      placeholder="glasses"
                      className="w-full rounded-xl border-2 border-border bg-white px-3 py-2.5 font-bold outline-none focus:border-[color:var(--empire)]"
                    />
                  </div>
                )}
              </div>
            )}

            <label className="mb-1 block text-sm text-text-secondary">How often?</label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(
                [
                  { v: 'daily', l: 'Every day' },
                  { v: 'weekly', l: 'Some days a week' },
                ] as { v: 'daily' | 'weekly'; l: string }[]
              ).map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setHabitCadence(c.v)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition-transform active:scale-95 ${
                    habitCadence === c.v
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                      : 'border-border text-text-secondary'
                  }`}
                >
                  {c.l}
                </button>
              ))}
            </div>

            {habitCadence === 'weekly' && (
              <>
                <label className="mb-1 block text-sm text-text-secondary">Times per week</label>
                <div className="mb-4 grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWeeklyTarget(String(n))}
                      className={`rounded-xl border-2 py-2 text-sm font-extrabold transition-transform active:scale-95 ${
                        Number(weeklyTarget) === n
                          ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="mb-1 block text-sm text-text-secondary">Difficulty</label>
            <div className="mb-4 grid grid-cols-4 gap-2">
              {(['trivial', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-xl border-2 px-2 py-2 text-xs font-extrabold capitalize transition-transform active:scale-95 ${
                    difficulty === d
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-text'
                      : 'border-border text-text-secondary'
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
          className="w-full btn3d py-3 font-heading text-base"
        >
          Create
        </button>
      </motion.form>
    </motion.div>
  );
}
