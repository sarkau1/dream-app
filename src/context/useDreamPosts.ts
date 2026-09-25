import { createContext, useContext } from 'react'
import type { DreamInput, DreamPost } from '../types/dream'

// Lives apart from DreamPostProvider so that file only exports a component (keeps fast refresh working).
export interface DreamPostContextValue {
  dreams: DreamPost[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  createDream: (input: DreamInput) => Promise<{ error: string | null }>
  updateDream: (id: string, input: DreamInput) => Promise<{ error: string | null }>
  deleteDream: (id: string) => Promise<{ error: string | null }>
  getDream: (id: string) => Promise<{ dream: DreamPost | null; error: string | null }>
  myDreams: DreamPost[]
  loadingMyDreams: boolean
  myDreamsError: string | null
  refreshMyDreams: () => Promise<void>
}

export const DreamPostContext = createContext<DreamPostContextValue | undefined>(undefined)

export function useDreamPosts() {
  const ctx = useContext(DreamPostContext)
  if (!ctx) throw new Error('useDreamPosts must be used within a DreamPostProvider')
  return ctx
}
