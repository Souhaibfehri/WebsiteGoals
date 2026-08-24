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

export type IconName =
  | 'coins'
  | 'building'
  | 'briefcase'
  | 'activity'
  | 'star'
  | 'video'
  | 'brain'
  | 'check'
  | 'flame'
  | 'plus'
  | 'x'
  | 'trash'
  | 'copy'
  | 'chevron'
  | 'pin'
  | 'arrow-right'
  | 'grid'
  | 'map';

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
    case 'building':
      return (
        <svg {...p}>
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-5h6v5" />
          <path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...p}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...p}>
          <polyline points="3 13 8 13 10 8 14 18 16 13 21 13" />
        </svg>
      );
    case 'star':
      return (
        <svg {...p}>
          <polygon points="12 3 14.8 9.1 21.5 9.8 16.5 14.3 17.9 20.9 12 17.5 6.1 20.9 7.5 14.3 2.5 9.8 9.2 9.1" />
        </svg>
      );
    case 'video':
      return (
        <svg {...p}>
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 10.5 22 7v10l-6-3.5" />
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
    case 'copy':
      return (
        <svg {...p}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...p}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...p}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...p}>
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'map':
      return (
        <svg {...p}>
          <polygon points="2 6 9 3 15 6 22 3 22 18 15 21 9 18 2 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      );
  }
}
