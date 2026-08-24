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
      <div className="relative overflow-hidden rounded-2xl border-2 border-b-4 border-border p-6" style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #FFFFFF 60%)' }}>
        {/* Stacked on a phone, a single row once there is width to fill —
            otherwise the ring strands itself against an empty half-card. */}
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
          <RadialProgress progress={characterProgress(stats)} size={104} strokeWidth={5}>
            <div className="text-center">
              <div className="font-heading text-4xl font-extrabold leading-none text-[color:var(--accent-ink)] tabular-nums">
                {characterLevel(stats)}
              </div>
              <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">
                Level
              </div>
            </div>
          </RadialProgress>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-heading text-2xl font-extrabold">Character sheet</h2>
            <p className="mt-0.5 text-sm font-bold text-text-secondary">
              Every goal you finish feeds one of these seven.
            </p>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-text-secondary sm:max-w-md">
              {[
                { v: totalXp(stats).toLocaleString(), l: 'total XP' },
                { v: String(stepsDone), l: 'steps done' },
                { v: String(habitsDone), l: 'habits tracked' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border-2 border-border bg-white px-3 py-2">
                  <dt className="sr-only">{s.l}</dt>
                  <dd>
                    <span className="block font-heading text-lg font-extrabold text-text tabular-nums">
                      {s.v}
                    </span>
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {stats.map((stat) => (
          <StatBar key={stat.id} stat={stat} decay={decayInfoForStat(stat, goals, streaks)} />
        ))}
      </div>

      <div className="pt-2 text-center">
        {confirmReset ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-secondary">
              This wipes all progress and restores the starter goals.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={async () => {
                  await resetAll();
                  setConfirmReset(false);
                }}
                className="rounded-xl border-2 border-[color:var(--danger)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--danger-ink)]"
              >
                Reset everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-xl border-2 border-border px-3 py-1.5 text-xs font-bold text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs font-bold text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
