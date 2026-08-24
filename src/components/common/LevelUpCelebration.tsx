import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Icon, type IconName } from './Icon';
import { STAT_ICON } from '../../types';
import { playLevelUpFanfare } from '../../lib/sound';

const CONFETTI_COLORS = ['#FF9600', '#FFC800', '#58CC02', '#1CB0F6', '#CE82FF'];

function burstConfetti() {
  confetti({
    particleCount: 90,
    spread: 80,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
    zIndex: 60,
  });
  confetti({
    particleCount: 50,
    spread: 120,
    startVelocity: 30,
    origin: { y: 0.5 },
    colors: CONFETTI_COLORS,
    zIndex: 60,
    scalar: 0.7,
  });
}

/**
 * The core dopamine hit of the app (spec 2.6) — deliberately the one screen
 * that goes bigger than the calm dashboard: full accent-gradient, big type,
 * confetti + a synthesized fanfare chime.
 */
export function LevelUpCelebration() {
  const queue = useAppStore((s) => s.levelUpQueue);
  const dismiss = useAppStore((s) => s.dismissLevelUp);
  const event = queue[0];

  useEffect(() => {
    if (!event) return;
    burstConfetti();
    playLevelUpFanfare();
  }, [event]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #FF9600 0%, #FFC800 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismiss(event.id)}
        >
          <motion.div
            className="absolute rounded-full bg-white/25 blur-3xl"
            style={{ width: 480, height: 480 }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          <motion.div
            className="relative text-center text-white"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <motion.div
              className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white text-[color:var(--accent-ink)] shadow-lg"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
            >
              <Icon name={STAT_ICON[event.statName] as IconName} width={44} height={44} strokeWidth={2.5} />
            </motion.div>

            <div className="mb-3 text-sm font-extrabold uppercase tracking-[0.3em] opacity-90">
              Level Up
            </div>
            <div className="mb-2 font-heading text-6xl font-extrabold drop-shadow">{event.statName}</div>
            <div className="font-heading text-3xl font-extrabold">Level {event.newLevel}</div>
            <div className="mt-8 text-sm font-bold opacity-90">Tap anywhere to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
