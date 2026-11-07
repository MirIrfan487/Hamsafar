import { useEffect, useRef, useState, type ReactNode } from 'react'

// Swings its children up into place the first time they scroll into view (.reveal-3d in index.css).
// delay is in milliseconds, so items in a row can arrive one after another.
export default function Reveal3D({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!box.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect() // only animate once
      },
      { threshold: 0.2 },
    )
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={box} className={`reveal-3d ${shown ? 'is-shown' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
