/**
 * The app's companion. Drawn rather than fetched — an artifact's CSP blocks
 * external images, and a vector stays crisp at any size.
 *
 * Each animal shares one head/body construction and differs by ears, muzzle and
 * palette, so adding another is a small change rather than a new illustration.
 */
export type Mood = 'happy' | 'cheer' | 'sleepy';

export type MascotId = 'lion' | 'fox' | 'owl' | 'bear' | 'cat' | 'wolf';

export interface MascotOption {
  id: MascotId;
  name: string;
  coat: string;
  coatDark: string;
  belly: string;
  accent: string;
}

export const MASCOTS: MascotOption[] = [
  { id: 'lion', name: 'Lion cub', coat: '#F2A03D', coatDark: '#D97F1E', belly: '#FFE2B8', accent: '#8A4B12' },
  { id: 'fox', name: 'Fox', coat: '#F2743D', coatDark: '#D1541E', belly: '#FFEDE0', accent: '#7A2E0C' },
  { id: 'owl', name: 'Owl', coat: '#9B7BD4', coatDark: '#7A5CB0', belly: '#EDE4FB', accent: '#4A2F80' },
  { id: 'bear', name: 'Bear', coat: '#A9764F', coatDark: '#875A38', belly: '#F0DCC6', accent: '#5A3720' },
  { id: 'cat', name: 'Cat', coat: '#7EA8C4', coatDark: '#5E86A1', belly: '#E4F0F7', accent: '#33566B' },
  { id: 'wolf', name: 'Wolf', coat: '#9AA3AD', coatDark: '#79838E', belly: '#EDF1F5', accent: '#454E57' },
];

export function mascotById(id: MascotId): MascotOption {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0];
}

function Ears({ id, c, d }: { id: MascotId; c: string; d: string }) {
  switch (id) {
    case 'fox':
    case 'wolf':
    case 'cat':
      return (
        <>
          <path d="M34 34 26 10l20 12z" fill={c} />
          <path d="M86 34 94 10 74 22z" fill={c} />
          <path d="M35 31 31 18l11 7z" fill={d} />
          <path d="M85 31 89 18l-11 7z" fill={d} />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="32" cy="26" r="13" fill={c} />
          <circle cx="88" cy="26" r="13" fill={c} />
          <circle cx="32" cy="26" r="6" fill={d} />
          <circle cx="88" cy="26" r="6" fill={d} />
        </>
      );
    case 'owl':
      return (
        <>
          <path d="M32 30 30 12l16 10z" fill={c} />
          <path d="M88 30 90 12 74 22z" fill={c} />
        </>
      );
    case 'lion':
    default:
      return (
        <>
          <circle cx="33" cy="30" r="10" fill={c} />
          <circle cx="87" cy="30" r="10" fill={c} />
          <circle cx="33" cy="30" r="4.5" fill={d} />
          <circle cx="87" cy="30" r="4.5" fill={d} />
        </>
      );
  }
}

export function Mascot({
  size = 96,
  mood = 'happy',
  id = 'lion',
}: {
  size?: number;
  mood?: Mood;
  id?: MascotId;
}) {
  const m = mascotById(id);
  const eyeY = mood === 'sleepy' ? 58 : 56;
  const sleeping = mood === 'sleepy';

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="115" rx="30" ry="4" fill="#000" opacity="0.08" />

      {/* Lion keeps a mane; everything else reads from the ear shape alone. */}
      {id === 'lion' &&
        Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={60 + Math.cos(a) * 36}
              cy={58 + Math.sin(a) * 34}
              r="12"
              fill={m.coatDark}
            />
          );
        })}

      <Ears id={id} c={m.coat} d={m.coatDark} />

      {/* body */}
      <ellipse cx="60" cy="92" rx="26" ry="22" fill={m.coat} />
      <ellipse cx="60" cy="96" rx="16" ry="15" fill={m.belly} />

      {/* head */}
      <circle cx="60" cy="58" r="32" fill={m.coat} />
      <ellipse cx="60" cy="70" rx="19" ry="15" fill={m.belly} />

      {/* eyes */}
      {sleeping ? (
        <>
          <path d="M42 58q6 5 12 0" stroke={m.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M66 58q6 5 12 0" stroke={m.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {id === 'owl' && (
            <>
              <circle cx="48" cy={eyeY} r="13" fill={m.belly} />
              <circle cx="72" cy={eyeY} r="13" fill={m.belly} />
            </>
          )}
          <circle cx="48" cy={eyeY} r="6.5" fill="#2B2B2B" />
          <circle cx="72" cy={eyeY} r="6.5" fill="#2B2B2B" />
          <circle cx="50" cy={eyeY - 2} r="2.2" fill="#fff" />
          <circle cx="74" cy={eyeY - 2} r="2.2" fill="#fff" />
        </>
      )}

      {/* muzzle */}
      {id === 'owl' ? (
        <path d="M60 64l7 8-7 7-7-7z" fill="#F2B33D" />
      ) : (
        <>
          <ellipse cx="60" cy="69" rx="5.5" ry="4" fill={m.accent} />
          <path
            d={
              mood === 'cheer'
                ? 'M50 76q10 12 20 0'
                : 'M60 73v4M60 77q-5 4-9 0M60 77q5 4 9 0'
            }
            stroke={m.accent}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {/* whiskers give the small animals some life */}
      {(id === 'cat' || id === 'lion' || id === 'fox') && !sleeping && (
        <g stroke={m.accent} strokeWidth="2" strokeLinecap="round" opacity="0.5">
          <path d="M36 68h10M36 74h10M84 68H74M84 74H74" />
        </g>
      )}

      {/* arms: raised when celebrating */}
      <path
        d={mood === 'cheer' ? 'M36 86 20 68' : 'M36 90 24 98'}
        stroke={m.coat}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={mood === 'cheer' ? 'M84 86 100 68' : 'M84 90 96 98'}
        stroke={m.coat}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}
