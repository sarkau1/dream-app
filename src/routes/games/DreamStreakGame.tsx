import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDreamStreak, getDateKeyOffset } from '../../context/DreamStreakContext'
import { useMetaProgress } from '../../context/MetaProgressContext'
import SpinningTotem from '../../components/SpinningTotem'
import EssencePop from '../../components/EssencePop'
import { ESSENCE_RECALLED, ESSENCE_NO_RECALL, ESSENCE_PER_REALITY_CHECK } from '../../data/essenceRewards'

function formatDayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' })
}

export default function DreamStreakGame() {
  const {
    todayEntry,
    currentStreak,
    longestStreak,
    totalRecalled,
    entries,
    todayKey,
    realityCheckGoal,
    logToday,
    addRealityCheck,
  } = useDreamStreak()
  const { earnEssence } = useMetaProgress()

  const [recalledChoice, setRecalledChoice] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [logEssenceEarned, setLogEssenceEarned] = useState(0)

  const alreadyLogged = todayEntry !== null
  const realityChecksToday = todayEntry?.realityChecks ?? 0
  const realityGoalMet = realityChecksToday >= realityCheckGoal

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
    if (recalledChoice === null) return
    logToday(recalledChoice, note, tags)
    const earned = recalledChoice ? ESSENCE_RECALLED : ESSENCE_NO_RECALL
    setLogEssenceEarned(earned)
    earnEssence(earned)
  }

  function handleRealityCheck() {
    if (realityGoalMet) return
    addRealityCheck()
    earnEssence(ESSENCE_PER_REALITY_CHECK)
  }

  const last7 = Array.from({ length: 7 }, (_, i) => getDateKeyOffset(-(6 - i)))

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        <span className="text-sm text-moon-500">{todayKey}</span>
      </div>

      <Link
        to="/journal/log"
        className="inline-block text-sm text-nebula-300 hover:text-nebula-200"
      >
        View recall log &rarr;
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Dream Streak</h1>
        <p className="mt-2 text-moon-300">
          Log your dream recall every morning and drill reality checks all day — the two habits
          that compound into lucid dreams.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-4 text-center">
          <p className="text-2xl font-semibold text-nebula-300">{currentStreak}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-moon-500">Current streak</p>
        </div>
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-4 text-center">
          <p className="text-2xl font-semibold text-aurora-300">{longestStreak}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-moon-500">Best streak</p>
        </div>
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-4 text-center">
          <p className="text-2xl font-semibold text-moon-100">{totalRecalled}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-moon-500">Dreams logged</p>
        </div>
      </div>

      <div className="flex justify-between gap-1">
        {last7.map((key) => {
          const entry = entries[key]
          const isToday = key === todayKey
          let dot = 'bg-midnight-700'
          if (entry?.recalled) dot = 'bg-aurora-400'
          else if (entry) dot = 'bg-red-400/60'
          return (
            <div key={key} className="flex flex-1 flex-col items-center gap-1">
              <span className={`h-3 w-3 rounded-full ${dot} ${isToday ? 'ring-2 ring-nebula-400/70' : ''}`} />
              <span className="text-[10px] text-moon-500">{formatDayLabel(key)}</span>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
        {!alreadyLogged ? (
          <>
            <h2 className="text-lg font-medium text-moon-100">Did you remember a dream last night?</h2>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRecalledChoice(true)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  recalledChoice === true
                    ? 'border-aurora-400/60 bg-aurora-400/10 text-aurora-300'
                    : 'border-midnight-700 text-moon-100 hover:border-nebula-400/60'
                }`}
              >
                Yes, I remember it
              </button>
              <button
                onClick={() => setRecalledChoice(false)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  recalledChoice === false
                    ? 'border-red-400/60 bg-red-400/10 text-red-300'
                    : 'border-midnight-700 text-moon-100 hover:border-nebula-400/60'
                }`}
              >
                No, nothing today
              </button>
            </div>

            {recalledChoice === true && (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-moon-300">Jot down what you recall (even a fragment counts):</p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="I was walking through a hallway that kept rearranging itself..."
                    className="mt-2 w-full rounded-lg border border-midnight-700 bg-midnight-950/40 p-3 text-sm text-moon-100 placeholder:text-moon-500 focus:border-nebula-400/60 focus:outline-none"
                  />
                </div>
                <div>
                  {/* No suggested-tag picker — dream-sign tagging will run through AI later. For now, tags are added manually only. */}
                  <p className="text-sm text-moon-300">Spot any dream signs?</p>
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

            {recalledChoice === false && (
              <p className="mt-5 text-sm text-moon-300">
                That's okay — keep a journal within reach and try replaying the last thought before
                you slept. Recall improves fast with practice.
              </p>
            )}

            {recalledChoice !== null && (
              <button
                onClick={handleSave}
                className="mt-5 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
              >
                Save today's log
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium text-moon-100">Today's log is saved</h2>
            {todayEntry?.recalled ? (
              <div className="mt-3 space-y-3">
                {todayEntry.note && <p className="text-sm text-moon-300">"{todayEntry.note}"</p>}
                {todayEntry.dreamSigns.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {todayEntry.dreamSigns.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-nebula-400/60 bg-nebula-500/20 px-3 py-1 text-xs text-nebula-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-moon-300">No recall today — come back tomorrow morning.</p>
            )}
            {logEssenceEarned > 0 && (
              <div className="mt-4">
                <EssencePop amount={logEssenceEarned} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
        <h2 className="text-lg font-medium text-moon-100">Reality check drill</h2>
        <p className="mt-2 text-sm text-moon-300">
          Genuinely question your reality right now — look at your hands, check a clock twice. Do
          this a handful of times today and it starts firing inside your dreams too.
        </p>

        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: realityCheckGoal }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${
                i < realityChecksToday ? 'bg-aurora-400' : 'bg-midnight-700'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-moon-500">
          {realityChecksToday} / {realityCheckGoal} reality checks today
        </p>

        {realityGoalMet ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <SpinningTotem />
            <p className="text-sm text-aurora-300">Goal met — that's a solid habit rep today.</p>
          </div>
        ) : (
          <button
            onClick={handleRealityCheck}
            className="mt-4 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            I just did a reality check (+{ESSENCE_PER_REALITY_CHECK} Essence)
          </button>
        )}
      </div>
    </div>
  )
}
