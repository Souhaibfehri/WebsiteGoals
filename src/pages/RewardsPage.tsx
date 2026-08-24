import { motion } from 'framer-motion';
import { useAppStore, STREAK_FREEZE_COST } from '../store/useAppStore';
import { Icon } from '../components/common/Icon';
import { ACHIEVEMENTS, type AchievementSnapshot } from '../lib/achievements';
import { characterLevel } from '../lib/derived';
import { rankFor, nextRank, RANKS } from '../lib/rank';

export function RewardsPage() {
  const stats = useAppStore((s) => s.stats);
  const goals = useAppStore((s) => s.goals);
  const questSteps = useAppStore((s) => s.questSteps);
  const checkpoints = useAppStore((s) => s.checkpoints);
  const streaks = useAppStore((s) => s.streaks);
  const dayRecords = useAppStore((s) => s.dayRecords);
  const streakState = useAppStore((s) => s.streakState);
  const achievements = useAppStore((s) => s.achievements);
  const wallet = useAppStore((s) => s.wallet);
  const buyStreakFreeze = useAppStore((s) => s.buyStreakFreeze);

  const level = characterLevel(stats);
  const rank = rankFor(level);
  const upcoming = nextRank(level);

  // Cheap to derive and it must track every store change, so no memo.
  const snapshot: AchievementSnapshot = {
    totalXp: stats.reduce((sum, s) => sum + s.currentXp, 0),
    characterLevel: level,
    currentStreak: streakState.current,
    bestStreak: streakState.best,
    habitCompletions: streaks.length,
    questStepsDone: questSteps.filter((q) => q.done).length,
    questsCompleted: goals.filter((g) => {
      if (g.type !== 'quest') return false;
      const steps = questSteps.filter((q) => q.goalId === g.id);
      return steps.length > 0 && steps.every((q) => q.done);
    }).length,
    milestonesBanked: checkpoints.filter((c) => c.reached).length,
    totalBanked: goals
      .filter((g) => g.type === 'milestone')
      .reduce((sum, g) => sum + g.currentValue, 0),
    countriesStarted: new Set(
      goals.filter((g) => g.type === 'quest' && g.location).map((g) => g.location)
    ).size,
    daysActive: dayRecords.length,
  };

  const owned = new Set(achievements.map((a) => a.achievementId));
  const unlockedCount = ACHIEVEMENTS.filter((a) => owned.has(a.id)).length;
  const canAfford = wallet.coins >= STREAK_FREEZE_COST;

  return (
    <div className="space-y-5">
      <section
        className="rounded-2xl border-2 border-b-4 border-border p-5"
        style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #FFFFFF 60%)' }}
      >
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
          Current rank
        </div>
        <h2 className="font-heading text-3xl font-extrabold" style={{ color: rank.color }}>
          {rank.title}
        </h2>
        <p className="mt-1 text-sm font-bold text-text-secondary">
          {upcoming
            ? `Level ${upcoming.minLevel} unlocks ${upcoming.title}`
            : 'Top rank reached.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {RANKS.map((r) => (
            <span
              key={r.title}
              className="rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold"
              style={{
                borderColor: level >= r.minLevel ? r.color : 'var(--border)',
                color: level >= r.minLevel ? r.color : 'var(--text-tertiary)',
              }}
            >
              {r.title}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-heading text-xl font-extrabold">Shop</h2>
        <p className="mb-3 text-xs font-bold text-text-secondary">
          Coins come from XP — roughly one per ten earned.
        </p>

        <div className="rounded-2xl border-2 border-b-4 border-border bg-white p-4">
          <div className="flex items-center gap-3.5">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white"
              style={{ background: 'var(--empire)' }}
            >
              <Icon name="star" width={26} height={26} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-base font-extrabold">Streak Freeze</h3>
              <p className="text-xs font-bold text-text-secondary">
                Covers one missed day automatically. You hold {streakState.freezes}.
              </p>
            </div>
            <button
              onClick={buyStreakFreeze}
              disabled={!canAfford}
              className="btn3d shrink-0 px-4 py-2.5 text-sm"
              style={
                {
                  '--btn-face': 'var(--empire)',
                  '--btn-lip': 'var(--empire-ink)',
                } as React.CSSProperties
              }
            >
              {STREAK_FREEZE_COST} 🪙
            </button>
          </div>
          {!canAfford && (
            <p className="mt-2 text-[11px] font-bold text-text-tertiary">
              You have {wallet.coins} — earn {STREAK_FREEZE_COST - wallet.coins} more.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-extrabold">Achievements</h2>
          <span className="text-sm font-extrabold text-text-secondary tabular-nums">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const isOwned = owned.has(a.id);
            const { have, need } = a.progress(snapshot);
            const pct = Math.min(1, have / need);

            return (
              <motion.div
                key={a.id}
                whileHover={{ y: -2 }}
                className="rounded-2xl border-2 border-b-4 border-border bg-white p-3 text-center"
                style={{ opacity: isOwned ? 1 : 0.85 }}
              >
                <span
                  className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full"
                  style={{
                    background: isOwned ? a.color : 'var(--border)',
                    color: isOwned ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  <Icon name={a.icon} width={22} height={22} strokeWidth={2.5} />
                </span>
                <h3 className="font-heading text-sm font-extrabold leading-tight">{a.title}</h3>
                <p className="mt-0.5 text-[11px] font-bold leading-snug text-text-secondary">
                  {a.description}
                </p>

                {isOwned ? (
                  <span
                    className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                    style={{ background: 'var(--success)' }}
                  >
                    UNLOCKED
                  </span>
                ) : (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct * 100}%`, background: a.color }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] font-extrabold text-text-tertiary tabular-nums">
                      {Math.min(have, need).toLocaleString()} / {need.toLocaleString()}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
