import { useAppStore } from '../store/useAppStore';
import { StatBar } from '../components/character/StatBar';
import { RadialProgress } from '../components/common/RadialProgress';
import { decayInfoForStat } from '../lib/decay';
import { characterLevel, characterProgress, totalXp } from '../lib/derived';

export function CharacterSheetPage() {
  const stats = useAppStore((s) => s.stats);
  const goals = useAppStore((s) => s.goals);
  const streaks = useAppStore((s) => s.streaks);

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border border-border p-6 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(216,98,47,0.16), rgba(232,168,96,0.08))' }}
      >
        <RadialProgress progress={characterProgress(stats)} size={104} strokeWidth={5}>
          <div className="text-center">
            <div className="font-heading font-extrabold text-4xl text-accent leading-none">
              {characterLevel(stats)}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-0.5">Level</div>
          </div>
        </RadialProgress>
        <div className="text-text-tertiary text-xs mt-3">{totalXp(stats).toLocaleString()} total XP</div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <StatBar key={stat.id} stat={stat} decay={decayInfoForStat(stat, goals, streaks)} />
        ))}
      </div>
    </div>
  );
}
