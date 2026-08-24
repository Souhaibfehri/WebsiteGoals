import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatBar } from '../components/character/StatBar';
import { RadialProgress } from '../components/common/RadialProgress';
import { decayInfoForStat } from '../lib/decay';
import { characterLevel, characterProgress, totalXp } from '../lib/derived';

export function CharacterSheetPage() {
  const stats = useAppStore((s) => s.stats);
  const goals = useAppStore((s) => s.goals);
  const streaks = useAppStore((s) => s.streaks);
  const questSteps = useAppStore((s) => s.questSteps);
  const resetAll = useAppStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  const habitsDone = streaks.length;
  const stepsDone = questSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden p-6 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(360px 180px at 50% 0%, rgba(216,98,47,0.2), transparent 70%)',
          }}
        />
        <div className="relative">
        <RadialProgress progress={characterProgress(stats)} size={104} strokeWidth={5}>
          <div className="text-center">
            <div className="font-heading text-4xl font-extrabold leading-none text-accent tabular-nums">
              {characterLevel(stats)}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-text-secondary">
              Level
            </div>
          </div>
        </RadialProgress>
        </div>
        <div className="relative mt-4 flex justify-center gap-6 text-xs text-text-secondary">
          <span>
            <span className="block font-heading text-base font-bold text-text tabular-nums">
              {totalXp(stats).toLocaleString()}
            </span>
            total XP
          </span>
          <span>
            <span className="block font-heading text-base font-bold text-text tabular-nums">
              {stepsDone}
            </span>
            steps done
          </span>
          <span>
            <span className="block font-heading text-base font-bold text-text tabular-nums">
              {habitsDone}
            </span>
            habits tracked
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <StatBar key={stat.id} stat={stat} decay={decayInfoForStat(stat, goals, streaks)} />
        ))}
      </div>

      <div className="pt-2 text-center">
        {confirmReset ? (
          <div className="space-y-2">
            <p className="text-xs text-text-secondary">
              This wipes all progress and restores the starter goals.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={async () => {
                  await resetAll();
                  setConfirmReset(false);
                }}
                className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-medium text-red-400"
              >
                Reset everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
