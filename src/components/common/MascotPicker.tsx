import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { MASCOTS, Mascot, type MascotId } from '../art/Mascot';

/** Choosing the companion is the first thing that makes the app feel like yours. */
export function MascotPicker({ onDone }: { onDone?: () => void }) {
  const profile = useAppStore((s) => s.profile);
  const chooseMascot = useAppStore((s) => s.chooseMascot);

  return (
    <div className="grid grid-cols-3 gap-2">
      {MASCOTS.map((m) => {
        const selected = profile.mascot === m.id;
        return (
          <motion.button
            key={m.id}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await chooseMascot(m.id);
              onDone?.();
            }}
            aria-pressed={selected}
            className="rounded-2xl border-2 border-b-4 bg-white p-2 text-center"
            style={{ borderColor: selected ? 'var(--accent)' : 'var(--border)' }}
          >
            <Mascot id={m.id as MascotId} size={64} mood={selected ? 'cheer' : 'happy'} />
            <span
              className="mt-1 block text-[11px] font-extrabold"
              style={{ color: selected ? 'var(--accent-ink)' : 'var(--text-secondary)' }}
            >
              {m.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** First-run gate: pick a companion before the app opens. */
export function MascotOnboarding() {
  const profile = useAppStore((s) => s.profile);
  if (profile.onboarded) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-5"
      style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #FFFFFF 70%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-3xl font-extrabold">Pick your companion</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm font-bold text-text-secondary">
          They level up as you do. You can change this any time from Rewards.
        </p>
        <div className="mt-6">
          <MascotPicker />
        </div>
      </div>
    </motion.div>
  );
}
