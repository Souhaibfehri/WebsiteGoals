/**
 * Compact single-series trend for a KPI tile. One series, so no legend — the
 * tile's own label names it. No axes: the tile carries the number, the spark
 * carries the shape.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = 'var(--accent)',
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${points.at(-1)![0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
  const gradId = 'spark-grad';
  const [lastX, lastY] = points.at(-1)!;

  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Emphasised endpoint — where the series is now is the point of a spark. */}
      <circle cx={lastX} cy={lastY} r="2.75" fill={stroke} />
    </svg>
  );
}
