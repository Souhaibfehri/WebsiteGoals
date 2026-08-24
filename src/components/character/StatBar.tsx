import { motion } from 'framer-motion';
import { Icon, type IconName } from '../common/Icon';
import { levelFromXp } from '../../lib/xp';
import { STAT_BLURB, statColor } from '../../types';
import type { Stat } from '../../types';
import type { StatDecayInfo } from '../../lib/decay';

export function StatBar({ stat, decay }: { stat: Stat; decay: StatDecayInfo }) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelFromXp(decay.displayedXp);
  const color = statColor(stat.name);

  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="card card-hover overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: color }}
      />
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={false}
              animate={{ strokeDashoffset: circ * (1 - progress) }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="grid h-8 w-8 place-items-center rounded-full"
              style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
            >
              <Icon name={stat.icon as IconName} width={16} height={16} />
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-[15px] font-bold tracking-wide">{stat.name}</span>
            <span className="shrink-0 font-heading text-lg font-extrabold tabular-nums">
              Lv {level}
            </span>
          </div>

          <p className="mb-2 mt-0.5 truncate text-[11px] leading-tight text-text-tertiary">
            {STAT_BLURB[stat.name]}
          </p>

          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={false}
              animate={{ width: `${Math.min(100, progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-text-secondary">
            <span className="tabular-nums">
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>
            {decay.isDecaying && <span className="text-text-tertiary">decaying &darr;</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
