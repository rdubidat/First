import { useMemo } from 'react'

// A one-shot confetti burst. Mount it (with a key) to fire; it cleans itself
// up visually after ~700ms via the confetti-fall animation. Particles are a
// festive mix of paw-warm colors plus the occasional tiny paw.
const COLORS = ['#d97e2d', '#e39b4c', '#f3d6ad', '#56b870', '#5b9bd5', '#f08a98']

export default function Confetti({ count = 16, origin = 'center' }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * (i / count)) - Math.PI / 2 + (Math.random() - 0.5)
        const dist = 26 + Math.random() * 46
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 10,
          rot: Math.random() * 360,
          color: COLORS[i % COLORS.length],
          size: 5 + Math.random() * 5,
          delay: Math.random() * 0.08,
          round: Math.random() > 0.5,
        }
      }),
    [count]
  )

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: origin === 'center' ? '50%' : origin.x,
        top: origin === 'center' ? '50%' : origin.y,
      }}
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute block animate-[confetti-fall_0.7s_ease-out_forwards]"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '999px' : '2px',
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
