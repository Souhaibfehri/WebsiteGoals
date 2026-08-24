import { Sparkline } from '../charts/Sparkline';

/**
 * A headline number with its recent shape. The number is the point; the spark
 * is supporting — so the value gets the display face and the trend stays small.
 */
export function StatTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">{label}</div>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-heading text-xl font-extrabold leading-none tabular-nums">{value}</div>
          {sub && <div className="mt-1 truncate text-[10px] text-text-secondary">{sub}</div>}
        </div>
        {trend && trend.length > 1 && (
          <div className="shrink-0">
            <Sparkline values={trend} width={56} height={22} />
          </div>
        )}
      </div>
    </div>
  );
}
