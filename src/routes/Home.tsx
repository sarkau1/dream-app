import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const sections = [
  {
    to: '/journal',
    title: 'Journal',
    description: 'Write down your dreams, keep them private, and choose which ones to share.',
  },
  {
    to: '/dreams',
    title: 'Dream Feed',
    description: 'Read the dreams other dreamers chose to share with the community.',
  },
  {
    to: '/web',
    title: 'Dream Web',
    description: 'See how the symbols in your dreams connect and which ones keep coming back.',
  },
]

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold text-moon-100 sm:text-5xl">
          Learn to notice you&apos;re dreaming.
        </h1>
        <p className="text-lg text-moon-300">
          Journal your dreams, spot the signs that repeat, and share the ones you want with the
          community. Log a lucid dream to earn <span className="text-aurora-300">✦ Dream Essence</span>.
        </p>
        {!loading && (
          <div className="flex flex-wrap gap-3 pt-2">
            {user ? (
              <Link
                to="/dreams/new?from=journal"
                className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
              >
                Write last night&apos;s dream
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
                >
                  Start your journal
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-midnight-700 px-5 py-2 text-sm text-moon-300 hover:text-moon-100"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
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
    </div>
  )
}
