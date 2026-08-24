import { motion } from 'framer-motion';

/** Spring-filled progress bar with a subtle shimmer sweep — used for XP and milestone bars. */
export function ProgressBar({ progress, height = 8 }: { progress: number; height?: number }) {
  const pct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      className="relative overflow-hidden rounded-full bg-black/30"
      style={{ height }}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-full bg-accent"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
        />
      </motion.div>
    </div>
  );
}
