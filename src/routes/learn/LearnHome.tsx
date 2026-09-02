import { Link } from 'react-router-dom'
import { lessons } from '../../data/lessons'
import { useProgress } from '../../context/ProgressContext'

export default function LearnHome() {
  const { isLessonComplete, completedLessons } = useProgress()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Learn</h1>
        <p className="mt-2 text-moon-300">
          {completedLessons.length} of {lessons.length} lessons complete.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {lessons.map((lesson) => {
          const complete = isLessonComplete(lesson.slug)
          return (
            <Link
              key={lesson.slug}
              to={`/learn/${lesson.slug}`}
              className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-5 transition-colors hover:border-nebula-400/60 hover:bg-midnight-800/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-medium text-moon-100">{lesson.title}</h2>
                {complete && (
                  <span className="shrink-0 rounded-full bg-aurora-400/15 px-2 py-0.5 text-xs text-aurora-300">
                    Done
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-moon-300">{lesson.summary}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
