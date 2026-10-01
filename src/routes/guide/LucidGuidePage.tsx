import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { primaryButtonClass, secondaryButtonClass } from '../../styles/ui'

// A short how-to for lucid dreaming: three daily practices, and what actually makes them work.

const practices = [
  {
    icon: '👁',
    title: 'Stay aware all day',
    body: 'Keep noticing where you are and what you’re doing. Dreams copy your waking habits: if you’re aware while awake, you start being aware in dreams too.',
  },
  {
    icon: '✋',
    title: 'Do reality checks',
    body: 'Several times a day, stop and honestly ask “Am I dreaming?” Pinch your nose and try to breathe, or read some text twice. In a dream, air still flows and words change.',
  },
  {
    icon: '☾',
    title: 'Write down your dreams',
    body: 'Every morning, before anything else, write what you remember, even a fragment. The more you recall, the more dreams you’ll recognise as dreams.',
  },
]

export default function LucidGuidePage() {
  useDocumentTitle('How to lucid dream')

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4 text-center">
        <Link to="/" className="text-sm text-nebula-300 hover:text-nebula-200">
          &larr; Back home
        </Link>
        <h1 className="font-serif text-4xl text-moon-100 sm:text-5xl">How to lucid dream</h1>
        <p className="text-lg text-moon-300">
          A lucid dream is one where you know you&apos;re dreaming while it&apos;s happening. Three
          practices, every day.
        </p>
      </header>

      <ol className="space-y-4">
        {practices.map((practice, i) => (
          <li
            key={practice.title}
            className="flex gap-4 rounded-2xl border border-midnight-700/60 bg-midnight-900/60 p-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-aurora-400/10 text-2xl" aria-hidden>
              {practice.icon}
            </span>
            <div>
              <p className="text-xs tracking-[0.3em] text-moon-500 uppercase">0{i + 1}</p>
              <h2 className="mt-1 font-serif text-xl text-moon-100">{practice.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-moon-300">{practice.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-3xl border border-nebula-400/30 bg-gradient-to-br from-nebula-500/15 via-midnight-900 to-aurora-400/10 p-6 text-center">
        <h2 className="font-serif text-2xl text-moon-100">The key: discipline and dream recall</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-moon-300">
          There&apos;s no trick. Do all three every single day, especially on the days it feels
          pointless. Recall comes first: you can&apos;t become lucid in a dream you don&apos;t
          remember.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/habits" className={primaryButtonClass}>
          Add reality checks to your habits
        </Link>
        <Link to="/dreams/new?from=journal" className={secondaryButtonClass}>
          Write last night&apos;s dream
        </Link>
      </div>
    </div>
  )
}
