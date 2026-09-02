import { Link, useParams } from 'react-router-dom'
import { lessons } from '../../data/lessons'
import { useProgress } from '../../context/ProgressContext'

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = lessons.find((l) => l.slug === slug)
  const { isLessonComplete, toggleLessonComplete } = useProgress()

  if (!lesson) {
    return (
      <div className="space-y-4">
        <p className="text-moon-300">Lesson not found.</p>
        <Link to="/learn" className="text-nebula-300 hover:underline">
          Back to Learn
        </Link>
      </div>
    )
  }

  const complete = isLessonComplete(lesson.slug)

  return (
    <article className="space-y-8">
      <div>
        <Link to="/learn" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Learn
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">{lesson.title}</h1>
        <p className="mt-2 text-moon-300">{lesson.summary}</p>
      </div>

      <div className="space-y-6">
        {lesson.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-medium text-nebula-300">{section.heading}</h2>
            <p className="mt-2 leading-relaxed text-moon-100">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-5">
        <h3 className="text-sm font-medium uppercase tracking-wide text-aurora-300">
          Key tips
        </h3>
        <ul className="mt-3 list-inside list-disc space-y-1 text-moon-100">
          {lesson.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <button
        onClick={() => toggleLessonComplete(lesson.slug)}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          complete
            ? 'bg-aurora-400/15 text-aurora-300 hover:bg-aurora-400/25'
            : 'bg-nebula-500 text-white hover:bg-nebula-400'
        }`}
      >
        {complete ? 'Marked complete ✓' : 'Mark as complete'}
      </button>
    </article>
  )
}
