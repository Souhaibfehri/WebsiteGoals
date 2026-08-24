import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { characterLevel } from '../../lib/derived';
import { levelFromXp } from '../../lib/xp';
import { Icon, type IconName } from '../common/Icon';
import { STAT_SHORT, statFill, statInk } from '../../types';

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'check' },
  { to: '/quests', label: 'Quests', icon: 'map' },
  { to: '/calendar', label: 'Streak', icon: 'flame' },
  { to: '/rewards', label: 'Rewards', icon: 'star' },
  { to: '/character', label: 'Stats', icon: 'grid' },
];

function useBump(value: number) {
  const [bumping, setBumping] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 320);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return bumping;
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-xl font-heading text-sm font-extrabold text-white"
        style={{ background: 'var(--accent)', borderBottom: '3px solid var(--accent-dark)' }}
      >
        L
      </span>
      <h1 className="font-heading text-lg font-extrabold tracking-tight">Life OS</h1>
    </div>
  );
}

function LevelCoins({
  level,
  coinBump,
  coins,
  streak,
}: {
  level: number;
  coinBump: boolean;
  coins: number;
  streak: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white"
        style={{ background: streak > 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        <Icon name="flame" width={14} height={14} />
        <span className="font-heading text-xs font-extrabold tabular-nums">{streak}</span>
      </span>
      <span className="hidden rounded-full border-2 border-border bg-white px-2.5 py-1 font-heading text-xs font-extrabold text-text-secondary tabular-nums sm:inline">
        Lv {level}
      </span>
      <motion.span
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ background: 'var(--content)', color: 'var(--content-ink)' }}
        animate={coinBump ? { scale: 1.12 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        <Icon name="coins" width={14} height={14} />
        <span className="font-heading text-xs font-extrabold tabular-nums">{coins}</span>
      </motion.span>
    </div>
  );
}

export function AppShell() {
  const stats = useAppStore((s) => s.stats);
  const wallet = useAppStore((s) => s.wallet);
  const level = characterLevel(stats);
  const coinBump = useBump(wallet.coins);
  const streakState = useAppStore((s) => s.streakState);

  return (
    <div className="min-h-svh text-text">
      {/* Desktop: a persistent rail, so navigation and the character summary are
          always in view rather than hidden behind a bottom bar built for thumbs. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r-2 border-border bg-well lg:flex">
        <div className="px-5 py-5">
          <Wordmark />
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[color:var(--accent)]/12 text-[color:var(--accent-ink)]'
                    : 'text-text-secondary hover:bg-black/[0.04] hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active"
                      className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-[color:var(--accent)]"
                    />
                  )}
                  <Icon name={item.icon} width={18} height={18} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t-2 border-border px-5 py-4">
          <div className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
            Domains
          </div>
          <ul className="space-y-1.5">
            {stats.map((s) => {
              const lvl = levelFromXp(s.currentXp).level;
              const fill = statFill(s.name);
              const ink = statInk(s.name);
              return (
                <li key={s.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded"
                    style={{ background: fill, color: '#fff' }}
                  >
                    <Icon name={s.icon as IconName} width={11} height={11} />
                  </span>
                  <span className="flex-1 font-bold" style={{ color: ink }}>{STAT_SHORT[s.name]}</span>
                  <span className="font-heading font-bold tabular-nums">{lvl}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b-2 border-border bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 lg:max-w-6xl lg:px-8">
            <div className="lg:hidden">
              <Wordmark />
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                Character sheet for your life
              </p>
            </div>
            <LevelCoins
              level={level}
              coinBump={coinBump}
              coins={wallet.coins}
              streak={streakState.current}
            />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 lg:max-w-6xl lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile only — the rail replaces it from lg up. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-white lg:hidden">
        <div className="mx-auto flex max-w-3xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-extrabold transition-colors ${
                  isActive ? 'text-[color:var(--accent-ink)]' : 'text-text-secondary hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 top-0 h-1 rounded-full bg-[color:var(--accent)]"
                    />
                  )}
                  <Icon name={item.icon} width={19} height={19} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
