import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { QuestCard } from '../components/quests/QuestCard';
import { DuplicateQuestModal } from '../components/quests/DuplicateQuestModal';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { Icon } from '../components/common/Icon';
import type { Goal, Track } from '../types';

export function QuestsPage() {
  const goals = useAppStore((s) => s.goals);
  const questSteps = useAppStore((s) => s.questSteps);
  const stats = useAppStore((s) => s.stats);
  const [duplicating, setDuplicating] = useState<Goal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [trackFilter, setTrackFilter] = useState<Track | 'All'>('All');
  const [showDone, setShowDone] = useState(false);

  const quests = useMemo(() => goals.filter((g) => g.type === 'quest'), [goals]);
  const stepsFor = (id: string) => questSteps.filter((s) => s.goalId === id);

  const isComplete = (g: Goal) => {
    const s = stepsFor(g.id);
    return s.length > 0 && s.every((x) => x.done);
  };

  const tracksPresent = useMemo(() => {
    const set = new Set<Track>();
    quests.forEach((q) => q.track && set.add(q.track));
    return Array.from(set);
  }, [quests]);

  const visible = quests
    .filter((q) => trackFilter === 'All' || q.track === trackFilter)
    .filter((q) => (showDone ? true : !isComplete(q)));

  const grouped = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const q of visible) {
      const key = q.track ?? 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    return Array.from(map.entries());
  }, [visible]);

  const completedCount = quests.filter(isComplete).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Quests</h2>
          <p className="text-sm font-bold text-text-secondary">
            {quests.length} campaigns · {completedCount} complete
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex shrink-0 items-center gap-1 btn3d px-4 py-2.5 text-sm"
        >
          <Icon name="plus" width={16} height={16} />
          New
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {(['All', ...tracksPresent] as (Track | 'All')[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrackFilter(t)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition-colors ${
                trackFilter === t
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/12 text-[color:var(--accent-ink)]'
                  : 'border-border text-text-secondary hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setShowDone((v) => !v)}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition-colors ${
              showDone ? 'border-[color:var(--success)] text-[color:var(--success-ink)]' : 'border-border text-text-secondary'
            }`}
          >
            {showDone ? 'Hiding nothing' : 'Hide completed'}
          </button>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-sm font-bold text-text-secondary">
            Nothing here yet. Start a campaign — a house, a market, a channel.
          </p>
        </div>
      )}

      {/* Sections tile two-up on desktop: most tracks hold one or two quests,
          so a per-track grid would leave half the row empty. */}
      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
      {grouped.map(([track, list]) => (
        <section key={track}>
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-text-tertiary">
            {track}
          </h3>
          <div className="space-y-2">
          {list.map((q) => (
            <QuestCard
              key={q.id}
              goal={q}
              steps={stepsFor(q.id)}
              stat={stats.find((s) => s.id === q.statId)}
              onDuplicate={setDuplicating}
            />
          ))}
          </div>
        </section>
      ))}
      </div>

      <AnimatePresence>
        {duplicating && (
          <DuplicateQuestModal goal={duplicating} onClose={() => setDuplicating(null)} />
        )}
        {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} initialType="quest" />}
      </AnimatePresence>
    </div>
  );
}
