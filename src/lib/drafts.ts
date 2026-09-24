import type { DreamInput } from '../types/dream'

// Unsaved DreamForm contents, kept in localStorage so a dream typed half-awake survives a closed
// tab or a failed save. Keys are per user (see draftKey) and all drafts are cleared on sign-out,
// since they can hold private dreams and the browser may be shared.
const PREFIX = 'dreamapp:draft:'

export function draftKey(userId: string, dreamId: string | null): string {
  return `${PREFIX}${userId}:${dreamId ?? 'new'}`
}

// Every accessor is wrapped: storage can throw in private windows or when site data is blocked,
// and a draft is a convenience that must never break writing a dream.
export function loadDraft(key: string): DreamInput | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as DreamInput) : null
  } catch {
    return null
  }
}

export function saveDraft(key: string, values: DreamInput) {
  try {
    localStorage.setItem(key, JSON.stringify(values))
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
