import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { characterLevel } from '../../lib/derived';
import { Icon, type IconName } from '../common/Icon';

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

export function AppShell() {
  const stats = useAppStore((s) => s.stats);
  const wallet = useAppStore((s) => s.wallet);
  const level = characterLevel(stats);
  const coinBump = useBump(wallet.coins);

  return (
    <div className="min-h-svh pb-24 text-text">
      {/* Glass strip rather than a colour slab — the accent is worth more saved
          for the hero ring and level-up screen than spent on every scroll. */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg font-heading text-sm font-extrabold text-[#0a0a0c]"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}
            >
              L
            </span>
            <h1 className="font-heading text-lg font-extrabold tracking-tight">Life OS</h1>
          </div>

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
              <span className="font-heading text-xs font-bold tabular-nums">{wallet.coins}</span>
            </motion.span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-xl">
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
