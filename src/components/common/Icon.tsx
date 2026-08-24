// Minimal line-icon set — consistent stroke weight, no illustration/avatar
// style per spec Section 11 ("icons over illustrations").
import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export type IconName = 'coins' | 'activity' | 'briefcase' | 'target' | 'brain' | 'check' | 'flame' | 'plus' | 'x' | 'trash';

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const p = { ...base, ...props };
  switch (name) {
    case 'coins':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="6" />
          <path d="M14.5 9a6 6 0 1 1 0 10 6 6 0 0 1 0-10Z" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...p}>
          <polyline points="3 13 8 13 10 8 14 18 16 13 21 13" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...p}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'target':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.5" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...p}>
          <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5h1a3 3 0 0 0 3-3V7a3 3 0 0 0-1-3Z" />
          <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5h-1a3 3 0 0 1-3-3V7a3 3 0 0 1 1-3Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...p}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...p}>
          <path d="M12 2s-6 6-6 12a6 6 0 0 0 12 0c0-2-1-3-1-3s-1 2-2.5 2c1-3-2-5-2.5-8 0 3-3 4-3 7" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'x':
      return (
        <svg {...p}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...p}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
  }
}
