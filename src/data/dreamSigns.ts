import type { QuizQuestion } from '../types/quiz'

export const dreamSignQuestions: QuizQuestion[] = [
  {
    id: 'ds-1',
    prompt: 'You look at a clock, look away, then look back and the numbers have completely changed. What category of dream sign is this?',
    options: ['Text/detail instability', 'Impossible physics', 'Emotional intensity', 'Environment mismatch'],
    correctIndex: 0,
    explanation: 'Text, numbers, and fine detail rarely stay consistent in dreams — a classic and very reliable dream sign.',
  },
  {
    id: 'ds-2',
    prompt: 'In the dream, you step off a roof and glide gently to the ground instead of falling. What should this trigger?',
    options: ['Nothing, that\'s normal', 'A reality check', 'Waking up immediately', 'Writing it down later only'],
    correctIndex: 1,
    explanation: 'Impossible physics like flying or slow-falling is a strong dream sign — the right response is to reality check on the spot.',
  },
  {
    id: 'ds-3',
    prompt: 'You\'re in your childhood bedroom, but it opens directly into your current workplace. This is an example of:',
    options: ['A reality check', 'Environment mismatch', 'MILD technique', 'WBTB technique'],
    correctIndex: 1,
    explanation: 'Spaces that don\'t logically connect — like two unrelated places merging — are a common environment-based dream sign.',
  },
  {
    id: 'ds-4',
    prompt: 'A close friend appears in your dream but their face keeps subtly shifting and never looks quite right. This falls under:',
    options: ['People/character oddities', 'Text instability', 'Environment mismatch', 'Impossible physics'],
    correctIndex: 0,
    explanation: 'Familiar people looking almost-but-not-quite right is one of the most common dream sign categories.',
  },
  {
    id: 'ds-5',
    prompt: 'You push your finger into your palm during a dream and it passes straight through. What are you performing?',
    options: ['A reality check', 'WBTB', 'Dream journaling', 'A dream sign'],
    correctIndex: 0,
    explanation: 'This is the classic "finger through palm" reality check — a deliberate test, not a dream sign itself.',
  },
  {
    id: 'ds-6',
    prompt: 'You suddenly feel an overwhelming, unexplained wave of dread with no clear cause in the dream. This is best classified as:',
    options: ['Emotional intensity dream sign', 'Text instability', 'A successful reality check', 'MILD rehearsal'],
    correctIndex: 0,
    explanation: 'Strong emotion with no grounded cause is a frequently overlooked but very common dream sign category.',
  },
  {
    id: 'ds-7',
    prompt: 'Which habit is most effective for discovering your own personal, recurring dream signs?',
    options: ['Sleeping more', 'Reviewing your dream journal for patterns', 'Only doing reality checks in the shower', 'Avoiding naps'],
    correctIndex: 1,
    explanation: 'Your journal is the best source of personalized dream signs — recurring places, people, or oddities specific to you.',
  },
  {
    id: 'ds-8',
    prompt: 'Noticing a dream sign but doing nothing about it will:',
    options: ['Automatically trigger lucidity', 'Usually not lead to lucidity on its own', 'Wake you up instantly', 'Ruin dream recall'],
    correctIndex: 1,
    explanation: 'Noticing is only half the job — you have to follow through with a genuine reality check to convert it into lucidity.',
  },
]

export const dreamSignFacts: string[] = [
  'Unstable text is one of the most reliable dream signs — try reading something twice tonight.',
  'REM periods get longer later in the night, which is why early-morning naps are prime lucid dreaming territory.',
  'A reality check only works if you genuinely question your reality — going through the motions rarely transfers into dreams.',
  'Writing down dreams immediately on waking can double your recall within a couple of weeks.',
  'Flying, breathing underwater, and slow-motion falling are among the most common "impossible physics" dream signs.',
  'Recurring dream locations are personal dream signs — more powerful than any generic list.',
]
