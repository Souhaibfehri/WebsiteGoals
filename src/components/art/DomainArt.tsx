import type { StatName } from '../../types';

/**
 * A small illustrated scene per domain, used on cards and empty states so the
 * app has pictures rather than only icons. Inline SVG because an artifact's CSP
 * blocks external image hosts, and vectors stay sharp at every size.
 */
export function DomainArt({ name, size = 72 }: { name: StatName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 96 96', 'aria-hidden': true } as const;

  switch (name) {
    case 'Wealth':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--wealth)" opacity="0.18" />
          <ellipse cx="48" cy="70" rx="26" ry="7" fill="var(--wealth-ink)" opacity="0.25" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <ellipse cx="48" cy={64 - i * 11} rx="24" ry="8" fill="var(--wealth)" />
              <ellipse cx="48" cy={61 - i * 11} rx="24" ry="8" fill="var(--content)" />
              <ellipse cx="48" cy={61 - i * 11} rx="14" ry="4.5" fill="var(--content-ink)" opacity="0.35" />
            </g>
          ))}
        </svg>
      );

    case 'Empire':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--empire)" opacity="0.18" />
          <rect x="18" y="44" width="22" height="34" rx="3" fill="var(--empire)" />
          <rect x="40" y="28" width="24" height="50" rx="3" fill="var(--empire-ink)" />
          <rect x="64" y="52" width="16" height="26" rx="3" fill="var(--empire)" />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={45 + c * 9}
                y={35 + r * 11}
                width="6"
                height="7"
                rx="1.5"
                fill="#fff"
                opacity="0.85"
              />
            ))
          )}
          <rect x="23" y="51" width="5" height="6" rx="1.5" fill="#fff" opacity="0.8" />
          <rect x="31" y="51" width="5" height="6" rx="1.5" fill="#fff" opacity="0.8" />
          <rect x="14" y="76" width="70" height="6" rx="3" fill="var(--empire-ink)" />
        </svg>
      );

    case 'Body':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--body)" opacity="0.18" />
          <rect x="30" y="41" width="36" height="14" rx="7" fill="var(--body)" />
          <rect x="16" y="32" width="14" height="32" rx="6" fill="var(--body-ink)" />
          <rect x="66" y="32" width="14" height="32" rx="6" fill="var(--body-ink)" />
          <rect x="9" y="38" width="9" height="20" rx="4" fill="var(--body)" />
          <rect x="78" y="38" width="9" height="20" rx="4" fill="var(--body)" />
        </svg>
      );

    case 'Reputation':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--reputation)" opacity="0.18" />
          <circle cx="48" cy="42" r="22" fill="var(--reputation)" />
          <circle cx="48" cy="42" r="16" fill="var(--reputation-ink)" opacity="0.35" />
          <path
            d="M48 30l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4-8.4-4.4-8.4 4.4 1.6-9.4-6.9-6.7 9.5-1.4z"
            fill="#fff"
          />
          <path d="M36 62l-6 22 18-9 18 9-6-22" fill="var(--reputation-ink)" />
        </svg>
      );

    case 'Content':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--content)" opacity="0.22" />
          <rect x="16" y="34" width="44" height="30" rx="6" fill="var(--content-ink)" />
          <path d="M60 46l18-10v28l-18-10z" fill="var(--content)" />
          <circle cx="30" cy="49" r="7" fill="var(--content)" />
          <circle cx="30" cy="49" r="3" fill="#fff" />
          <rect x="20" y="70" width="36" height="5" rx="2.5" fill="var(--content-ink)" opacity="0.4" />
        </svg>
      );

    case 'Work':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--work)" opacity="0.2" />
          <rect x="18" y="38" width="60" height="38" rx="7" fill="var(--work)" />
          <path
            d="M38 38v-5a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v5"
            stroke="var(--work-ink)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="18" y="52" width="60" height="7" fill="var(--work-ink)" opacity="0.35" />
          <rect x="42" y="49" width="12" height="12" rx="3" fill="#fff" />
        </svg>
      );

    case 'Mind':
      return (
        <svg {...common}>
          <circle cx="48" cy="48" r="40" fill="var(--mind)" opacity="0.2" />
          <path
            d="M44 22c-9 0-16 6-16 14-6 2-9 7-9 12s3 10 9 12c0 8 7 14 16 14h2V22h-2Z"
            fill="var(--mind)"
          />
          <path
            d="M52 22c9 0 16 6 16 14 6 2 9 7 9 12s-3 10-9 12c0 8-7 14-16 14h-2V22h2Z"
            fill="var(--mind-ink)"
          />
          <path
            d="M40 40h8M40 52h8M56 40h-8M56 52h-8"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      );
  }
}
