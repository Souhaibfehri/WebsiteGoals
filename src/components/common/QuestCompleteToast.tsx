import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from './Icon';

/** Quieter sibling of the level-up screen: a campaign finishing deserves a beat, not a takeover. */
export function QuestCompleteToast() {
  const questDone = useAppStore((s) => s.questDone);
  const dismiss = useAppStore((s) => s.dismissQuestDone);

  useEffect(() => {
    if (!questDone) return;
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [questDone, dismiss]);

  return (
    <AnimatePresence>
      {questDone && (
        <motion.div
          className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <button
            onClick={dismiss}
            className="flex items-center gap-3 rounded-full border border-accent/40 bg-surface px-5 py-3 text-left shadow-[0_12px_40px_-12px_rgba(216,98,47,0.6)]"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white">
              <Icon name="check" width={16} height={16} />
            </span>
            <span>
              <span className="block font-heading font-bold text-sm">Quest complete</span>
              <span className="block text-xs text-text-secondary">{questDone.title}</span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
