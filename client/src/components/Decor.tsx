import { useId } from 'react'
import Tilt3D from './Tilt3D'

// Original decorative drawings used on the home page. All are aria-hidden (decoration only).

// A six-petal flower
export function Bloom({ className = '', petal = 'var(--color-accent-400)', center = 'var(--color-brand-700)' }: {
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
      <path d="M4 72 C 50 62, 92 42, 140 18" stroke="#8a7a5c" strokeWidth="2" fill="none" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx="11" ry="4.5" fill="var(--color-sage-300)" transform={`rotate(${l.r} ${l.x} ${l.y})`} />
      ))}
      <g transform="translate(128 2) scale(0.8)">
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <ellipse key={r} cx="20" cy="10" rx="5.5" ry="9" fill="var(--color-accent-400)" transform={`rotate(${r} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="5" fill="var(--color-brand-700)" />
      </g>
    </svg>
  )
}

// An arch (like a mihrab doorway) with a crescent and two linked rings
export function ArchRings({ className = '' }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg viewBox="0 0 320 300" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`arch-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-brand-500)" />
          <stop offset="1" stopColor="var(--color-brand-800)" />
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
      <circle cx="186" cy="196" r="40" fill="none" stroke="#f6e7c1" strokeWidth="9" />
    </svg>
  )
}

// Soft lights behind the hero arch. Fixed positions so the picture never changes between renders.
const LIGHTS = [
  [150, 300, 16, 0.5], [205, 250, 10, 0.7], [262, 215, 20, 0.45], [318, 262, 12, 0.7], [372, 310, 18, 0.5],
  [120, 392, 11, 0.6], [186, 352, 22, 0.35], [250, 322, 9, 0.8], [306, 362, 24, 0.3], [362, 402, 12, 0.6],
  [404, 352, 8, 0.7], [226, 170, 7, 0.7], [292, 158, 9, 0.6], [150, 452, 16, 0.4], [356, 462, 15, 0.4],
  [100, 322, 6, 0.8], [424, 430, 7, 0.7], [260, 120, 5, 0.8],
]

// Depth of each slice of the 3D rings, in pixels. Stacking flat rings close together makes them look solid.
const RING_SLICES = [-5, -3, -1, 1, 3, 5]

// Big hero picture: a mihrab doorway lit from inside, with lanterns, a star lattice and two linked rings.
// Three layers at different depths (doorway, lanterns, rings), so it moves like a real 3D scene.
export function HeroArch({ className = '' }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const outer = 'M40 580 V270 C40 180 170 130 260 24 C350 130 480 180 480 270 V580 Z'
  const inner = 'M70 580 V276 C70 200 186 150 260 66 C334 150 450 200 450 276 V580 Z'
  const lanterns = [
    { x: 176, length: 112, size: 0.8 },
    { x: 260, length: 62, size: 1 },
    { x: 344, length: 112, size: 0.8 },
  ]
  const layer = 'absolute inset-0 h-full w-full'
  return (
    <Tilt3D className={className} maxTilt={9}>
      <div className="float-3d relative aspect-[520/600] transform-3d" aria-hidden="true">
        <svg viewBox="0 0 520 600" className={layer}>
          <defs>
            <radialGradient id={`glow-${id}`} cx="0.5" cy="0.62" r="0.62">
              <stop offset="0" stopColor="#f6d58a" />
              <stop offset="0.38" stopColor="#b9853a" />
              <stop offset="0.72" stopColor="#3a3346" />
              <stop offset="1" stopColor="var(--color-brand-800)" />
            </radialGradient>
            <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6e2ad" />
              <stop offset="1" stopColor="#a87c33" />
            </linearGradient>
            <linearGradient id={`floor-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-brand-900)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--color-brand-900)" stopOpacity="0.85" />
            </linearGradient>
            <pattern id={`star-${id}`} width="52" height="52" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#ffe9b8" strokeWidth="1">
                <rect x="14" y="14" width="24" height="24" />
                <rect x="14" y="14" width="24" height="24" transform="rotate(45 26 26)" />
              </g>
            </pattern>
            <filter id={`blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <clipPath id={`door-${id}`}>
              <path d={inner} />
            </clipPath>
          </defs>

          <path d={outer} fill="var(--color-brand-700)" stroke={`url(#rim-${id})`} strokeWidth="2.5" />
          <path d={outer} fill={`url(#star-${id})`} opacity="0.1" />

          <g clipPath={`url(#door-${id})`}>
            <rect width="520" height="600" fill={`url(#glow-${id})`} />
            <rect width="520" height="600" fill={`url(#star-${id})`} opacity="0.12" />
            <g filter={`url(#blur-${id})`}>
              {LIGHTS.map(([x, y, r, o]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffe9b8" opacity={o} />
              ))}
            </g>
            <rect y="400" width="520" height="200" fill={`url(#floor-${id})`} />
          </g>
          <path d={inner} fill="none" stroke={`url(#rim-${id})`} strokeWidth="2" />
        </svg>

        {/* Middle layer: lanterns hang in front of the doorway and sway from the top of their chain */}
        <svg viewBox="0 0 520 600" className={`${layer} translate-z-10`}>
          {lanterns.map((l, i) => (
            <g key={l.x} transform={`translate(${l.x} 74)`}>
              <g className="lantern-sway" style={{ animationDelay: `${i * -1.4}s` }}>
                <line y2={l.length} stroke="#f6e2ad" strokeWidth="1.2" />
                <g transform={`translate(0 ${l.length}) scale(${l.size})`}>
                  <circle cy="24" r="30" fill="#ffe9b8" opacity="0.28" filter={`url(#blur-${id})`} />
                  <path d="M-7 0 H7 L15 12 V32 L7 46 H-7 L-15 32 V12 Z" fill="#fff2cf" stroke="#a87c33" strokeWidth="2" />
                  <path d="M-15 12 H15 M-15 32 H15 M0 0 V46" stroke="#a87c33" strokeWidth="1.5" />
                  <path d="M-5 46 H5 L0 56 Z" fill="#a87c33" />
                </g>
              </g>
            </g>
          ))}
        </svg>

        {/* Front layer: the rings turn slowly. The front slice is bright, the slices behind it form the dark edge. */}
        <div className="absolute inset-0 translate-z-16 transform-3d">
          <div className="rings-3d absolute inset-0">
            {RING_SLICES.map((depth, i) => {
              const isFront = i === RING_SLICES.length - 1
              return (
                <svg key={depth} viewBox="0 0 520 600" className={layer} style={{ transform: `translateZ(${depth}px)` }}>
                  <g fill="none" strokeWidth="11">
                    <circle cx="222" cy="470" r="52" stroke={isFront ? `url(#rim-${id})` : '#7d5a22'} />
                    <circle cx="298" cy="470" r="52" stroke={isFront ? '#fff2cf' : '#a87c33'} />
                  </g>
                </svg>
              )
            })}
          </div>
        </div>
      </div>
    </Tilt3D>
  )
}
