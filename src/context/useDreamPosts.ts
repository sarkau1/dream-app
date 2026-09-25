import { createContext, useContext } from 'react'
import type { DreamInput, DreamPost, DreamSummary } from '../types/dream'

type Result = Promise<{ error: string | null }>

// Lives apart from DreamPostProvider so that file only exports a component (keeps fast refresh working).
export interface DreamPostContextValue {
  /** The community feed: shared dreams, newest first, a page at a time. */
  dreams: DreamPost[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  createDream: (input: DreamInput) => Result
  updateDream: (id: string, input: DreamInput) => Result
  setDreamPrivacy: (id: string, isPrivate: boolean) => Result
  deleteDream: (id: string) => Result
  getDream: (id: string) => Promise<{ dream: DreamPost | null; error: string | null }>
  /** Ids of the user's dreams whose full text contains `query` (case-insensitive). */
  searchMyDreamBodies: (query: string) => Promise<{ ids: string[]; error: string | null }>
  exportMyDreams: () => Promise<{ dreams: DreamPost[]; error: string | null }>
  /** All of the signed-in user's dreams, without full text (see DreamSummary). */
  myDreams: DreamSummary[]
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
