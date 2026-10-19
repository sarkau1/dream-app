import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { appendDictation } from '../lib/dictation'
import { clearDraft, draftIsOutdated, loadDraft, saveDraft } from '../lib/drafts'
import { todayLocal } from '../lib/dates'
import {
  MAX_THOUGHT_BODY_LENGTH,
  MAX_THOUGHT_TAGS,
  MAX_THOUGHT_TITLE_LENGTH,
  THOUGHT_KINDS,
  type ThoughtInput,
  type ThoughtKind,
} from '../types/thought'
import { fieldClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../styles/ui'
import DictationButton from './DictationButton'
import { FormError } from './TextField'

// The thought-notebook twin of DreamForm: same look and autosaved drafts, without the dream-only
// parts (mood, signs, picture, sharing). Thoughts are always private.

interface ThoughtFormProps {
  initialValues?: Partial<ThoughtInput>
  /** localStorage key to autosave unsaved changes under (see lib/drafts). */
  draftKey?: string
  /** Set when editing a saved thought, so a draft older than the saved version is flagged. */
  editsSavedThought?: boolean
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: ThoughtInput) => Promise<{ error: string | null }>
  onSuccess: (values: ThoughtInput) => void
  onCancel?: () => void
}

function withDefaults(values?: Partial<ThoughtInput>): ThoughtInput {
  return {
    title: values?.title ?? '',
    body: values?.body ?? '',
    kind: values?.kind ?? null,
    tags: values?.tags ?? [],
    writtenOn: values?.writtenOn ?? todayLocal(),
  }
}

function chipClass(active: boolean) {
  return `rounded-full border px-3.5 py-2 text-sm transition-colors sm:px-3 sm:py-1 sm:text-xs ${
    active
      ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
      : 'border-midnight-700 text-moon-400 hover:text-moon-100'
  }`
}

export default function ThoughtForm({
  initialValues,
  draftKey,
  editsSavedThought = false,
  submitLabel,
  submittingLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: ThoughtFormProps) {
  const [initial] = useState(() => withDefaults(initialValues))
  const [restoredDraft] = useState(() => (draftKey ? loadDraft<ThoughtInput>(draftKey) : null))
  const [showDraftNotice, setShowDraftNotice] = useState(restoredDraft !== null)
  const [draftOutdated] = useState(
    () => editsSavedThought && restoredDraft !== null && draftIsOutdated(restoredDraft, initial),
  )
  const start = restoredDraft ? withDefaults(restoredDraft.values) : initial

  const [title, setTitle] = useState(start.title)
  const [body, setBody] = useState(start.body)
  const dictationBaseRef = useRef('')
  const [dictating, setDictating] = useState(false)
  const [kind, setKind] = useState<ThoughtKind | null>(start.kind)
  const [tags, setTags] = useState<string[]>(start.tags)
  const [tagInput, setTagInput] = useState('')
  const [writtenOn, setWrittenOn] = useState(start.writtenOn)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const values: ThoughtInput = { title, body, kind, tags, writtenOn }
  const valuesJson = JSON.stringify(values)

  // Autosave while the form differs from where it started; drop the draft once it doesn't.
  useEffect(() => {
    if (!draftKey) return
    const current = JSON.parse(valuesJson) as ThoughtInput
    if (JSON.stringify(current) === JSON.stringify(initial)) clearDraft(draftKey)
    else saveDraft(draftKey, { values: current, base: initial })
  }, [draftKey, valuesJson, initial])

  function discardDraft() {
    setTitle(initial.title)
    setBody(initial.body)
    setKind(initial.kind)
    setTags(initial.tags)
    setWrittenOn(initial.writtenOn)
    setShowDraftNotice(false)
  }

  function addTag() {
    const value = tagInput.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!value || tags.includes(value)) {
      setTagInput('')
      return
    }
    if (tags.length >= MAX_THOUGHT_TAGS) {
      setError(`A thought can have up to ${MAX_THOUGHT_TAGS} tags.`)
      return
    }
    setTags((prev) => [...prev, value])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Give it a title and write something down.')
      return
    }
    setSubmitting(true)
    setError(null)
    const submitted = { ...values, title: title.trim(), body: body.trim() }
    const { error } = await onSubmit(submitted)
    setSubmitting(false)
    if (error) {
      // The draft is still saved, so nothing is lost.
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
              Restored an unsaved draft, but this thought has been changed since the draft was
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
        <label htmlFor="thought-date" className={labelClass}>
          Date
        </label>
        <input
          id="thought-date"
          type="date"
          value={writtenOn}
          max={todayLocal()}
          required
          onChange={(e) => setWrittenOn(e.target.value)}
          className={`mt-1 ${fieldClass}`}
        />
      </div>

      <div>
        <p id="thought-kind-label" className={labelClass}>
          Kind
        </p>
        <div role="group" aria-labelledby="thought-kind-label" className="mt-2 flex flex-wrap gap-2">
          {THOUGHT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(kind === k ? null : k)}
              className={chipClass(kind === k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="thought-title" className={labelClass}>
          Title
        </label>
        <input
          id="thought-title"
          value={title}
          required
          maxLength={MAX_THOUGHT_TITLE_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder={kind === 'Reading' ? 'The book or article' : 'What’s on your mind?'}
        />
      </div>

      <div>
        <label htmlFor="thought-body" className={labelClass}>
          {kind === 'Reading' ? 'Notes' : 'Your thoughts'}
        </label>
        <textarea
          id="thought-body"
          value={body}
          required
          maxLength={MAX_THOUGHT_BODY_LENGTH}
          onChange={(e) => setBody(e.target.value)}
          // While listening, spoken words keep replacing the end of the text; stop the mic to edit.
          readOnly={dictating}
          rows={10}
          className={inputClass}
          placeholder="Write it down..."
        />
        <div className="mt-2">
          <DictationButton
            onStart={() => {
              dictationBaseRef.current = body
            }}
            onTranscript={(spoken) =>
              setBody(appendDictation(dictationBaseRef.current, spoken, MAX_THOUGHT_BODY_LENGTH))
            }
            onListeningChange={setDictating}
          />
        </div>
      </div>

      <div>
        <label htmlFor="thought-tag" className={labelClass}>
          Tags
        </label>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
                className={chipClass(true)}
              >
                {tag} &times;
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <input
            id="thought-tag"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            autoComplete="off"
            placeholder="Add a tag…"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-xl border border-midnight-700 px-4 text-sm text-moon-300 transition-colors hover:border-nebula-400/60 hover:text-moon-100"
          >
            Add
          </button>
        </div>
      </div>

      <p className="text-xs text-moon-500">🔒 Thoughts are private: only you can see them.</p>

      <FormError message={error} />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="submit" disabled={submitting} className={`w-full sm:w-auto ${primaryButtonClass}`}>
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`w-full sm:w-auto ${secondaryButtonClass}`}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
