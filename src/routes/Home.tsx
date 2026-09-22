import { Link } from 'react-router-dom'
import { dreamSignFacts } from '../data/dreamSigns'
import SpinningTotem from '../components/SpinningTotem'

const sections = [
  {
    to: '/learn',
    title: 'Learn',
    description: 'Work through lessons on reality checks, MILD, WBTB, and dream journaling.',
  },
  {
    to: '/journal',
    title: 'Journal',
    description: 'Log what you recall each morning and build a searchable history of your dreams.',
  },
  {
    to: '/forum',
    title: 'Forum',
    description: 'Swap techniques, dream reports, and questions with other dreamers.',
  },
  {
    to: '/games',
    title: 'Games',
    description: 'Sharpen your dream-sign recognition with quick, playable quizzes.',
  },
]

function factOfTheDay() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  return dreamSignFacts[dayOfYear % dreamSignFacts.length]
}

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold text-moon-100 sm:text-5xl">
            Learn to notice you&apos;re dreaming.
          </h1>
          <p className="text-lg text-moon-300">
            A hands-on space for building the habits that lead to lucid dreams — reality checks,
            dream journaling, and induction techniques — plus a community and a few games to
            practice on.
          </p>
        </div>
        <SpinningTotem />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="group rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6 transition-colors hover:border-nebula-400/60 hover:bg-midnight-800/60"
          >
            <h2 className="text-xl font-medium text-moon-100 group-hover:text-nebula-300">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-moon-300">{section.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-aurora-400/30 bg-aurora-400/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-aurora-300">
          Dream sign of the day
        </h3>
        <p className="mt-2 text-moon-100">{factOfTheDay()}</p>
      </section>

      <section className="rounded-2xl border border-dashed border-midnight-700 p-6">
        <span className="rounded-full bg-midnight-700 px-2 py-0.5 text-xs text-moon-300">
          Coming soon
        </span>
        <h3 className="mt-3 text-lg font-medium text-moon-300">Mobile app</h3>
        <p className="mt-2 text-sm text-moon-500">
          A companion app for jotting dreams down the moment you wake up, with your journal,
          progress, and forum activity synced with this site.
        </p>
      </section>
    </div>
  )
}
