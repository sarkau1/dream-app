import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ProgressState {
  completedLessons: string[]
  quizBestScore: number | null
}

interface ProgressContextValue extends ProgressState {
  isLessonComplete: (slug: string) => boolean
  toggleLessonComplete: (slug: string) => void
  reportQuizScore: (score: number) => void
}

const STORAGE_KEY = 'dreamapp:progress'

const defaultState: ProgressState = {
  completedLessons: [],
  quizBestScore: null,
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      quizBestScore: typeof parsed.quizBestScore === 'number' ? parsed.quizBestScore : null,
    }
  } catch {
    return defaultState
  }
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function isLessonComplete(slug: string) {
    return state.completedLessons.includes(slug)
  }

  function toggleLessonComplete(slug: string) {
    setState((prev) => {
      const isComplete = prev.completedLessons.includes(slug)
      return {
        ...prev,
        completedLessons: isComplete
          ? prev.completedLessons.filter((s) => s !== slug)
          : [...prev.completedLessons, slug],
      }
    })
  }

  function reportQuizScore(score: number) {
    setState((prev) => ({
      ...prev,
      quizBestScore: prev.quizBestScore === null ? score : Math.max(prev.quizBestScore, score),
    }))
  }

  return (
    <ProgressContext.Provider
      value={{ ...state, isLessonComplete, toggleLessonComplete, reportQuizScore }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
