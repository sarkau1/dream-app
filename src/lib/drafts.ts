import type { DreamInput } from '../types/dream'

// Unsaved DreamForm (and ThoughtForm) contents, kept in localStorage so a dream typed half-awake survives a closed
// tab or a failed save. Keys are per user (see draftKey) and all drafts are cleared on sign-out,
// since they can hold private dreams and the browser may be shared.
const PREFIX = 'dreamapp:draft:'

/**
 * What was being typed, plus the saved version of the dream it started from, so a draft left on
 * one device can be recognised as out of date after the dream was edited somewhere else.
 */
export interface Draft<T = DreamInput> {
  values: T
  /** null for drafts saved before this was tracked */
  base: T | null
}

export function draftKey(userId: string, dreamId: string | null): string {
  return `${PREFIX}${userId}:${dreamId ?? 'new'}`
}

/** Same prefix as dream drafts, so signing out clears these too. */
export function thoughtDraftKey(userId: string, thoughtId: string | null): string {
  return `${PREFIX}${userId}:thought:${thoughtId ?? 'new'}`
}

// Every accessor is wrapped: storage can throw in private windows or when site data is blocked,
// and a draft is a convenience that must never break writing a dream.
export function loadDraft<T = DreamInput>(key: string): Draft<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft<T> | T
    // Older drafts were stored as the bare form values.
    return typeof parsed === 'object' && parsed !== null && 'values' in parsed
      ? (parsed as Draft<T>)
      : { values: parsed as T, base: null }
  } catch {
    return null
  }
}

export function saveDraft<T>(key: string, draft: Draft<T>) {
  try {
    localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // Quota exceeded or storage blocked: nothing useful to do.
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing to clear.
  }
}

export function clearAllDrafts() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // Storage blocked: nothing to clear.
  }
}

/** True when the saved dream changed after the draft was started (e.g. edited on another device). */
export function draftIsOutdated<T>(draft: Draft<T>, saved: T): boolean {
  return draft.base !== null && JSON.stringify(draft.base) !== JSON.stringify(saved)
}
