import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { toIsoDate, todayIso } from '../../lib/date';
import type { DayRecord } from '../../types';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The current week as seven dots — the at-a-glance "am I keeping this up". */
export function WeekStrip({ records }: { records: DayRecord[] }) {
  const today = new Date();
  const dow = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1..Sun=7
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow - 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toIsoDate(d);
    return { iso, record: records.find((r) => r.date === iso), isToday: iso === todayIso() };
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d, i) => {
        const done = d.record?.goalMet;
        const partial = !done && (d.record?.completed ?? 0) > 0;
        const frozen = d.record?.frozen;

        return (
          <div key={d.iso} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-extrabold text-text-tertiary">{LETTERS[i]}</span>
            <motion.span
              className="grid h-9 w-9 place-items-center rounded-full border-2"
              style={{
                background: done
                  ? 'var(--success)'
                  : frozen
                    ? 'var(--empire)'
                    : partial
                      ? 'color-mix(in srgb, var(--accent) 25%, #fff)'
                      : '#fff',
                borderColor: d.isToday
                  ? 'var(--accent)'
                  : done
                    ? 'var(--success)'
                    : frozen
                      ? 'var(--empire)'
                      : 'var(--border)',
              }}
              initial={false}
              animate={done ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              {done ? (
                <Icon name="check" width={16} height={16} strokeWidth={4} className="text-white" />
              ) : frozen ? (
                <Icon name="star" width={14} height={14} className="text-white" />
              ) : (
                <span className="text-[11px] font-extrabold text-text-tertiary tabular-nums">
                  {Number(d.iso.slice(-2))}
                </span>
              )}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
