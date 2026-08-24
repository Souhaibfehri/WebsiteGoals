import { useMemo, useRef, useState } from 'react';
import type { LedgerEntry } from '../../types';

const ACCENT = 'var(--accent)';
const W = 320;
const H = 132;
const PAD = { top: 10, right: 8, bottom: 20, left: 8 };

export interface BalancePoint {
  at: string;
  balance: number;
  delta: number;
}

function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

function fmt(v: number, unit: string | null): string {
  const n =
    Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k` : String(Math.round(v));
  if (!unit) return n;
  return unit.length <= 2 ? `${unit}${n}` : `${n} ${unit}`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Balance of a target over time. One series, so no legend — the heading names it.
 * Setbacks are marked by shape (a downward triangle), never by hue: the brand
 * accent and any credible "bad" red fail CVD separation against each other, so
 * colour cannot carry that distinction here.
 */
export function BalanceChart({
  entries,
  targetValue,
  unit,
}: {
  entries: LedgerEntry[];
  targetValue: number;
  unit: string | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo<BalancePoint[]>(() => {
    if (entries.length === 0) return [];
    const first = entries[0];
    return [
      { at: first.at, balance: 0, delta: 0 },
      ...entries.map((e) => ({ at: e.at, balance: e.balanceAfter, delta: e.delta })),
    ];
  }, [entries]);

  if (points.length < 2) {
    return (
      <div className="grid h-[132px] place-items-center rounded-xl border-2 border-dashed border-border">
        <p className="px-6 text-center text-xs font-bold text-text-secondary">
          Log your first amount and the balance curve appears here.
        </p>
      </div>
    );
  }

  const maxY = Math.max(targetValue, ...points.map((p) => p.balance));
  const ticks = niceTicks(maxY);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (plotW * i) / (points.length - 1);
  const y = (v: number) => PAD.top + plotH * (1 - v / (ticks.at(-1) || 1));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  const setbacks = points.map((p, i) => ({ p, i })).filter(({ p }) => p.delta < 0);
  const active = hover === null ? null : points[hover];

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.left) / plotW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, idx)));
  }

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          style={{ height: H }}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Balance over time, currently ${fmt(points.at(-1)!.balance, unit)} of ${fmt(targetValue, unit)}`}
        >
          <defs>
            <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Recessive gridlines + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
              />
              <text
                x={PAD.left}
                y={y(t) - 3}
                className="fill-current text-text-tertiary"
                style={{ fontSize: 8 }}
              >
                {fmt(t, unit)}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#balance-fill)" />
          <path
            d={line}
            fill="none"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Setbacks: distinguished by shape, with a surface ring so they read on the line. */}
          {setbacks.map(({ p, i }) => (
            <polygon
              key={i}
              points={`${x(i) - 4.5},${y(p.balance) - 5} ${x(i) + 4.5},${y(p.balance) - 5} ${x(i)},${y(p.balance) + 2.5}`}
              fill={ACCENT}
              stroke="#ffffff"
              strokeWidth="2"
              paintOrder="stroke"
            />
          ))}

          {active && (
            <g>
              <line
                x1={x(hover!)}
                x2={x(hover!)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="currentColor"
                className="text-text-tertiary"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hover!)}
                cy={y(active.balance)}
                r="4.5"
                fill={ACCENT}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          <text x={PAD.left} y={H - 6} className="fill-current text-text-tertiary" style={{ fontSize: 8 }}>
            {shortDate(points[0].at)}
          </text>
          <text
            x={W - PAD.right}
            y={H - 6}
            textAnchor="end"
            className="fill-current text-text-tertiary"
            style={{ fontSize: 8 }}
          >
            {shortDate(points.at(-1)!.at)}
          </text>
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border-2 border-border bg-white px-2.5 py-1.5 text-xs font-bold shadow-lg"
            style={{ left: `${(x(hover!) / W) * 100}%` }}
          >
            <div className="font-heading font-bold tabular-nums">{fmt(active.balance, unit)}</div>
            <div className="text-[10px] text-text-secondary">{shortDate(active.at)}</div>
            {active.delta !== 0 && (
              <div
                className="text-[10px] tabular-nums"
                style={{ color: active.delta < 0 ? 'var(--danger-ink)' : 'var(--success-ink)' }}
              >
                {active.delta < 0 ? '−' : '+'}
                {fmt(Math.abs(active.delta), unit)}
                {active.delta < 0 ? ' taken out' : ' added'}
              </div>
            )}
          </div>
        )}
      </div>
      {setbacks.length > 0 && (
        <figcaption className="mt-1 flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <svg width="9" height="8" aria-hidden="true">
            <polygon points="0,0 9,0 4.5,7.5" fill={ACCENT} />
          </svg>
          marks a withdrawal
        </figcaption>
      )}
    </figure>
  );
}
