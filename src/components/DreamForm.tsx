import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { clearDraft, loadDraft, saveDraft } from '../lib/drafts'
import { todayLocal } from '../lib/dates'
import { DREAM_MOODS, type DreamInput, type DreamMood } from '../types/dream'

interface DreamFormProps {
  initialValues?: Partial<DreamInput>
  /** localStorage key to autosave unsaved changes under (see lib/drafts). */
  draftKey?: string
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: DreamInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  onCancel?: () => void
}

function withDefaults(values?: Partial<DreamInput>): DreamInput {
  return {
    title: values?.title ?? '',
    body: values?.body ?? '',
    mood: values?.mood ?? null,
    symbols: values?.symbols ?? [],
    isPrivate: values?.isPrivate ?? false,
    dreamtOn: values?.dreamtOn ?? todayLocal(),
  }
}

function sameValues(a: DreamInput, b: DreamInput) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs transition-colors ${
    active
      ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
      : 'border-midnight-700 text-moon-400 hover:text-moon-100'
  }`
}

export default function DreamForm({
  initialValues,
  draftKey,
  submitLabel,
  submittingLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: DreamFormProps) {
  // Captured once so the dirty check below compares against what the form opened with.
  const [initial] = useState(() => withDefaults(initialValues))
  const [restoredDraft] = useState(() => (draftKey ? loadDraft(draftKey) : null))
  const [showDraftNotice, setShowDraftNotice] = useState(restoredDraft !== null)
  const start = restoredDraft ? withDefaults(restoredDraft) : initial

  const [title, setTitle] = useState(start.title)
  const [body, setBody] = useState(start.body)
  const [mood, setMood] = useState<DreamMood | null>(start.mood)
  const [symbols, setSymbols] = useState<string[]>(start.symbols)
  const [symbolInput, setSymbolInput] = useState('')
  const [isPrivate, setIsPrivate] = useState(start.isPrivate)
  const [dreamtOn, setDreamtOn] = useState(start.dreamtOn)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const values: DreamInput = { title, body, mood, symbols, isPrivate, dreamtOn }
  const valuesJson = JSON.stringify(values)

  // Autosave while the form differs from where it started; drop the draft once it doesn't.
  useEffect(() => {
    if (!draftKey) return
    const current = JSON.parse(valuesJson) as DreamInput
    if (sameValues(current, initial)) clearDraft(draftKey)
    else saveDraft(draftKey, current)
  }, [draftKey, valuesJson, initial])

  function discardDraft() {
    setTitle(initial.title)
    setBody(initial.body)
    setMood(initial.mood)
    setSymbols(initial.symbols)
    setIsPrivate(initial.isPrivate)
    setDreamtOn(initial.dreamtOn)
    setShowDraftNotice(false)
  }

  function addSymbol() {
    const value = symbolInput.trim()
    if (!value || symbols.includes(value)) {
      setSymbolInput('')
      return
    }
    setSymbols((prev) => [...prev, value])
    setSymbolInput('')
  }

  function removeSymbol(symbol: string) {
    setSymbols((prev) => prev.filter((s) => s !== symbol))
  }

  function handleSymbolKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSymbol()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setSubmitting(true)
    setError(null)
    const { error } = await onSubmit({ ...values, title: title.trim(), body: body.trim() })
    setSubmitting(false)

    if (error) {
      // The draft is still saved, so nothing is lost if the user gives up and comes back later.
      setError(error)
      return
    }
    if (draftKey) clearDraft(draftKey)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showDraftNotice && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aurora-400/30 bg-aurora-400/10 px-4 py-2 text-sm text-aurora-300">
          <span>Restored your unsaved draft.</span>
          <button type="button" onClick={discardDraft} className="underline hover:text-aurora-200">
            Discard draft
          </button>
        </div>
      )}

      <div>
        <label htmlFor="dream-date" className="block text-sm font-medium text-moon-300">
          Date of the dream
        </label>
        <input
          id="dream-date"
          type="date"
          value={dreamtOn}
          max={todayLocal()}
          required
          onChange={(e) => setDreamtOn(e.target.value)}
          className="mt-1 rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 focus:border-nebula-400 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="dream-title" className="block text-sm font-medium text-moon-300">
          Title
        </label>
        <input
          id="dream-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
          placeholder="Give your dream a title"
        />
      </div>

      <div>
        <label htmlFor="dream-body" className="block text-sm font-medium text-moon-300">
          What happened?
        </label>
        <textarea
          id="dream-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
          placeholder="Describe your dream..."
        />
      </div>

      <div>
        <p id="dream-mood-label" className="block text-sm font-medium text-moon-300">
          Mood
        </p>
        <div role="group" aria-labelledby="dream-mood-label" className="mt-2 flex flex-wrap gap-2">
          {DREAM_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mood === m}
              onClick={() => setMood(mood === m ? null : m)}
              className={chipClass(mood === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="dream-symbol" className="block text-sm font-medium text-moon-300">
          Dream signs
        </label>
        {symbols.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {symbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => removeSymbol(symbol)}
                aria-label={`Remove ${symbol}`}
                className={chipClass(true)}
              >
                {symbol} &times;
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <input
            id="dream-symbol"
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={handleSymbolKeyDown}
            placeholder="Add a symbol you noticed…"
            className="flex-1 rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-sm text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addSymbol}
            className="rounded-lg border border-midnight-700 px-3 py-2 text-sm text-moon-300 hover:border-nebula-400/60"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="dream-private"
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 rounded border-midnight-700 bg-midnight-900/60 text-nebula-500 focus:ring-nebula-400"
        />
        <label htmlFor="dream-private" className="text-sm text-moon-300">
          Keep this dream private (only visible to you)
        </label>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-midnight-700 px-5 py-2 text-sm text-moon-300 hover:text-moon-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
