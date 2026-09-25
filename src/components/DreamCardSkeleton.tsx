/** Grey placeholder cards shown while dreams load, shaped like DreamCard so nothing jumps. */
export default function DreamCardSkeleton({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <ul aria-hidden="true" className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            className="animate-pulse rounded-2xl border border-midnight-700/80 bg-midnight-900/60 p-4 sm:p-5"
          >
            <div className="h-5 w-2/3 rounded-full bg-midnight-700/80" />
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-14 rounded-full bg-midnight-700/60" />
              <div className="h-5 w-16 rounded-full bg-midnight-700/60" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-full rounded-full bg-midnight-700/50" />
              <div className="h-3.5 w-11/12 rounded-full bg-midnight-700/50" />
              <div className="h-3.5 w-3/5 rounded-full bg-midnight-700/50" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
