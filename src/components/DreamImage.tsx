import { useDreamImageUrl } from '../lib/dreamImages'

/** A dream's picture, full width; a soft placeholder while its link is being signed. */
export default function DreamImage({ path, title, className = '' }: { path: string; title: string; className?: string }) {
  const url = useDreamImageUrl(path)
  return (
    <div className={`overflow-hidden rounded-2xl border border-midnight-700/60 bg-midnight-800/40 ${className}`}>
      {url ? (
        <img src={url} alt={`Picture of the dream “${title}”`} className="max-h-[32rem] w-full object-cover" />
      ) : (
        <div className="aspect-video animate-pulse" aria-label="Loading picture" />
      )}
    </div>
  )
}
