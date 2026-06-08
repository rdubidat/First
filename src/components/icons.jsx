// Lightweight inline icon set (stroke-based, lucide-flavored). Keeping them
// inline means no icon-font dependency and crisp scaling at any size.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ size, children, ...rest }) => (
  <svg {...base} width={size || base.width} height={size || base.height} {...rest}>
    {children}
  </svg>
)

export const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const Trash = (p) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
)
export const Undo = (p) => (
  <Svg {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a6 6 0 0 1 0 12h-3" />
  </Svg>
)
export const Sun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
)
export const Moon = (p) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Svg>
)
export const Pin = (p) => (
  <Svg {...p}>
    <path d="M12 17v5" />
    <path d="M9 10.8V4h6v6.8c0 .5.2 1 .6 1.4L18 14H6l2.4-1.8c.4-.4.6-.9.6-1.4Z" />
  </Svg>
)
export const Minus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)
export const Collapse = (p) => (
  <Svg {...p}>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </Svg>
)
export const Close = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)
export const Play = (p) => (
  <Svg {...p}>
    <path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
  </Svg>
)
export const Pause = (p) => (
  <Svg {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
  </Svg>
)
export const Reset = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
)
export const Skip = (p) => (
  <Svg {...p}>
    <path d="M5 4.5v15l11-7.5z" fill="currentColor" stroke="none" />
    <rect x="18" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </Svg>
)
export const Gear = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 14H2.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 2.6V2.5a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 17 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
  </Svg>
)
export const SoundOn = (p) => (
  <Svg {...p}>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </Svg>
)
export const SoundOff = (p) => (
  <Svg {...p}>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    <path d="m23 9-6 6M17 9l6 6" />
  </Svg>
)
export const Check = (p) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)

// On-theme decorative paw + bone marks
export const Paw = ({ size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    <ellipse cx="12" cy="16" rx="5" ry="4.2" />
    <ellipse cx="6.2" cy="10.5" rx="2.1" ry="2.6" />
    <ellipse cx="10" cy="7.6" rx="2.1" ry="2.7" />
    <ellipse cx="14" cy="7.6" rx="2.1" ry="2.7" />
    <ellipse cx="17.8" cy="10.5" rx="2.1" ry="2.6" />
  </svg>
)
export const Bone = ({ size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    <path d="M6.5 7.5a2.5 2.5 0 1 0-2.2 3.6 2.5 2.5 0 1 0 3.6 2.2l8.2-8.2a2.5 2.5 0 1 0 2.2-3.6 2.5 2.5 0 1 0-3.6-2.2L6.5 7.5Z" transform="translate(0 4)" />
  </svg>
)
