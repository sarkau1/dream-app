import { useState, type CSSProperties } from 'react'
import HabitEditSheet from '../../components/habits/HabitEditSheet'
import HabitForm from '../../components/habits/HabitForm'
import ReorderList from '../../components/habits/ReorderList'
import ProgressRing from '../../components/habits/ProgressRing'
import { addDays, formatDreamDate } from '../../lib/dates'
import {
  currentStreak,
  habitsDueOn,
  isActiveOn,
  type Habit,
  type HabitChecks,
} from '../../lib/habits'
import type { HabitInput } from '../../lib/habitsApi'

const SUGGESTIONS: HabitInput[] = [
  { name: 'Meditate 10 min', emoji: '🧘', days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Read 20 pages', emoji: '📖', days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Move for 30 min', emoji: '🏃', days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Drink 2 L of water', emoji: '💧', days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Reality check ×5', emoji: '👁', days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'No phone in bed', emoji: '📵', days: [0, 1, 2, 3, 4, 5, 6] },
]

const EMPTY = new Set<string>()

type Result = Promise<{ error: string | null }>

// Eight sparks fly out of the tick, each on its own angle.
const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2
  return { dx: `${Math.cos(angle) * 34}px`, dy: `${Math.sin(angle) * 34}px`, color: i % 2 ? '#5ee6c8' : '#bda8ff' }
})

