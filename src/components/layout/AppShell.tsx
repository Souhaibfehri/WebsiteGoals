import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { characterLevel } from '../../lib/derived';
import { Icon } from '../common/Icon';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/character', label: 'Character' },
];

export function AppShell() {
  const stats = useAppStore((s) => s.stats);
  const wallet = useAppStore((s) => s.wallet);
  const level = characterLevel(stats);

  return (
    <div className="min-h-svh bg-bg text-text">
      <header
        className="border-b border-border"
        style={{ background: 'linear-gradient(135deg, #d8622f, #e8a860)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-[#0a0a0c]">
            Life OS
          </h1>
          <div className="flex items-center gap-4 text-[#0a0a0c]">
            <div className="text-right">
              <div className="text-xs opacity-80">Character Level</div>
              <div className="font-heading font-extrabold text-xl leading-none">{level}</div>
            </div>
            <div className="flex items-center gap-1.5 bg-black/15 rounded-full px-3 py-1.5">
              <Icon name="coins" width={16} height={16} />
              <span className="font-heading font-bold">{wallet.coins}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-accent text-text'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
