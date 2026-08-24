import { motion, useReducedMotion } from 'framer-motion';

/** Spring-filled progress bar with a subtle shimmer sweep — used for XP and milestone bars. */
export function ProgressBar({
  progress,
  height = 12,
  color = 'var(--accent)',
}: {
  progress: number;
  height?: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative overflow-hidden rounded-full bg-border"
      style={{ height }}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-full"
        initial={false}
        style={{ background: color }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          animate={reduceMotion ? {} : { x: ['-120%', '220%'] }}
          transition={{ duration: 2.2, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
        />
      </motion.div>
    </div>
  );
}
