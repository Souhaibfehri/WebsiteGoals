import { motion } from 'framer-motion';
import { DomainArt } from '../art/DomainArt';
import { levelFromXp } from '../../lib/xp';
import { STAT_BLURB, statFill, statInk } from '../../types';
import type { Stat } from '../../types';
import type { StatDecayInfo } from '../../lib/decay';

export function StatBar({ stat, decay }: { stat: Stat; decay: StatDecayInfo }) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelFromXp(decay.displayedXp);
  const fill = statFill(stat.name);
  const ink = statInk(stat.name);

  return (
    <div className="rounded-2xl border-2 border-b-4 border-border bg-white p-4">
      <div className="flex items-center gap-3.5">
        <DomainArt name={stat.name} size={64} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-heading text-lg font-extrabold text-text">{stat.name}</h3>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white tabular-nums"
              style={{ background: fill }}
            >
              LV {level}
            </span>
          </div>

          <p className="mb-2 mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-text-secondary">
            {STAT_BLURB[stat.name]}
          </p>

          <div className="h-3 overflow-hidden rounded-full bg-border">
            <motion.div
              className="relative h-full rounded-full"
              style={{ background: fill }}
              initial={false}
              animate={{ width: `${Math.min(100, progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            >
              <span className="absolute inset-x-1 top-0.5 h-[3px] rounded-full bg-white/45" />
            </motion.div>
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
            <span className="tabular-nums" style={{ color: ink }}>
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>
            {decay.isDecaying && <span className="text-text-tertiary">resting &darr;</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
