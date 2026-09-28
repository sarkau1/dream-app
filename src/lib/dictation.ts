// Voice typing through the browser's own speech recognition (the Web Speech API): free, no
// server or key. Chrome and Edge support it (Chrome sends the audio to Google to transcribe);
// Safari only for the languages Apple dictation knows; Firefox not at all.

export const DICTATION_LANGUAGES = [
  { value: 'lt-LT', label: 'Lietuvių' },
  { value: 'en-US', label: 'English' },
] as const

export type DictationLanguage = (typeof DICTATION_LANGUAGES)[number]['value']

const LANGUAGE_KEY = 'dreamapp:dictation-lang'

// Only the pieces of the API used here; TypeScript's DOM types don't include it everywhere.
export interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

export interface RecognitionResultEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type RecognitionConstructor = new () => Recognition

export function getRecognition(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** The language picked last time, else Lithuanian for Lithuanian browsers, else English. */
export function loadDictationLanguage(): DictationLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (DICTATION_LANGUAGES.some((language) => language.value === saved)) {
      return saved as DictationLanguage
    }
  } catch {
    // Storage blocked: fall through to the browser's language.
  }
  return navigator.language.toLowerCase().startsWith('lt') ? 'lt-LT' : 'en-US'
}

export function saveDictationLanguage(language: DictationLanguage) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language)
  } catch {
    // Storage blocked: the choice just won't be remembered.
  }
}

/**
 * Adds a stretch of dictated speech to what's already written. Speech recognition gives
 * lowercase text without much punctuation, so it starts a new sentence with a capital and
 * separates the pieces with a space.
 */
export function appendDictation(body: string, spoken: string, maxLength = Infinity): string {
  const text = spoken.trim().replace(/\s+/g, ' ')
  if (!text) return body
  const startsSentence = body.trim() === '' || /[.!?…]\s*$/.test(body)
  const piece = startsSentence ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text
  const separator = body === '' || /\s$/.test(body) ? '' : ' '
  return (body + separator + piece).slice(0, maxLength)
}

/** What went wrong, in words, for the error codes speech recognition reports. */
export function dictationErrorMessage(code: string, languageLabel: string): string | null {
  switch (code) {
    case 'aborted':
      return null
    case 'no-speech':
      return 'Didn’t hear anything. Tap the mic and try again.'
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it for this site in your browser settings.'
    case 'audio-capture':
      return 'No microphone was found.'
    case 'network':
      return 'Voice typing needs an internet connection in this browser.'
    case 'language-not-supported':
      return `This browser can’t transcribe ${languageLabel}. Try Chrome, or the other language.`
    default:
      return 'Voice typing stopped unexpectedly. Try again.'
  }
}
