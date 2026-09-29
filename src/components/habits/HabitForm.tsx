import { useState, type FormEvent } from 'react'
import { EVERY_DAY, MAX_HABIT_NAME_LENGTH } from '../../lib/habits'
import type { HabitInput } from '../../lib/habitsApi'
import { useSubmit } from '../../lib/useSubmit'
import { fieldClass, primaryButtonClass, secondaryButtonClass } from '../../styles/ui'
import { FormError } from '../TextField'

const HABIT_EMOJIS = ['🧘', '📖', '🏃', '💧', '👁', '📵', '🌅', '✍️', '🥗', '💤', '🚶', '🏋️', '🎸', '🧹', '💊', '🙏']

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PRESETS = [
  { label: 'Every day', days: EVERY_DAY },
  { label: 'Weekdays', days: [0, 1, 2, 3, 4] },
  { label: 'Weekends', days: [5, 6] },
]

const chip = (active: boolean) =>
  `min-h-10 rounded-full border px-3 text-sm transition-colors ${
    active
      ? 'border-nebula-400 bg-nebula-500/20 text-nebula-100'
      : 'border-midnight-700 text-moon-400 hover:text-moon-100'
  }`

/** Name, emoji and which days: kept to one short card so adding a habit takes seconds. */
export default function HabitForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: HabitInput
  submitLabel: string
  onSubmit: (input: HabitInput) => Promise<{ error: string | null }>
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState<string | null>(initial?.emoji ?? null)
  const [days, setDays] = useState<number[]>(initial?.days ?? EVERY_DAY)
  const submit = useSubmit()
  const sameDays = (a: number[], b: number[]) => [...a].sort().join() === [...b].sort().join()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    const saved = await submit.run(() => onSubmit({ name, emoji, days }))
    if (saved && !initial) {
      setName('')
      setEmoji(null)
      setDays(EVERY_DAY)
    }
  }

  const toggleDay = (day: number) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  return (
    <form onSubmit={handleSubmit} className="rise-in space-y-4 rounded-2xl border border-nebula-400/30 bg-midnight-900/80 p-4 backdrop-blur">
      <label className="block">
        <span className="sr-only">Habit</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_HABIT_NAME_LENGTH}
          placeholder="What will you do? e.g. Meditate 10 min"
          className={`w-full text-base ${fieldClass}`}
        />
      </label>

      <div role="group" aria-label="Emoji" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {HABIT_EMOJIS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={emoji === option}
            onClick={() => setEmoji(emoji === option ? null : option)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition ${
              emoji === option ? 'scale-110 bg-nebula-500/30 ring-2 ring-nebula-400' : 'bg-midnight-800/80 hover:bg-midnight-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={sameDays(days, preset.days)}
              onClick={() => setDays(preset.days)}
              className={chip(sameDays(days, preset.days))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Days" className="flex justify-between gap-1">
          {WEEKDAYS.map((letter, day) => (
            <button
              key={day}
              type="button"
              aria-pressed={days.includes(day)}
              aria-label={WEEKDAY_NAMES[day]}
              onClick={() => toggleDay(day)}
              className={`h-10 flex-1 rounded-xl text-sm font-medium transition-colors ${
                days.includes(day) ? 'bg-nebula-500 text-white' : 'bg-midnight-800 text-moon-500'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <FormError message={submit.error} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submit.pending || !name.trim() || days.length === 0}
          className={`flex-1 ${primaryButtonClass}`}
        >
          {submit.pending ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
