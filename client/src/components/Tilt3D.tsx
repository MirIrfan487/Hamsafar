import { useRef, type PointerEvent, type ReactNode } from 'react'

// Tilts its children in 3D towards the mouse. Styles: .tilt-scene and .tilt-surface in index.css.
// The mouse is tracked on the outer box, which never moves, so the tilt cannot flicker at the edges.
// Children can stand out from the surface with the classes transform-3d (parent) and translate-z-* (child).
export default function Tilt3D({ children, className = '', maxTilt = 10 }: { children: ReactNode; className?: string; maxTilt?: number }) {
  const surface = useRef<HTMLDivElement>(null)

  const setTilt = (x: number, y: number) => {
    surface.current?.style.setProperty('--tilt-x', `${x}deg`)
    surface.current?.style.setProperty('--tilt-y', `${y}deg`)
  }

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return // on phones a finger is scrolling, not pointing
    const box = e.currentTarget.getBoundingClientRect()
    const fromCentreX = (e.clientX - box.left) / box.width - 0.5 // -0.5 (left) to 0.5 (right)
    const fromCentreY = (e.clientY - box.top) / box.height - 0.5 // -0.5 (top) to 0.5 (bottom)
    setTilt(-fromCentreY * maxTilt * 2, fromCentreX * maxTilt * 2)
  }

  return (
    <div className={`tilt-scene ${className}`} onPointerMove={handleMove} onPointerLeave={() => setTilt(0, 0)}>
      <div ref={surface} className="tilt-surface">
        {children}
      </div>
    </div>
  )
}
