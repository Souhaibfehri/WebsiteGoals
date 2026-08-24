import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { WeekStrip } from '../components/calendar/WeekStrip';
import { Icon } from '../components/common/Icon';
import { toIsoDate, todayIso } from '../lib/date';
import type { DayRecord } from '../types';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Completion fraction -> fill. One hue, light to solid: a sequential ramp. */
function cellStyle(r: DayRecord | undefined, isToday: boolean) {
  if (!r || r.total === 0 || (r.completed === 0 && !r.frozen)) {
    return { background: '#fff', borderColor: isToday ? 'var(--accent)' : 'var(--border)' };
  }
  if (r.frozen) {
    return { background: 'var(--empire)', borderColor: 'var(--empire)' };
  }
  const ratio = Math.min(1, r.completed / Math.max(1, r.total));
  if (r.goalMet) return { background: 'var(--success)', borderColor: 'var(--success)' };
  return {
    background: `color-mix(in srgb, var(--accent) ${Math.round(18 + ratio * 55)}%, #fff)`,
    borderColor: isToday ? 'var(--accent)' : 'var(--border)',
  };
}

export function CalendarPage() {
  const dayRecords = useAppStore((s) => s.dayRecords);
  const streakState = useAppStore((s) => s.streakState);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const view = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = (first.getDay() === 0 ? 7 : first.getDay()) - 1;

    const out: ({ iso: string; day: number } | null)[] = Array(lead).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      out.push({ iso: toIsoDate(new Date(year, month, day)), day });
    }
    return out;
  }, [view]);

  const monthRecords = dayRecords.filter((r) => r.date.startsWith(toIsoDate(view).slice(0, 7)));
  const perfectDays = monthRecords.filter((r) => r.goalMet).length;
  const activeDays = monthRecords.filter((r) => r.completed > 0).length;
  const monthXp = monthRecords.reduce((sum, r) => sum + r.xpEarned, 0);

  const selectedRecord = selected ? dayRecords.find((r) => r.date === selected) : undefined;

  return (
    <div className="space-y-5">
      <section
        className="rounded-2xl border-2 border-b-4 border-border p-5"
        style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #FFFFFF 60%)' }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Icon name="flame" width={28} height={28} strokeWidth={2.5} />
          </span>
          <div>
            <div className="font-heading text-3xl font-extrabold leading-none tabular-nums">
              {streakState.current}
            </div>
            <div className="text-sm font-bold text-text-secondary">
              day streak · best {streakState.best}
            </div>
          </div>
          {streakState.freezes > 0 && (
            <span
              className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold text-white"
              style={{ background: 'var(--empire)' }}
            >
              <Icon name="star" width={13} height={13} />
              {streakState.freezes} freeze{streakState.freezes > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <WeekStrip records={dayRecords} />
      </section>

      <section className="rounded-2xl border-2 border-b-4 border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((m) => m - 1)}
            aria-label="Previous month"
            className="press grid h-9 w-9 place-items-center rounded-xl border-2 border-border"
          >
            <Icon name="chevron" width={18} height={18} className="rotate-90" strokeWidth={3} />
          </button>
          <h2 className="font-heading text-lg font-extrabold">
            {view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
            disabled={monthOffset >= 0}
            aria-label="Next month"
            className="press grid h-9 w-9 place-items-center rounded-xl border-2 border-border disabled:opacity-30"
          >
            <Icon name="chevron" width={18} height={18} className="-rotate-90" strokeWidth={3} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1.5">
          {DOW.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-extrabold text-text-tertiary">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) =>
            c === null ? (
              <div key={`pad-${i}`} />
            ) : (
              <motion.button
                key={c.iso}
                onClick={() => setSelected(selected === c.iso ? null : c.iso)}
                whileTap={{ scale: 0.92 }}
                className="aspect-square rounded-xl border-2 text-xs font-extrabold tabular-nums"
                style={{
                  ...cellStyle(
                    dayRecords.find((r) => r.date === c.iso),
                    c.iso === todayIso()
                  ),
                  color: dayRecords.find((r) => r.date === c.iso)?.goalMet ? '#fff' : 'var(--text)',
                  outline: selected === c.iso ? '3px solid var(--accent-ink)' : undefined,
                }}
              >
                {c.day}
              </motion.button>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{ background: 'var(--success)' }}
            />
            goal met
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{ background: 'color-mix(in srgb, var(--accent) 45%, #fff)' }}
            />
            partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ background: 'var(--empire)' }} />
            freeze used
          </span>
        </div>
      </section>

      {selectedRecord ? (
        <section className="rounded-2xl border-2 border-b-4 border-border bg-white p-4">
          <h3 className="font-heading text-base font-extrabold">
            {new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h3>
          <div className="mt-2 flex gap-4 text-sm font-bold text-text-secondary">
            <span className="tabular-nums">
              {selectedRecord.completed}/{selectedRecord.total} habits
            </span>
            <span className="tabular-nums">{selectedRecord.xpEarned} XP</span>
            {selectedRecord.frozen && (
              <span style={{ color: 'var(--empire-ink)' }}>freeze used</span>
            )}
          </div>
        </section>
      ) : (
        selected && (
          <section className="rounded-2xl border-2 border-dashed border-border p-4 text-center text-sm font-bold text-text-secondary">
            Nothing logged that day.
          </section>
        )
      )}

      <section className="grid grid-cols-3 gap-2">
        {[
          { label: 'Perfect days', value: perfectDays },
          { label: 'Active days', value: activeDays },
          { label: 'XP this month', value: monthXp },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border-2 border-b-4 border-border bg-white p-3">
            <div className="font-heading text-xl font-extrabold tabular-nums">{s.value}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
              {s.label}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
