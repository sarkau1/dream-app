import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDreamStreak } from '../../context/DreamStreakContext'
import { useMetaProgress } from '../../context/MetaProgressContext'
import { ESSENCE_RECALLED, ESSENCE_NO_RECALL } from '../../data/essenceRewards'
import EssencePop from '../../components/EssencePop'

function formatDateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function JournalHome() {
  const { entries, todayKey, logEntry } = useDreamStreak()
  const { earnEssence } = useMetaProgress()

  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [recalled, setRecalled] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [essenceEarned, setEssenceEarned] = useState(0)

  const existingEntry = entries[selectedDate] ?? null
  const isNewEntry = existingEntry === null

  // Load whatever is already logged for the selected date into the form. Re-runs only when
  // the date changes, so typing doesn't get clobbered by the entries state updating on save.
  useEffect(() => {
    const entry = entries[selectedDate]
    setRecalled(entry ? entry.recalled : null)
    setNote(entry?.note ?? '')
    setTags(entry?.dreamSigns ?? [])
    setCustomTag('')
    setEssenceEarned(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function addCustomTag() {
    const value = customTag.trim()
    if (!value || tags.includes(value)) {
      setCustomTag('')
      return
    }
    setTags((prev) => [...prev, value])
    setCustomTag('')
  }

  function handleSave() {
    if (recalled === null) return
    logEntry(selectedDate, recalled, note, tags)
    if (isNewEntry) {
      const earned = recalled ? ESSENCE_RECALLED : ESSENCE_NO_RECALL
      setEssenceEarned(earned)
      earnEssence(earned)
    }
  }

  const history = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Dream Journal</h1>
          <p className="mt-2 text-moon-300">
            Log what you recall as soon as you wake up — recall improves fast with practice, and
            your recurring symbols show up in the{' '}
            <Link to="/web" className="text-nebula-300 hover:text-nebula-200">
              Dream Web
            </Link>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-moon-300" htmlFor="journal-date">
              Night of
            </label>
            <input
              id="journal-date"
              type="date"
              value={selectedDate}
              max={todayKey}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-midnight-700 bg-midnight-950/40 px-3 py-1.5 text-sm text-moon-100 focus:border-nebula-400/60 focus:outline-none"
            />
          </div>

          <h2 className="mt-5 text-lg font-medium text-moon-100">Did you remember a dream?</h2>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setRecalled(true)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                recalled === true
                  ? 'border-aurora-400/60 bg-aurora-400/10 text-aurora-300'
                  : 'border-midnight-700 text-moon-100 hover:border-nebula-400/60'
              }`}
            >
              Yes, I remember it
            </button>
            <button
              onClick={() => setRecalled(false)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                recalled === false
                  ? 'border-red-400/60 bg-red-400/10 text-red-300'
                  : 'border-midnight-700 text-moon-100 hover:border-nebula-400/60'
              }`}
            >
              No, nothing
            </button>
          </div>

          {recalled === true && (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-moon-300">What happened?</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="I was walking through a hallway that kept rearranging itself..."
                  className="mt-2 w-full rounded-lg border border-midnight-700 bg-midnight-950/40 p-3 text-sm text-moon-100 placeholder:text-moon-500 focus:border-nebula-400/60 focus:outline-none"
                />
              </div>

              <div>
                {/* No suggested-tag picker — dream-sign tagging will run through AI later. For now, tags are added manually only. */}
                <p className="text-sm text-moon-300">Dream signs</p>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="rounded-full border border-nebula-400/60 bg-nebula-500/20 px-3 py-1 text-xs text-nebula-300"
                      >
                        {tag} &times;
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomTag()
                      }
                    }}
                    placeholder="Add a symbol you noticed…"
                    className="flex-1 rounded-lg border border-midnight-700 bg-midnight-950/40 px-3 py-1.5 text-sm text-moon-100 placeholder:text-moon-500 focus:border-nebula-400/60 focus:outline-none"
                  />
                  <button
                    onClick={addCustomTag}
                    className="rounded-lg border border-midnight-700 px-3 py-1.5 text-sm text-moon-300 hover:border-nebula-400/60"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {recalled === false && (
            <p className="mt-5 text-sm text-moon-300">
              That's okay — keep a journal within reach and try replaying the last thought before
              you slept.
            </p>
          )}

          {recalled !== null && (
            <button
              onClick={handleSave}
              className="mt-5 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
            >
              {isNewEntry ? 'Save entry' : 'Update entry'}
            </button>
          )}

          {essenceEarned > 0 && (
            <div className="mt-4">
              <EssencePop amount={essenceEarned} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-moon-100">
          History <span className="text-sm font-normal text-moon-500">· {history.length} nights logged</span>
        </h2>

        {history.length === 0 && (
          <p className="text-sm text-moon-500">Nothing logged yet — your first entry will show up here.</p>
        )}

        <ul className="space-y-3">
          {history.map((entry) => (
            <li
              key={entry.date}
              className={`rounded-2xl border p-5 ${
                entry.date === selectedDate
                  ? 'border-nebula-400/60 bg-nebula-500/5'
                  : 'border-midnight-700 bg-midnight-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-moon-100">{formatDateLabel(entry.date)}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      entry.recalled ? 'bg-aurora-400/15 text-aurora-300' : 'bg-midnight-700 text-moon-500'
                    }`}
                  >
                    {entry.recalled ? 'Recalled' : 'No recall'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(entry.date)}
                  className="shrink-0 text-xs text-moon-500 hover:text-nebula-300"
                >
                  Edit
                </button>
              </div>

              {entry.note && <p className="mt-3 text-sm text-moon-300">"{entry.note}"</p>}

              {entry.dreamSigns.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.dreamSigns.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-midnight-700 px-2.5 py-0.5 text-xs text-moon-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
