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
  const levelBump = useBump(level);

  return (
    <div className="min-h-svh bg-bg text-text pb-24">
      <header
        className="border-b border-border shadow-[0_4px_24px_-8px_rgba(216,98,47,0.5)]"
        style={{ background: 'linear-gradient(135deg, #d8622f, #e8a860)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-[#0a0a0c]">
            Life OS
          </h1>
          <div className="flex items-center gap-3 text-[#0a0a0c]">
            <div className="text-right leading-none">
              <div className="text-[10px] uppercase tracking-widest opacity-75">Level</div>
              <motion.div
                className="font-heading font-extrabold text-xl"
                animate={levelBump ? { scale: 1.25 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              >
                {level}
              </motion.div>
            </div>
            <motion.div
              className="flex items-center gap-1.5 bg-black/15 rounded-full px-3 py-1.5"
              animate={coinBump ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <Icon name="coins" width={16} height={16} />
              <span className="font-heading font-bold tabular-nums">{wallet.coins}</span>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom bar: thumb-reachable, which matters for a one-tap-a-day app. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} width={20} height={20} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute bottom-0 h-0.5 w-10 rounded-full bg-accent"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
