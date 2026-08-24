import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from './Icon';

/**
 * Banking a milestone inside a target is worth a beat of its own. Losing one to
 * a withdrawal gets the same beat stated plainly — informative, not shaming, per
 * the no-punishment-spirals rule.
 */
export function CheckpointToast() {
  const hit = useAppStore((s) => s.checkpointHit);
  const dismiss = useAppStore((s) => s.dismissCheckpoint);

  useEffect(() => {
    if (!hit) return;
    if (!hit.lost) {
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 35,
        origin: { y: 0.7 },
        colors: ['#d8622f', '#e8a860', '#f2f2f4'],
        zIndex: 60,
      });
    }
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, [hit, dismiss]);

  return (
    <AnimatePresence>
      {hit && (
        <motion.div
          className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <button
            onClick={dismiss}
            className={`flex items-center gap-3 rounded-full border-2 bg-white px-5 py-3 text-left ${
              hit.lost
                ? 'border-border'
                : 'border-[color:var(--accent)] shadow-[0_12px_30px_-12px_rgba(255,150,0,0.7)]'
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                hit.lost ? 'bg-border text-text-secondary' : 'bg-[color:var(--accent)] text-white'
              }`}
            >
              <Icon name={hit.lost ? 'arrow-right' : 'star'} width={18} height={18} />
            </span>
            <span>
              <span className="block font-heading text-sm font-bold">
                {hit.lost ? `${hit.label} milestone reopened` : `Milestone banked — ${hit.label}`}
              </span>
              <span className="block text-xs font-bold text-text-secondary">{hit.goalTitle}</span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
