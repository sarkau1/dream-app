/** Tells a suspended user what they can't do, and why. */
export default function SuspendedNotice({ reason }: { reason: string }) {
  return (
    <div role="note" className="rounded-xl border border-rose-400/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
      <p className="font-medium">Your account is suspended from sharing, commenting and reacting.</p>
      <p className="mt-0.5 text-rose-200/80">Reason: {reason}</p>
      <p className="mt-0.5 text-rose-200/80">
        You can still write and read your private journal.
      </p>
    </div>
  )
}
