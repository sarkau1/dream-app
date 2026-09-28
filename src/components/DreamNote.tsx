import { useEffect, useState, type FormEvent } from 'react'
import { fetchNote, MAX_NOTE_LENGTH, saveNote } from '../lib/dreamSocial'
import { useSubmit } from '../lib/useSubmit'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles/ui'
import { FormError } from './TextField'

/** The dreamer's private note on their own dream: what they think it means. Never shared. */
export default function DreamNote({ dreamId, userId }: { dreamId: string; userId: string }) {
  const [note, setNote] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const submit = useSubmit()

  useEffect(() => {
    let cancelled = false
    fetchNote(dreamId).then(({ note, error }) => {
      if (cancelled) return
      setNote(note)
      setLoadError(error)
    })
    return () => {
      cancelled = true
    }
  }, [dreamId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (draft === null) return
    if (await submit.run(() => saveNote(dreamId, userId, draft))) {
      setNote(draft.trim())
      setDraft(null)
    }
  }

  let content
  if (loadError) {
    content = <FormError message={loadError} />
  } else if (note === null) {
    content = <p className="text-sm text-moon-500">Loading...</p>
  } else if (draft !== null) {
    content = (
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="dream-note" className="sr-only">
          Your note
        </label>
        <textarea
          id="dream-note"
          autoFocus
          value={draft}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="What might it mean? What did it remind you of? What was going on in your life?"
          className={inputClass}
        />
        <FormError message={submit.error} />
        <div className="flex gap-2">
          <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
            {submit.pending ? 'Saving...' : 'Save note'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null)
              submit.reset()
            }}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  } else if (note) {
    content = (
      <>
        <p className="whitespace-pre-wrap break-words text-moon-300">{note}</p>
        <button
          type="button"
          onClick={() => setDraft(note)}
          className="text-sm text-amber-200 hover:text-amber-100"
        >
          Edit note
        </button>
      </>
    )
  } else {
    content = (
      <button
        type="button"
        onClick={() => setDraft('')}
        className="text-sm text-amber-200 hover:text-amber-100"
      >
        + Add a note about what it means
      </button>
    )
  }

  return (
    <section className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
      <h2 className="flex items-center gap-2 font-medium text-moon-100">
        Your notes
        <span className="text-xs font-normal text-amber-300">Only you can see these</span>
      </h2>
      {content}
    </section>
  )
}
