import { motion } from 'framer-motion';
import { checkpointPosition } from '../../lib/target';
import type { Checkpoint } from '../../types';

/**
 * The target's progress bar with its milestone ladder drawn on it, so the next
 * threshold is visible rather than implied — the difference between "€38k of
 * €100k" and "€12k from the halfway mark".
 */
export function CheckpointMeter({
  currentValue,
  targetValue,
  checkpoints,
}: {
  currentValue: number;
  targetValue: number;
  checkpoints: Checkpoint[];
}) {
  const progress = targetValue > 0 ? Math.min(1, currentValue / targetValue) : 0;

  return (
    <div className="pb-5 pt-1">
      <div className="relative h-3.5 rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={false}
          style={{ background: 'var(--accent)' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {checkpoints.map((cp) => {
          const pos = checkpointPosition(cp.value, targetValue);
          return (
            <div
              key={cp.id}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos * 100}%` }}
            >
              <div
                className={`h-4 w-1 rounded-full ${
                  cp.reached ? 'bg-[color:var(--accent-ink)]' : 'bg-text-tertiary'
                }`}
                style={{ boxShadow: '0 0 0 2px #fff' }}
              />
              <span
                className={`absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums ${
                  cp.reached ? 'font-extrabold text-text' : 'font-bold text-text-tertiary'
                }`}
              >
                {cp.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
