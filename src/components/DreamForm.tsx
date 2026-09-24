import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { DREAM_MOODS, type DreamMood } from '../types/dream'

export interface DreamFormValues {
  title: string
  body: string
  mood: DreamMood | null
  symbols: string[]
  isPrivate: boolean
}

interface DreamFormProps {
  initialValues?: DreamFormValues
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: DreamFormValues) => Promise<{ error: string | null }>
  onSuccess: () => void
  onCancel?: () => void
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
  submitLabel,
  submittingLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: DreamFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [body, setBody] = useState(initialValues?.body ?? '')
  const [mood, setMood] = useState<DreamMood | null>(initialValues?.mood ?? null)
  const [symbols, setSymbols] = useState<string[]>(initialValues?.symbols ?? [])
  const [symbolInput, setSymbolInput] = useState('')
  const [isPrivate, setIsPrivate] = useState(initialValues?.isPrivate ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const { error } = await onSubmit({ title: title.trim(), body: body.trim(), mood, symbols, isPrivate })
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
