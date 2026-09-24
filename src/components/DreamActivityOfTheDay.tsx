import { useState } from 'react'
import { activityIndexForToday, dreamActivities } from '../data/dreamActivities'

export default function DreamActivityOfTheDay() {
  const todayIndex = activityIndexForToday()
  const [index, setIndex] = useState(todayIndex)
  const activity = dreamActivities[index]

  function shuffle() {
    let next = index
    while (next === index) next = Math.floor(Math.random() * dreamActivities.length)
    setIndex(next)
  }

  return (
    <section className="rounded-2xl border border-nebula-400/30 bg-gradient-to-br from-nebula-500/10 via-midnight-900/60 to-aurora-400/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-nebula-300">
          {index === todayIndex ? 'Dream activity of the day' : 'Another dream activity'}
        </h3>
        <div className="flex shrink-0 gap-3 text-xs">
          {index !== todayIndex && (
            <button
              onClick={() => setIndex(todayIndex)}
              className="text-moon-400 hover:text-moon-100"
            >
              Back to today&apos;s
            </button>
          )}
          <button onClick={shuffle} className="text-nebula-300 hover:text-nebula-200">
            🎲 Shuffle
          </button>
        </div>
      </div>
      <p className="mt-3 text-xl font-medium text-moon-100">{activity.title}</p>
      <p className="mt-2 text-moon-300">{activity.description}</p>
    </section>
  )
}
