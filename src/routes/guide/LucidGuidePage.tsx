import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { cardClass, primaryButtonClass, secondaryButtonClass } from '../../styles/ui'

// A plain how-to for lucid dreaming built on all-day awareness: what to do, why it works, what
// the research says, and nothing that needs believing in.

const steps = [
  {
    title: 'Pick your triggers',
    body: 'Choose 3 to 5 moments that happen every day: walking through a doorway, picking up your phone, washing your hands. Add the things that keep showing up in your journal, your dream signs. When a trigger happens, you check.',
  },
  {
    title: 'Stop and actually doubt it',
    body: 'Ask "Am I dreaming right now?" and mean it. Look around for anything odd. Try to remember how you got here: in dreams you usually can\'t. A check done on autopilot teaches your brain nothing.',
  },
  {
    title: 'Do two physical checks',
    body: 'Pinch your nose and try to breathe through it: in a dream, air still flows. Then read some text, look away and read it again: in a dream, it changes. Two checks, because any single one can fool you.',
  },
  {
    title: 'Set the intention',
    body: 'Finish with one thought: "Next time I\'m dreaming, I\'ll notice." Picture yourself spotting something strange and realising it\'s a dream.',
  },
]

const plan = [
  { week: 'Week 1', focus: 'Write down every dream you remember, even fragments. Do 5 honest checks a day.' },
  { week: 'Week 2', focus: 'Read back through your journal and list your dream signs. Make them triggers. Aim for 10 checks a day.' },
  { week: 'Week 3', focus: 'Add MILD at bedtime: replay a recent dream, spot the dream sign, and imagine becoming lucid in it.' },
  { week: 'Week 4', focus: 'Twice a week, try Wake Back to Bed: set an alarm 5 hours after sleep, stay up 10–20 minutes, then go back to sleep doing MILD.' },
]

const myths = [
  ['You need supplements, binaural beats or special gear.', 'You don\'t. Habit and dream recall do the work.'],
  ['More reality checks are always better.', '10 real checks beat 50 mindless ones.'],
  ['It works in a few nights.', 'For most people the first lucid dream takes weeks. A month is a fair trial.'],
  ['It\'s worth losing sleep over.', 'It isn\'t. Bad sleep means worse recall and fewer dreams. Use Wake Back to Bed sparingly.'],
]

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`space-y-4 p-5 sm:p-6 ${cardClass}`}>
      <h2 className="text-xl font-medium text-moon-100">{title}</h2>
      {children}
    </section>
  )
}

export default function LucidGuidePage() {
  useDocumentTitle('How to lucid dream')

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <Link to="/" className="text-sm text-nebula-300 hover:text-nebula-200">
          &larr; Back home
        </Link>
        <h1 className="text-4xl font-semibold text-moon-100">How to lucid dream with all-day awareness</h1>
        <p className="text-lg text-moon-300">
          A lucid dream is one where you know you&apos;re dreaming while it&apos;s happening. Dreams
          copy your waking habits. If questioning reality becomes a habit while you&apos;re awake, it
          starts happening in your dreams too, and that&apos;s when you notice.
        </p>
      </header>

      <Card title="The technique, every day">
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-aurora-400/15 text-sm font-semibold text-aurora-300">
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium text-moon-100">{step.title}</h3>
                <p className="mt-1 text-sm text-moon-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Your 30 days">
        <dl className="space-y-3">
          {plan.map((p) => (
            <div key={p.week} className="grid gap-1 sm:grid-cols-[6rem_1fr]">
              <dt className="text-sm font-semibold text-nebula-300">{p.week}</dt>
              <dd className="text-sm text-moon-300">{p.focus}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="What the research says">
        <p className="text-sm text-moon-300">
          In an Australian study (Aspy et al., 2017), reality checks on their own didn&apos;t
          significantly increase lucid dreams. What worked best was combining them with Wake Back to
          Bed and MILD. So use awareness as the base, keep a journal, and add the night-time steps
          from week 3. Don&apos;t rely on checks alone.
        </p>
      </Card>

      <Card title="Once you're lucid">
        <p className="text-sm text-moon-300">
          The excitement often wakes you up. Stay calm, rub your hands together or look at the
          ground, and say out loud &ldquo;stay lucid&rdquo;. A first lucid dream lasting a few
          seconds still counts. Log it in your journal.
        </p>
      </Card>

      <Card title="Ignore these">
        <ul className="space-y-3">
          {myths.map(([myth, truth]) => (
            <li key={myth} className="text-sm">
              <p className="text-moon-500 line-through decoration-rose-400/60">{myth}</p>
              <p className="text-moon-200">{truth}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
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
