import { useEffect, useState } from 'react'
import type { Habit } from '../../lib/habits'
import type { HabitInput } from '../../lib/habitsApi'
import { FormError } from '../TextField'
import HabitForm from './HabitForm'

type Result = Promise<{ error: string | null }>

/**
 * Edit a habit from a panel that slides up from the bottom of the screen: fix its name, emoji or
 * days, stop it (history kept) or delete it (history erased, after a warning).
 */
export default function HabitEditSheet({
  habit,
  tickedDays,
  onSave,
  onStop,
  onDelete,
  onClose,
}: {
  habit: Habit
  /** How many days it has been ticked, for the delete warning. */
  tickedDays: number
  onSave: (input: HabitInput) => Result
  onStop: () => Result
  onDelete: () => Result
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Keep the page behind from scrolling while the sheet is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  async function run(action: () => Result, confirmText: string) {
    if (!window.confirm(confirmText)) return
    setBusy(true)
    const result = await action()
    setBusy(false)
    if (result.error) setError(result.error)
    else onClose()
  }

  const history =
    tickedDays === 0 ? 'It has no ticks yet.' : `Its ${tickedDays} ticked ${tickedDays === 1 ? 'day' : 'days'} will be erased from your Mirror.`

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Edit ${habit.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-midnight-950/70 backdrop-blur-sm" />
      <div className="sheet-up relative max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl border border-midnight-700 bg-midnight-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-midnight-600 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-moon-100">Edit habit</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-moon-400 hover:text-moon-100">
            Close
          </button>
        </div>

        <HabitForm
          initial={{ name: habit.name, emoji: habit.emoji, days: habit.days }}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            const result = await onSave(input)
            if (!result.error) onClose()
            return result
          }}
        />

        <FormError message={error} />
        <div className="space-y-2 border-t border-midnight-700/70 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(onStop, `Stop “${habit.name}”? It won’t be asked for any more, and its history stays in your Mirror.`)
            }
            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-midnight-700 px-4 text-left text-sm text-moon-100 hover:border-nebula-400/50 disabled:opacity-50"
          >
            <span>
              <span className="block font-medium">Stop habit</span>
              <span className="block text-xs text-moon-500">Keeps its history in the Mirror. Recommended.</span>
            </span>
            <span aria-hidden>⏸</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(onDelete, `Delete “${habit.name}” for good? ${history} This can’t be undone.`)}
            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-rose-500/40 px-4 text-left text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
          >
            <span>
              <span className="block font-medium">Delete habit</span>
              <span className="block text-xs text-rose-200/70">Erases it and its history. For mistakes.</span>
            </span>
            <span aria-hidden>🗑</span>
          </button>
        </div>
      </div>
    </div>
  )
}
