import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ACHIEVEMENTS } from '../../lib/achievements';
import { Icon } from './Icon';

/** Full-screen moment for a streak milestone, or the quieter "a freeze saved it". */
export function StreakCelebration() {
  const hit = useAppStore((s) => s.streakHit);
  const dismiss = useAppStore((s) => s.dismissStreak);

  useEffect(() => {
    if (!hit || hit.saved) return;
    confetti({
      particleCount: 110,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: ['#FF9600', '#FFC800', '#FF4B4B'],
      zIndex: 60,
    });
  }, [hit]);

  return (
    <AnimatePresence>
      {hit && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-6"
          style={{
            background: hit.saved
              ? 'linear-gradient(160deg, #1CB0F6 0%, #6FD0FF 100%)'
              : 'linear-gradient(160deg, #FF9600 0%, #FF4B4B 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="text-center text-white"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <motion.div
              className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-white"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.12 }}
              style={{ color: hit.saved ? 'var(--empire-ink)' : 'var(--accent-ink)' }}
            >
              <Icon name={hit.saved ? 'star' : 'flame'} width={54} height={54} strokeWidth={2.5} />
            </motion.div>

            <div className="font-heading text-6xl font-extrabold tabular-nums drop-shadow">
              {hit.days}
            </div>
            <div className="mt-1 font-heading text-2xl font-extrabold">
              {hit.saved ? 'Streak saved!' : 'day streak!'}
            </div>
            <p className="mx-auto mt-3 max-w-xs text-sm font-bold opacity-95">
              {hit.saved
                ? 'A streak freeze covered your missed day.'
                : 'Keep showing up — this is how it compounds.'}
            </p>
            <div className="mt-8 text-sm font-bold opacity-90">Tap anywhere to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Badge unlocks queue behind everything else as a tappable card. */
export function AchievementToast() {
  const hit = useAppStore((s) => s.achievementHit);
  const dismiss = useAppStore((s) => s.dismissAchievement);

  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [hit, dismiss]);

  const def = hit ? ACHIEVEMENTS.find((a) => a.id === hit.ids[0]) : undefined;
  const extra = hit ? hit.ids.length - 1 : 0;

  return (
    <AnimatePresence>
      {hit && def && (
        <motion.div
          className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
        >
          <button
            onClick={dismiss}
            className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-white px-4 py-3 text-left"
            style={{ borderColor: def.color }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white"
              style={{ background: def.color }}
            >
              <Icon name={def.icon} width={22} height={22} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                Achievement unlocked
              </span>
              <span className="block font-heading text-sm font-extrabold">{def.title}</span>
              {extra > 0 && (
                <span className="block text-[11px] font-bold text-text-secondary">
                  +{extra} more unlocked
                </span>
              )}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
