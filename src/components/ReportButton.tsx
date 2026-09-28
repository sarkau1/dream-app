import { useState, type FormEvent } from 'react'
import {
  MAX_REPORT_DETAILS,
  REPORT_REASONS,
  reportContent,
  type ReportKind,
  type ReportReason,
} from '../lib/moderation'
import { useSubmit } from '../lib/useSubmit'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles/ui'
import { FormError } from './TextField'

const NOUNS: Record<ReportKind, string> = { dream: 'dream', comment: 'comment', user: 'dreamer' }

/** A small "Report" link that opens a reason picker and sends the report to the admins. */
export default function ReportButton({
  kind,
  target,
  className = '',
}: {
  kind: ReportKind
  /** The dream, comment or user id. */
  target: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('inappropriate')
  const [details, setDetails] = useState('')
  const submit = useSubmit()
  const noun = NOUNS[kind]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (await submit.run(() => reportContent(kind, target, reason, details))) setOpen(false)
  }

  if (submit.done && !open) {
    return (
      <span role="status" className={`text-xs text-aurora-300 ${className}`}>
        Reported. Thanks, a moderator will look at it.
      </span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-moon-500 hover:text-rose-300 ${className}`}
      >
        Report<span className="sr-only"> this {noun}</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full space-y-3 rounded-xl border border-rose-400/30 bg-rose-500/5 p-4 ${className}`}
    >
      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-sm font-medium text-moon-100">Report this {noun}</legend>
        {REPORT_REASONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-moon-300">
            <input
              type="radio"
              name={`report-${kind}-${target}`}
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
              className="accent-rose-400"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm text-moon-300">
        <span className="sr-only">More details (optional)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={MAX_REPORT_DETAILS}
          rows={2}
          placeholder="Anything the moderator should know? (optional)"
          className={inputClass}
        />
      </label>
      <FormError message={submit.error} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
          {submit.pending ? 'Sending...' : 'Send report'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            submit.reset()
          }}
          className={secondaryButtonClass}
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-moon-500">
        Only the site’s moderators see reports. The person you report isn’t told who reported them.
      </p>
    </form>
  )
}
