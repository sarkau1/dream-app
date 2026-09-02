import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { seedForumThreads } from '../data/seedForumData'
import type { ForumCategory, ForumPost, ForumThread } from '../types/forum'

const THREADS_KEY = 'dreamapp:forum-threads'
const DISPLAY_NAME_KEY = 'dreamapp:display-name'

interface ForumContextValue {
  threads: ForumThread[]
  displayName: string | null
  setDisplayName: (name: string) => void
  createThread: (title: string, category: ForumCategory, body: string) => Promise<ForumThread>
  addReply: (threadId: string, body: string) => Promise<ForumPost>
}

function loadThreads(): ForumThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY)
    if (!raw) return seedForumThreads
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedForumThreads
  } catch {
    return seedForumThreads
  }
}

function loadDisplayName(): string | null {
  return localStorage.getItem(DISPLAY_NAME_KEY)
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const ForumContext = createContext<ForumContextValue | undefined>(undefined)

export function ForumProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ForumThread[]>(loadThreads)
  const [displayName, setDisplayNameState] = useState<string | null>(loadDisplayName)

  useEffect(() => {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads))
  }, [threads])

  function setDisplayName(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed)
    setDisplayNameState(trimmed)
  }

  async function createThread(title: string, category: ForumCategory, body: string) {
    const author = displayName ?? 'Dreamer'
    const now = new Date().toISOString()
    const thread: ForumThread = {
      id: makeId('thread'),
      title,
      category,
      createdAt: now,
      posts: [{ id: makeId('post'), author, body, createdAt: now }],
    }
    setThreads((prev) => [thread, ...prev])
    return thread
  }

  async function addReply(threadId: string, body: string) {
    const author = displayName ?? 'Dreamer'
    const post: ForumPost = {
      id: makeId('post'),
      author,
      body,
      createdAt: new Date().toISOString(),
    }
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, posts: [...thread.posts, post] } : thread,
      ),
    )
    return post
  }

  return (
    <ForumContext.Provider
      value={{ threads, displayName, setDisplayName, createThread, addReply }}
    >
      {children}
    </ForumContext.Provider>
  )
}

export function useForum() {
  const ctx = useContext(ForumContext)
  if (!ctx) throw new Error('useForum must be used within a ForumProvider')
  return ctx
}
