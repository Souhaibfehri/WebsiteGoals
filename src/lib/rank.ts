/** Titles earned as the character level climbs — a name for where you are. */
export interface Rank {
  title: string;
  minLevel: number;
  color: string;
}

export const RANKS: Rank[] = [
  { title: 'Beginner', minLevel: 1, color: 'var(--text-secondary)' },
  { title: 'Builder', minLevel: 3, color: 'var(--body-ink)' },
  { title: 'Operator', minLevel: 6, color: 'var(--empire-ink)' },
  { title: 'Closer', minLevel: 10, color: 'var(--work-ink)' },
  { title: 'Founder', minLevel: 15, color: 'var(--reputation-ink)' },
  { title: 'Magnate', minLevel: 22, color: 'var(--content-ink)' },
  { title: 'Legend', minLevel: 30, color: 'var(--accent-ink)' },
];

export function rankFor(level: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) if (level >= r.minLevel) current = r;
  return current;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}
