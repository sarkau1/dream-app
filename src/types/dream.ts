export const DREAM_MOODS = ['Lucid', 'Nightmare', 'Recurring', 'Peaceful', 'Confusing'] as const
export type DreamMood = (typeof DREAM_MOODS)[number]

export interface DreamPost {
  id: string
  userId: string
  authorName: string
  title: string
  body: string
  mood: DreamMood | null
  symbols: string[]
  isPrivate: boolean
  createdAt: string
}
