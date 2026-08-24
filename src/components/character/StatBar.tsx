import { Icon, type IconName } from '../common/Icon';
import { levelFromXp } from '../../lib/xp';
import type { Stat } from '../../types';
import type { StatDecayInfo } from '../../lib/decay';

export function StatBar({ stat, decay }: { stat: Stat; decay: StatDecayInfo }) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelFromXp(decay.displayedXp);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-text">
          <Icon name={stat.icon as IconName} className="text-accent" />
          <span className="font-heading font-bold tracking-wide">{stat.name}</span>
        </div>
        <div className="text-right">
          <div className="font-heading font-extrabold text-lg leading-none">Lv {level}</div>
          {decay.isDecaying && (
            <div className="text-[11px] text-text-tertiary mt-0.5">decaying &darr;</div>
          )}
        </div>
      </div>
      <div className="h-2 rounded-full bg-black/30 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-text-secondary">
        {xpIntoLevel} / {xpForNextLevel} XP
      </div>
    </div>
  );
}
