import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { characterLevel } from '../../lib/derived';
import { levelFromXp } from '../../lib/xp';
import { Icon, type IconName } from '../common/Icon';
import { STAT_SHORT, statColor } from '../../types';

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'check' },
  { to: '/quests', label: 'Quests', icon: 'map' },
  { to: '/character', label: 'Character', icon: 'grid' },
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
        className="grid h-8 w-8 place-items-center rounded-lg font-heading text-sm font-extrabold text-[#0a0a0c]"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}
      >
        L
      </span>
      <h1 className="font-heading text-lg font-extrabold tracking-tight">Life OS</h1>
    </div>
  );
}

function LevelCoins({ level, coinBump, coins }: { level: number; coinBump: boolean; coins: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-heading text-xs font-bold tabular-nums">
        Lv {level}
      </span>
      <motion.span
        className="flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-accent"
        animate={coinBump ? { scale: 1.12 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        <Icon name="coins" width={14} height={14} />
        <span className="font-heading text-xs font-bold tabular-nums">{coins}</span>
      </motion.span>
    </div>
  );
}

export function AppShell() {
  const stats = useAppStore((s) => s.stats);
  const wallet = useAppStore((s) => s.wallet);
  const level = characterLevel(stats);
  const coinBump = useBump(wallet.coins);

  return (
    <div className="min-h-svh text-text">
      {/* Desktop: a persistent rail, so navigation and the character summary are
          always in view rather than hidden behind a bottom bar built for thumbs. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface/60 backdrop-blur-xl lg:flex">
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
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-white/[0.04] hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active"
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent"
                    />
                  )}
                  <Icon name={item.icon} width={18} height={18} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border px-5 py-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            Domains
          </div>
          <ul className="space-y-1.5">
            {stats.map((s) => {
              const lvl = levelFromXp(s.currentXp).level;
              const color = statColor(s.name);
              return (
                <li key={s.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded"
                    style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
                  >
                    <Icon name={s.icon as IconName} width={11} height={11} />
                  </span>
                  <span className="flex-1 text-text-secondary">{STAT_SHORT[s.name]}</span>
                  <span className="font-heading font-bold tabular-nums">{lvl}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 lg:max-w-6xl lg:px-8">
            <div className="lg:hidden">
              <Wordmark />
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                Character sheet for your life
              </p>
            </div>
            <LevelCoins level={level} coinBump={coinBump} coins={wallet.coins} />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 lg:max-w-6xl lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile only — the rail replaces it from lg up. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent"
                    />
                  )}
                  <Icon name={item.icon} width={20} height={20} />
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
