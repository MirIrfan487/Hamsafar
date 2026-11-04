import { useId } from 'react'

// Original decorative drawings used on the home page. All are aria-hidden (decoration only).

// A six-petal flower
export function Bloom({ className = '', petal = 'var(--color-accent-400)', center = 'var(--color-gold)' }: {
  className?: string
  petal?: string
  center?: string
}) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <ellipse key={r} cx="20" cy="10" rx="5.5" ry="9" fill={petal} opacity="0.92" transform={`rotate(${r} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="5" fill={center} />
    </svg>
  )
}

// A curved branch with leaves and a flower at the tip
export function Sprig({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  const leaves = [
    { x: 38, y: 58, r: -35 },
    { x: 62, y: 49, r: 145 },
    { x: 86, y: 38, r: -40 },
    { x: 108, y: 29, r: 140 },
  ]
  return (
    <svg viewBox="0 0 170 80" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M4 72 C 50 62, 92 42, 140 18" stroke="#8a6a80" strokeWidth="2" fill="none" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx="11" ry="4.5" fill="var(--color-sage-300)" transform={`rotate(${l.r} ${l.x} ${l.y})`} />
      ))}
      <g transform="translate(128 2) scale(0.8)">
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <ellipse key={r} cx="20" cy="10" rx="5.5" ry="9" fill="var(--color-accent-400)" transform={`rotate(${r} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="5" fill="var(--color-gold)" />
      </g>
    </svg>
  )
}

// An arch (like a mihrab doorway) with a crescent and two linked rings
export function ArchRings({ className = '', tone = 'violet' }: { className?: string; tone?: 'violet' | 'sage' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const top = tone === 'violet' ? 'var(--color-brand-500)' : '#bfe0d3'
  const bottom = tone === 'violet' ? 'var(--color-brand-800)' : 'var(--color-sage-500)'
  return (
    <svg viewBox="0 0 320 300" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`arch-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <mask id={`moon-${id}`}>
          <rect width="320" height="300" fill="white" />
          <circle cx="169" cy="62" r="14" fill="black" />
        </mask>
      </defs>
      <path d="M40 300 V150 A120 120 0 0 1 280 150 V300 Z" fill={`url(#arch-${id})`} />
      <path d="M62 300 V152 A98 98 0 0 1 258 152 V300" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" />
      <circle cx="160" cy="68" r="16" fill="var(--color-gold)" mask={`url(#moon-${id})`} />
      <circle cx="112" cy="104" r="2.5" fill="#fff" opacity="0.8" />
      <circle cx="214" cy="98" r="2" fill="#fff" opacity="0.7" />
      <circle cx="196" cy="128" r="1.6" fill="#fff" opacity="0.6" />
      <circle cx="136" cy="196" r="40" fill="none" stroke="var(--color-gold)" strokeWidth="9" />
      <circle cx="186" cy="196" r="40" fill="none" stroke="#fde3ee" strokeWidth="9" />
    </svg>
  )
}
