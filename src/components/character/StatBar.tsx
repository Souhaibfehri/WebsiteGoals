import { motion } from 'framer-motion';
import { Icon, type IconName } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';
import { RadialProgress } from '../common/RadialProgress';
import { levelFromXp } from '../../lib/xp';
import type { Stat } from '../../types';
import type { StatDecayInfo } from '../../lib/decay';

export function StatBar({ stat, decay }: { stat: Stat; decay: StatDecayInfo }) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelFromXp(decay.displayedXp);

  return (
    <motion.div
      className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div className="flex items-center gap-3">
        <RadialProgress progress={progress} size={52} strokeWidth={4}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon name={stat.icon as IconName} width={18} height={18} />
          </div>
        </RadialProgress>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-heading font-bold tracking-wide">{stat.name}</span>
            <div className="text-right">
              <span className="font-heading font-extrabold text-lg leading-none">Lv {level}</span>
              {decay.isDecaying && (
                <div className="text-[11px] text-text-tertiary mt-0.5">decaying &darr;</div>
              )}
            </div>
          </div>
          <ProgressBar progress={progress} />
          <div className="mt-1 text-xs text-text-secondary">
            {xpIntoLevel} / {xpForNextLevel} XP
          </div>
        </div>
      </div>
    </motion.div>
  );
}
