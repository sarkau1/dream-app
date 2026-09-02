export const FORUM_CATEGORIES = ['Techniques', 'Dream Recall', 'Nightmares', 'General'] as const

export type ForumCategory = (typeof FORUM_CATEGORIES)[number]

export interface ForumPost {
  id: string
  author: string
  body: string
  createdAt: string
}

export interface ForumThread {
  id: string
  title: string
  category: ForumCategory
  createdAt: string
  posts: ForumPost[]
}
