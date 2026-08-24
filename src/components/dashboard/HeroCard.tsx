import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Icon, type IconName } from '../common/Icon';
import { characterLevel, characterProgress } from '../../lib/derived';
import { levelFromXp } from '../../lib/xp';
import { STAT_SHORT, statColor } from '../../types';

/**
 * The dashboard's focal point: who you are right now, in one panel. Level ring,
 * today's completion, and a strip of every domain's level so the whole character
 * is legible before scrolling.
 */
export function HeroCard({
  doneToday,
  totalToday,
}: {
  doneToday: number;
  totalToday: number;
}) {
  const stats = useAppStore((s) => s.stats);
  const wallet = useAppStore((s) => s.wallet);

  const level = characterLevel(stats);
  const progress = characterProgress(stats);
  const dayPct = totalToday === 0 ? 0 : doneToday / totalToday;

  const size = 108;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <section className="card overflow-hidden">
      {/* Ambient wash keyed to the brand, kept behind everything at low alpha. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(420px 200px at 22% 0%, rgba(216,98,47,0.18), transparent 70%)',
        }}
      />

      <div className="relative flex items-center gap-5 px-5 py-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="url(#hero-ring)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={false}
              animate={{ strokeDashoffset: circ * (1 - progress) }}
              transition={{ type: 'spring', stiffness: 110, damping: 20 }}
            />
            <defs>
              <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-soft)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center leading-none">
              <div className="font-heading text-4xl font-extrabold tabular-nums">{level}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-text-secondary">
                Level
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            Character
          </div>
          <h2 className="font-heading text-xl font-extrabold leading-tight">Your sheet today</h2>

          <div className="mt-3 flex items-center gap-4">
            <div>
              <div className="font-heading text-lg font-bold tabular-nums">
                {doneToday}
                <span className="text-text-tertiary">/{totalToday}</span>
              </div>
              <div className="text-[10px] text-text-secondary">habits done</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="flex items-center gap-1 font-heading text-lg font-bold tabular-nums">
                <Icon name="coins" width={15} height={15} className="text-accent" />
                {wallet.coins}
              </div>
              <div className="text-[10px] text-text-secondary">coins</div>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))',
              }}
              initial={false}
              animate={{ width: `${dayPct * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Every domain at a glance — icon and level accompany the hue, so the
          colour is reinforcement rather than the only signal. */}
      <div className="relative border-t border-border">
        <div className="grid grid-cols-7">
          {stats.map((s) => {
            const lvl = levelFromXp(s.currentXp).level;
            const color = statColor(s.name);
            return (
              <div
                key={s.id}
                className="flex flex-col items-center gap-1 py-2.5"
                title={`${s.name} — level ${lvl}`}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
                >
                  <Icon name={s.icon as IconName} width={14} height={14} />
                </span>
                <span className="font-heading text-[13px] font-bold leading-none tabular-nums">
                  {lvl}
                </span>
                <span className="text-[8px] uppercase tracking-wide text-text-tertiary">
                  {STAT_SHORT[s.name]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
