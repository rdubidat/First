// Leon — the golden-retriever mascot. A single SVG with a few moods so he can
// react to what you're doing: cheering you on, focusing during a Pomodoro, or
// napping on a break.
//
// moods: 'happy' | 'excited' | 'focus' | 'sleep'
export default function Leon({ mood = 'happy', size = 72, className = '' }) {
  const sleeping = mood === 'sleep'
  const excited = mood === 'excited'
  const focus = mood === 'focus'

  const fur = '#e39b4c' // leon-400
  const furDark = '#c06322' // leon-600
  const muzzle = '#faecd8' // leon-100
  const nose = '#2f2823' // bark-800
  const tongue = '#f08a98'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`Leon the dog (${mood})`}
    >
      {/* ears */}
      <g className={excited ? 'origin-center animate-wag' : ''} style={{ transformOrigin: '60px 55px' }}>
        <path d="M28 38c-12 2-18 18-12 34 4 11 14 12 20 6L28 38Z" fill={furDark} />
        <path d="M92 38c12 2 18 18 12 34-4 11-14 12-20 6L92 38Z" fill={furDark} />
      </g>

      {/* head */}
      <ellipse cx="60" cy="62" rx="34" ry="32" fill={fur} />
      {/* cheeks / muzzle */}
      <ellipse cx="60" cy="78" rx="22" ry="18" fill={muzzle} />

      {/* eyebrows when focused */}
      {focus && (
        <g stroke={furDark} strokeWidth="3.5" strokeLinecap="round">
          <line x1="40" y1="50" x2="52" y2="54" />
          <line x1="80" y1="50" x2="68" y2="54" />
        </g>
      )}

      {/* eyes */}
      {sleeping ? (
        <g stroke={nose} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M40 60q6 6 12 0" />
          <path d="M68 60q6 6 12 0" />
        </g>
      ) : (
        <>
          <circle cx="46" cy="60" r={focus ? 4.5 : 5.5} fill={nose} />
          <circle cx="74" cy="60" r={focus ? 4.5 : 5.5} fill={nose} />
          <circle cx="48" cy="58" r="1.8" fill="#fff" />
          <circle cx="76" cy="58" r="1.8" fill="#fff" />
        </>
      )}

      {/* nose */}
      <ellipse cx="60" cy="72" rx="6" ry="4.5" fill={nose} />
      <path d="M60 76v6" stroke={nose} strokeWidth="2.5" strokeLinecap="round" />

      {/* mouth + tongue */}
      {excited ? (
        <>
          <path d="M52 82q8 8 16 0" stroke={nose} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 84q4 9 8 0Z" fill={tongue} />
        </>
      ) : sleeping ? (
        <path d="M55 84q5 4 10 0" stroke={nose} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M53 82q7 6 14 0" stroke={nose} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* zzz when sleeping */}
      {sleeping && (
        <g fill={furDark} fontFamily="sans-serif" fontWeight="700">
          <text x="92" y="34" fontSize="12">z</text>
          <text x="100" y="24" fontSize="9">z</text>
        </g>
      )}
    </svg>
  )
}
