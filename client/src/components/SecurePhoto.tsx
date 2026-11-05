import { useEffect, useState } from 'react'
import { photosApi } from '../services/photos'

// Shows a photo that needs login. Downloads it with the token, then displays it from memory.
export default function SecurePhoto({ photoId, alt, className = '' }: { photoId: number; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    photosApi
      .image(photoId)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    // Free the memory when the photo is no longer shown
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  if (failed) return <div className={`flex items-center justify-center bg-peach-50 text-xs text-ink-soft ${className}`}>Photo unavailable</div>
  if (!url) return <div className={`animate-pulse bg-peach-100 ${className}`} aria-label="Loading photo" />
  return <img src={url} alt={alt} className={className} />
}
