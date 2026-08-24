/**
 * The app's character. Drawn rather than fetched — an artifact's CSP blocks
 * external images, and a vector mascot stays crisp at any size and can be
 * re-coloured per mood without shipping new assets.
 */
export type Mood = 'happy' | 'cheer' | 'sleepy';

export function Mascot({ size = 96, mood = 'happy' }: { size?: number; mood?: Mood }) {
  const armUp = mood === 'cheer';
  const eyeY = mood === 'sleepy' ? 40 : 38;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {/* body */}
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity="0.07" />
      <path
        d="M60 18c19 0 32 13 32 32v22c0 19-13 32-32 32s-32-13-32-32V50c0-19 13-32 32-32Z"
        fill="var(--accent)"
      />
      <path
        d="M60 18c19 0 32 13 32 32v22c0 19-13 32-32 32V18Z"
        fill="#000"
        opacity="0.07"
      />
      {/* belly */}
      <ellipse cx="60" cy="74" rx="20" ry="18" fill="#fff" opacity="0.9" />

      {/* eyes */}
      <ellipse cx="48" cy={eyeY} rx="8" ry={mood === 'sleepy' ? 2 : 9} fill="#fff" />
      <ellipse cx="72" cy={eyeY} rx="8" ry={mood === 'sleepy' ? 2 : 9} fill="#fff" />
      {mood !== 'sleepy' && (
        <>
          <circle cx="49" cy={eyeY + 1} r="4" fill="#3c3c3c" />
          <circle cx="73" cy={eyeY + 1} r="4" fill="#3c3c3c" />
          <circle cx="50.5" cy={eyeY - 1} r="1.5" fill="#fff" />
          <circle cx="74.5" cy={eyeY - 1} r="1.5" fill="#fff" />
        </>
      )}

      {/* beak / smile */}
      <path
        d={
          mood === 'cheer'
            ? 'M52 52c3 6 13 6 16 0-2 8-14 8-16 0Z'
            : 'M53 51h14c0 5-4 8-7 8s-7-3-7-8Z'
        }
        fill="var(--content)"
        stroke="var(--content-ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* arms */}
      <path
        d={armUp ? 'M28 56 14 38' : 'M28 62 16 72'}
        stroke="var(--accent)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d={armUp ? 'M92 56 106 38' : 'M92 62 104 72'}
        stroke="var(--accent)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* feet */}
      <path d="M48 102v6M72 102v6" stroke="var(--content-ink)" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M40 110h16M64 110h16"
        stroke="var(--content)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
