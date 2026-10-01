import { useState } from 'react'
import { useDreamImageUrl } from '../lib/dreamImages'

/**
 * An image that fades in once it has loaded, over a soft placeholder, so a picture never pops in
 * half-drawn. `onError` lets the caller re-sign a link that stopped working.
 */
export function FadeInImage({
  src,
  alt,
  className = '',
  onError,
  lazy = false,
}: {
  src: string | null
  alt: string
  className?: string
  onError?: () => void
  lazy?: boolean
}) {
  // Which link has finished loading; a new link (renewed or re-signed) fades in again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const loaded = src !== null && loadedSrc === src
  return (
    <div className={`relative overflow-hidden bg-midnight-800/60 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-midnight-700/40" aria-hidden />}
      {src && (
        <img
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={onError}
          className={`size-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}

/** A dream's full picture on its page. Square space is kept while it loads, like most generated images. */
export default function DreamImage({ path, title, className = '' }: { path: string; title: string; className?: string }) {
  const { url, reload } = useDreamImageUrl(path)
  return (
    <FadeInImage
      src={url}
      alt={`Picture of the dream “${title}”`}
      onError={reload}
      className={`aspect-square max-h-[32rem] w-full rounded-2xl border border-midnight-700/60 sm:aspect-[4/3] ${className}`}
    />
  )
}
