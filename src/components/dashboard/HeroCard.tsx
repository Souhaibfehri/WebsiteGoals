import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Mascot } from '../art/Mascot';
import { Icon } from '../common/Icon';
import { characterLevel } from '../../lib/derived';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The screen's opener: the character reacting to how the day is going, with the
 * one number that matters (habits left) stated in words rather than a chart.
 */
export function HeroCard({
  doneToday,
  totalToday,
  bestStreak,
}: {
  doneToday: number;
  totalToday: number;
  bestStreak: number;
}) {
  const stats = useAppStore((s) => s.stats);
  const level = characterLevel(stats);
  const left = Math.max(0, totalToday - doneToday);
  const allDone = totalToday > 0 && left === 0;
  const pct = totalToday === 0 ? 0 : doneToday / totalToday;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-b-4 border-border p-5"
      style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #FFFFFF 60%)' }}
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="shrink-0"
          animate={allDone ? { rotate: [0, -6, 6, 0] } : { y: [0, -5, 0] }}
          transition={{ duration: allDone ? 0.9 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mascot size={96} mood={allDone ? 'cheer' : 'happy'} />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-secondary">{greeting()}!</p>
          <h2 className="font-heading text-2xl font-extrabold leading-tight text-text">
            {allDone
              ? 'All done today'
              : left === totalToday
                ? "Let's get started"
                : `${left} to go today`}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold text-white"
              style={{ background: bestStreak > 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Icon name="flame" width={15} height={15} />
              {bestStreak > 0 ? (
                <>
                  {bestStreak}
                  <span className="font-bold opacity-90">day streak</span>
                </>
              ) : (
                <span className="font-bold">Start a streak</span>
              )}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-extrabold text-white"
              style={{ background: 'var(--empire)' }}
            >
              Level {level}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-text-secondary">
          <span>Daily goal</span>
          <span className="tabular-nums">
            {doneToday}/{totalToday}
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-border">
          <motion.div
            className="relative h-full rounded-full"
            style={{ background: allDone ? 'var(--success)' : 'var(--accent)' }}
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            {/* The glossy cap that makes the bar read as a filled tube. */}
            <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-white/45" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
