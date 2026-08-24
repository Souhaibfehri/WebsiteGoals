import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

/**
 * The core dopamine hit of the app (spec 2.6) — deliberately the one screen
 * that goes bigger than the calm dashboard: full accent-gradient, big type.
 */
export function LevelUpCelebration() {
  const queue = useAppStore((s) => s.levelUpQueue);
  const dismiss = useAppStore((s) => s.dismissLevelUp);
  const event = queue[0];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #d8622f, #e8a860)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismiss(event.id)}
        >
          <motion.div
            className="text-center text-[#0a0a0c]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <div className="uppercase tracking-[0.3em] text-sm font-medium opacity-80 mb-3">
              Level Up
            </div>
            <div className="font-heading font-extrabold text-6xl mb-2">{event.statName}</div>
            <div className="font-heading font-extrabold text-3xl">Level {event.newLevel}</div>
            <div className="mt-8 text-sm opacity-80">Tap anywhere to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