function HabitRow({
  habit,
  done,
  streak,
  onToggle,
  onEdit,
}: {
  habit: Habit
  done: boolean
  streak: number
  onToggle: () => void
  onEdit: () => void
}) {
  // Bumped on each tick, so the pop and the sparks replay every time.
  const [burst, setBurst] = useState(0)

  function handleClick() {
    if (!done) {
      setBurst((b) => b + 1)
      navigator.vibrate?.(15)
    }
    onToggle()
  }

  return (
    <li
      className={`relative flex min-h-16 items-stretch rounded-2xl border transition-all duration-300 ${
        done
          ? 'border-aurora-400/40 bg-gradient-to-r from-aurora-400/15 via-nebula-500/10 to-transparent'
          : 'border-midnight-700 bg-midnight-900/70 hover:border-nebula-400/40'
      }`}
    >
      {/* The emoji is its own button: tap it to edit, tap the rest of the row to tick. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${habit.name}`}
        className="flex shrink-0 items-center py-3 pl-4 pr-1"
      >
        <span
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition hover:ring-2 hover:ring-nebula-400/60 ${
            done ? 'bg-aurora-400/15' : 'bg-midnight-800'
          }`}
          aria-hidden
        >
          {habit.emoji ?? '✦'}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-midnight-600 bg-midnight-900 text-[10px] text-moon-300">
            ✎
          </span>
        </span>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={handleClick}
        className="group flex min-w-0 flex-1 items-center gap-3 py-3 pl-2 pr-4 text-left transition-transform active:scale-[0.98]"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium transition-colors ${done ? 'text-moon-100' : 'text-moon-300'}`}
          >
            {habit.name}
          </span>
          {streak >= 2 && (
            <span className="text-xs text-amber-300">
              <span aria-hidden>🔥</span> {streak} day streak
            </span>
          )}
        </span>
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
          <span
            key={burst}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
              done ? 'habit-pop border-aurora-400 bg-aurora-400 text-midnight-950' : 'border-midnight-600'
            }`}
          >
            {done && (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path className="habit-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
          {burst > 0 &&
            done &&
            SPARKS.map((spark, i) => (
              <span
                key={`${burst}-${i}`}
                className="habit-spark pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                style={{ background: spark.color, '--dx': spark.dx, '--dy': spark.dy } as CSSProperties}
              />
            ))}
        </span>
      </button>
    </li>
  )
}

export default function TodayTab({
  habits,
  checks,
  today,
  onToggle,
  onAdd,
  onEdit,
  onStop,
  onDelete,
  onReorder,
}: {
  habits: Habit[]
  checks: HabitChecks
  today: string
  onToggle: (habit: Habit, day: string) => void
  onAdd: (input: HabitInput) => Result
  onEdit: (habit: Habit, input: HabitInput) => Result
  onStop: (habit: Habit) => Result
  onDelete: (habit: Habit) => Result
  onReorder: (ids: string[]) => void
}) {
  const yesterday = addDays(today, -1)
  // Yesterday stays fixable (you forgot to tick), then it's locked for good.
  const [day, setDay] = useState<'today' | 'yesterday'>('today')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const shownDay = day === 'today' ? today : yesterday

  const due = habitsDueOn(habits, shownDay)
  const isDone = (habit: Habit, on: string) => (checks.get(habit.id) ?? EMPTY).has(on)
  const doneCount = due.filter((habit) => isDone(habit, shownDay)).length
  const notDue = habits.filter(
    (habit) => isActiveOn(habit, shownDay) && !due.some((d) => d.id === habit.id),
  )
  const missedYesterday = habitsDueOn(habits, yesterday).filter((h) => !isDone(h, yesterday)).length
  const active = habits
    .filter((habit) => habit.archivedOn === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const editing = habits.find((habit) => habit.id === editingId) ?? null

  const left = due.length - doneCount
  const headline =
    due.length === 0
      ? 'Rest day'
      : left === 0
        ? 'Perfect day'
        : doneCount === 0
          ? day === 'today' ? 'Let’s go' : 'Nothing ticked'
          : `${left} to go`

  if (active.length === 0) {
    return (
      <div className="rise-in space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-nebula-400/30 bg-gradient-to-br from-nebula-500/20 via-midnight-900 to-aurora-400/10 p-6 text-center">
          <p className="text-5xl" aria-hidden>🪞</p>
          <h2 className="mt-3 text-2xl font-semibold text-moon-100">Your mirror is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-moon-300">
            Add the habits you want to keep. Tick them off each day, and the Mirror shows you,
            honestly, how you’re really doing.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-moon-400">Start with one tap:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => onAdd(suggestion)}
                className="min-h-11 rounded-full border border-midnight-700 bg-midnight-900/70 px-4 text-sm text-moon-300 transition hover:border-nebula-400/60 hover:text-moon-100 active:scale-95"
              >
                <span aria-hidden>{suggestion.emoji}</span> {suggestion.name}
              </button>
            ))}
          </div>
        </div>
        <HabitForm submitLabel="Add habit" onSubmit={onAdd} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Day" className="flex rounded-full border border-midnight-700 bg-midnight-900/70 p-1 text-sm">
        {(['today', 'yesterday'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={day === option}
            onClick={() => setDay(option)}
            className={`min-h-10 flex-1 rounded-full transition-colors ${
              day === option ? 'bg-nebula-500 text-white shadow-lg shadow-nebula-500/30' : 'text-moon-400'
            }`}
          >
            {option === 'today' ? 'Today' : 'Yesterday'}
          </button>
        ))}
      </div>

      <section className="relative flex items-center gap-5 overflow-hidden rounded-3xl border border-midnight-700/80 bg-gradient-to-br from-midnight-900 via-midnight-900 to-nebula-500/10 p-5">
        <ProgressRing
          done={doneCount}
          total={due.length}
          label={`${doneCount} of ${due.length} habits done ${day}`}
        >
          <span className="text-3xl font-semibold tabular-nums text-moon-100">
            {doneCount}
            <span className="text-lg text-moon-500">/{due.length}</span>
          </span>
          <span className="text-[11px] uppercase tracking-widest text-moon-500">done</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-moon-500">{formatDreamDate(shownDay)}</p>
          <p
            key={headline}
            className={`rise-in mt-1 text-2xl font-semibold ${left === 0 && due.length > 0 ? 'bg-gradient-to-r from-aurora-300 to-nebula-300 bg-clip-text text-transparent' : 'text-moon-100'}`}
          >
            {headline}
            {left === 0 && due.length > 0 && ' ✦'}
          </p>
          <p className="mt-1 text-sm text-moon-400">
            {day === 'yesterday'
              ? 'Forgot to tick something? Fix it now. Tomorrow this day is locked.'
              : due.length === 0
                ? 'Nothing scheduled today. Enjoy it.'
                : left === 0
                  ? 'Every promise kept. See you tomorrow.'
                  : 'Tap a habit when it’s done.'}
          </p>
        </div>
      </section>

      {day === 'today' && missedYesterday > 0 && (
        <button
          type="button"
          onClick={() => setDay('yesterday')}
          className="rise-in flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/5 px-4 py-3 text-left text-sm text-rose-200"
        >
          <span>
            {missedYesterday} {missedYesterday === 1 ? 'habit' : 'habits'} missed yesterday. Forgot to tick?
          </span>
          <span className="shrink-0 font-medium">Fix →</span>
        </button>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-widest text-moon-500">
          {reordering ? 'Drag to arrange' : 'Your habits'}
        </h2>
        {active.length > 1 && (
          <button
            type="button"
            onClick={() => setReordering(!reordering)}
            aria-pressed={reordering}
            className={`min-h-9 rounded-full border px-4 text-sm transition-colors ${
              reordering
                ? 'border-aurora-400/60 bg-aurora-400/15 text-aurora-200'
                : 'border-midnight-700 text-moon-400 hover:text-moon-100'
            }`}
          >
            {reordering ? 'Done' : '↕ Reorder'}
          </button>
        )}
      </div>

      {reordering ? (
        <ReorderList habits={active} onReorder={onReorder} />
      ) : (
        <>
          <ul className="space-y-2.5">
            {due.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                done={isDone(habit, shownDay)}
                streak={currentStreak(habit, checks.get(habit.id) ?? EMPTY, today)}
                onToggle={() => onToggle(habit, shownDay)}
                onEdit={() => setEditingId(habit.id)}
              />
            ))}
          </ul>

          {notDue.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-moon-500">Not scheduled {day}:</p>
              <div className="flex flex-wrap gap-2">
                {notDue.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => setEditingId(habit.id)}
                    aria-label={`Edit ${habit.name}`}
                    className="min-h-9 rounded-full border border-midnight-700 px-3 text-sm text-moon-400 hover:text-moon-100"
                  >
                    <span aria-hidden>{habit.emoji ?? '✦'}</span> {habit.name} <span aria-hidden>✎</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <HabitEditSheet
          habit={editing}
          tickedDays={(checks.get(editing.id) ?? EMPTY).size}
          onSave={(input) => onEdit(editing, input)}
          onStop={() => onStop(editing)}
          onDelete={() => onDelete(editing)}
          onClose={() => setEditingId(null)}
        />
      )}

      {reordering ? null : adding ? (
        <HabitForm
          submitLabel="Add habit"
          onSubmit={async (input) => {
            const result = await onAdd(input)
            if (!result.error) setAdding(false)
            return result
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-midnight-600 text-moon-400 transition hover:border-nebula-400/60 hover:text-moon-100"
        >
          <span className="text-xl leading-none" aria-hidden>+</span> Add a habit
        </button>
      )}
    </div>
  )
}
