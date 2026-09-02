import type { ForumThread } from '../types/forum'

export const seedForumThreads: ForumThread[] = [
  {
    id: 'thread-1',
    title: 'MILD finally worked for me after 3 weeks of journaling',
    category: 'Techniques',
    createdAt: '2026-08-20T21:14:00.000Z',
    posts: [
      {
        id: 'thread-1-post-1',
        author: 'NightOwl',
        body: 'Stuck with the journal every morning even when I "remembered nothing," and last night the MILD mantra actually carried through. Noticed the light switches in my dream didn\'t work, questioned it, and got lucid for what felt like ten minutes.',
        createdAt: '2026-08-20T21:14:00.000Z',
      },
      {
        id: 'thread-1-post-2',
        author: 'Voidwalker',
        body: 'Light switches not working is such a common one. Congrats! Did you pair it with WBTB or just straight to bed?',
        createdAt: '2026-08-21T07:02:00.000Z',
      },
    ],
  },
  {
    id: 'thread-2',
    title: 'Best reality check that actually works for you?',
    category: 'Techniques',
    createdAt: '2026-08-18T10:00:00.000Z',
    posts: [
      {
        id: 'thread-2-post-1',
        author: 'Voidwalker',
        body: 'Curious what people\'s go-to reality check is. I do the nose-pinch-breathe one and it\'s caught two dreams for me this month.',
        createdAt: '2026-08-18T10:00:00.000Z',
      },
      {
        id: 'thread-2-post-2',
        author: 'Selene',
        body: 'Hands and text, always. My hands look subtly wrong in almost every dream once I actually look for it.',
        createdAt: '2026-08-18T15:41:00.000Z',
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'How do you deal with recurring nightmares before trying lucidity?',
    category: 'Nightmares',
    createdAt: '2026-08-15T02:30:00.000Z',
    posts: [
      {
        id: 'thread-3-post-1',
        author: 'Selene',
        body: 'I get the same "being chased" dream a couple times a month. Wondering if I should try to get lucid in it specifically or if that\'s a bad idea while it\'s still distressing.',
        createdAt: '2026-08-15T02:30:00.000Z',
      },
    ],
  },
  {
    id: 'thread-4',
    title: 'Recall was terrible for months, then suddenly clicked',
    category: 'Dream Recall',
    createdAt: '2026-08-10T18:20:00.000Z',
    posts: [
      {
        id: 'thread-4-post-1',
        author: 'NightOwl',
        body: 'For the longest time I woke up with absolutely nothing. What changed it for me was lying completely still for a minute before reaching for my phone. Recall went from zero to multiple dreams a night within two weeks.',
        createdAt: '2026-08-10T18:20:00.000Z',
      },
    ],
  },
  {
    id: 'thread-5',
    title: 'Welcome — introduce yourself and share your goals',
    category: 'General',
    createdAt: '2026-08-01T09:00:00.000Z',
    posts: [
      {
        id: 'thread-5-post-1',
        author: 'Selene',
        body: 'New here — mostly interested in using lucid dreams to practice public speaking without the real-world stakes. Anyone else using lucidity for skill rehearsal?',
        createdAt: '2026-08-01T09:00:00.000Z',
      },
    ],
  },
]
