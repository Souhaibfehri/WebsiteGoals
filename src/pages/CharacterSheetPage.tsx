import { useAppStore } from '../store/useAppStore';
import { StatBar } from '../components/character/StatBar';
import { decayInfoForStat } from '../lib/decay';
import { characterLevel, totalXp } from '../lib/derived';

export function CharacterSheetPage() {
  const stats = useAppStore((s) => s.stats);
  const goals = useAppStore((s) => s.goals);
  const streaks = useAppStore((s) => s.streaks);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5 text-center">
        <div className="text-text-secondary text-sm mb-1">Character Level</div>
        <div className="font-heading font-extrabold text-4xl text-accent">{characterLevel(stats)}</div>
        <div className="text-text-tertiary text-xs mt-1">{totalXp(stats).toLocaleString()} total XP</div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <StatBar key={stat.id} stat={stat} decay={decayInfoForStat(stat, goals, streaks)} />
        ))}
      </div>
    </div>
  );
}
