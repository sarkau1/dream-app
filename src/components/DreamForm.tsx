import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useDreamPosts } from '../context/useDreamPosts'
import { clearDraft, draftIsOutdated, loadDraft, saveDraft } from '../lib/drafts'
import { todayLocal } from '../lib/dates'
import { symbolsByFrequency } from '../lib/symbols'
import {
  DREAM_MOODS,
  MAX_BODY_LENGTH,
  MAX_SYMBOLS,
  MAX_TITLE_LENGTH,
  type DreamInput,
  type DreamMood,
} from '../types/dream'
import { fieldClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../styles/ui'

// How many of the user's most used signs to offer as one-tap chips.
const QUICK_SUGGESTIONS = 8

interface DreamFormProps {
  initialValues?: Partial<DreamInput>
  /** localStorage key to autosave unsaved changes under (see lib/drafts). */
  draftKey?: string
  /**
   * Set when editing a dream that's already saved, so a draft started from an older version of it
   * (edited since on another device) is flagged instead of silently replacing the newer text.
   */
  editsSavedDream?: boolean
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: DreamInput) => Promise<{ error: string | null }>
  /** Called with the values that were saved. */
  onSuccess: (values: DreamInput) => void
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
  // Roomier on phones (36px tall) so moods and signs are easy to tap; compact from `sm` up.
  return `rounded-full border px-3.5 py-2 text-sm transition-colors sm:px-3 sm:py-1 sm:text-xs ${
    active
      ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
      : 'border-midnight-700 text-moon-400 hover:text-moon-100'
  }`
}

export default function DreamForm({
  initialValues,
  draftKey,
  editsSavedDream = false,
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
  const [draftOutdated] = useState(
    () => editsSavedDream && restoredDraft !== null && draftIsOutdated(restoredDraft, initial),
  )
  const start = restoredDraft ? withDefaults(restoredDraft.values) : initial

  const [title, setTitle] = useState(start.title)
  const [body, setBody] = useState(start.body)
  const [mood, setMood] = useState<DreamMood | null>(start.mood)
  const [symbols, setSymbols] = useState<string[]>(start.symbols)
  const [symbolInput, setSymbolInput] = useState('')
  const [isPrivate, setIsPrivate] = useState(start.isPrivate)
  const [dreamtOn, setDreamtOn] = useState(start.dreamtOn)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The user's past dream signs, most used first, minus the ones already on this dream. Reusing
  // the same words keeps the stats and the Dream Web from splitting one sign into several.
  const { myDreams } = useDreamPosts()
  const knownSymbols = useMemo(() => symbolsByFrequency(myDreams), [myDreams])
  const suggestions = useMemo(() => {
    const taken = new Set(symbols.map((s) => s.toLowerCase()))
    return knownSymbols.filter((symbol) => !taken.has(symbol))
  }, [knownSymbols, symbols])

  const values: DreamInput = { title, body, mood, symbols, isPrivate, dreamtOn }
  const valuesJson = JSON.stringify(values)

  // Autosave while the form differs from where it started; drop the draft once it doesn't.
  useEffect(() => {
    if (!draftKey) return
    const current = JSON.parse(valuesJson) as DreamInput
    if (sameValues(current, initial)) clearDraft(draftKey)
    else saveDraft(draftKey, { values: current, base: initial })
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

  function addSymbol(raw: string = symbolInput) {
    // Lowercased so "Water" and "water" count as the same sign in the stats and the Dream Web.
    const value = raw.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!value || symbols.some((s) => s.toLowerCase() === value)) {
      setSymbolInput('')
      return
    }
    if (symbols.length >= MAX_SYMBOLS) {
      setError(`A dream can have up to ${MAX_SYMBOLS} signs.`)
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
    if (!title.trim() || !body.trim()) {
      setError('Give your dream a title and describe what happened.')
      return
    }

    setSubmitting(true)
    setError(null)
    const submitted = { ...values, title: title.trim(), body: body.trim() }
    const { error } = await onSubmit(submitted)
    setSubmitting(false)

    if (error) {
      // The draft is still saved, so nothing is lost if the user gives up and comes back later.
      setError(error)
      return
    }
    if (draftKey) clearDraft(draftKey)
    onSuccess(submitted)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showDraftNotice && (
        draftOutdated ? (
          <div
            role="alert"
            className="space-y-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
          >
            <p>
              Restored an unsaved draft, but this dream has been changed since the draft was
              started, maybe on another device. Saving now would replace those changes.
            </p>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={discardDraft} className="underline hover:text-amber-100">
                Use the saved version
              </button>
              <button
                type="button"
                onClick={() => setShowDraftNotice(false)}
                className="underline hover:text-amber-100"
              >
                Keep my draft
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aurora-400/30 bg-aurora-400/10 px-4 py-2 text-sm text-aurora-300">
            <span>Restored your unsaved draft.</span>
            <button type="button" onClick={discardDraft} className="underline hover:text-aurora-200">
              Discard draft
            </button>
          </div>
        )
      )}

      <div>
        <label htmlFor="dream-date" className={labelClass}>
          Date of the dream
        </label>
        <input
          id="dream-date"
          type="date"
          value={dreamtOn}
          max={todayLocal()}
          required
          onChange={(e) => setDreamtOn(e.target.value)}
          className={`mt-1 ${fieldClass}`}
        />
      </div>

      <div>
        <label htmlFor="dream-title" className={labelClass}>
          Title
        </label>
        <input
          id="dream-title"
          value={title}
          required
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Give your dream a title"
        />
      </div>

      <div>
        <label htmlFor="dream-body" className={labelClass}>
          What happened?
        </label>
        <textarea
          id="dream-body"
          value={body}
          required
          maxLength={MAX_BODY_LENGTH}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className={inputClass}
          placeholder="Describe your dream..."
        />
      </div>

      <div>
        <p id="dream-mood-label" className={labelClass}>
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
        <label htmlFor="dream-symbol" className={labelClass}>
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
            list={suggestions.length > 0 ? 'dream-symbol-suggestions' : undefined}
            autoComplete="off"
            placeholder="Add a symbol you noticed…"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          {/* Type-ahead over every past sign; the chips below cover the most used ones. */}
          <datalist id="dream-symbol-suggestions">
            {suggestions.map((symbol) => (
              <option key={symbol} value={symbol} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => addSymbol()}
            className="shrink-0 rounded-xl border border-midnight-700 px-4 text-sm text-moon-300 transition-colors hover:border-nebula-400/60 hover:text-moon-100"
          >
            Add
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span id="dream-symbol-quick" className="text-xs text-moon-500">
              Your usual signs:
            </span>
            {suggestions.slice(0, QUICK_SUGGESTIONS).map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => addSymbol(symbol)}
                aria-label={`Add ${symbol}`}
                aria-describedby="dream-symbol-quick"
                className="rounded-full border border-dashed border-midnight-700 px-3.5 py-2 text-sm text-moon-400 transition-colors hover:border-nebula-400/60 hover:text-moon-100 sm:px-3 sm:py-1 sm:text-xs"
              >
                + {symbol}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The whole row is the label, so it's one big tap target on phones. */}
      <label
        htmlFor="dream-private"
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-midnight-700 bg-midnight-900/40 px-3.5 py-2.5 text-sm text-moon-300 transition-colors hover:border-midnight-600"
      >
        <input
          id="dream-private"
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-nebula-500"
        />
        Keep this dream private (only visible to you)
      </label>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full sm:w-auto ${primaryButtonClass}`}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`w-full sm:w-auto ${secondaryButtonClass}`}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
