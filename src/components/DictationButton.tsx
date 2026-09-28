import { useEffect, useRef, useState } from 'react'
import {
  DICTATION_LANGUAGES,
  dictationErrorMessage,
  getRecognition,
  loadDictationLanguage,
  saveDictationLanguage,
  type DictationLanguage,
  type Recognition,
} from '../lib/dictation'
import { fieldClass } from '../styles/ui'

/**
 * A mic button that types what you say. Each finished phrase goes to `onText`; the words still
 * being recognised show underneath until they settle. Renders nothing where the browser has no
 * speech recognition (e.g. Firefox).
 */
export default function DictationButton({ onText }: { onText: (text: string) => void }) {
  const [Recognizer] = useState(getRecognition)
  const [language, setLanguage] = useState<DictationLanguage>(loadDictationLanguage)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  // Read at result time, so a new onText from each render never restarts the recognition.
  const onTextRef = useRef(onText)
  useEffect(() => {
    onTextRef.current = onText
  })

  // Stop listening when the form goes away (saved, cancelled, navigated off).
  useEffect(() => () => recognitionRef.current?.abort(), [])

  if (!Recognizer) return null
  const languageLabel = DICTATION_LANGUAGES.find((l) => l.value === language)?.label ?? language

  function start() {
    if (!Recognizer) return
    const recognition = new Recognizer()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) onTextRef.current(result[0].transcript)
        else pending += result[0].transcript
      }
      setInterim(pending)
    }
    recognition.onerror = (event) => setError(dictationErrorMessage(event.error, languageLabel))
    // Browsers also end on their own after a pause in speech.
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      setInterim('')
    }
    recognitionRef.current = recognition
    setError(null)
    try {
      recognition.start()
      setListening(true)
    } catch {
      recognitionRef.current = null
      setError(dictationErrorMessage('', languageLabel))
    }
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  function changeLanguage(value: DictationLanguage) {
    // The language is fixed once listening starts, so stop and let the next tap use the new one.
    stop()
    setLanguage(value)
    saveDictationLanguage(value)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={listening ? stop : start}
          aria-pressed={listening}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
            listening
              ? 'border-rose-400/60 bg-rose-500/15 text-rose-200'
              : 'border-midnight-700 text-moon-300 hover:border-nebula-400/60 hover:text-moon-100'
          }`}
        >
          <span aria-hidden className={listening ? 'animate-pulse' : ''}>
            {listening ? '⏺' : '🎤'}
          </span>
          {listening ? 'Stop' : 'Speak your dream'}
        </button>
        <label htmlFor="dictation-language" className="sr-only">
          Voice typing language
        </label>
        <select
          id="dictation-language"
          value={language}
          onChange={(e) => changeLanguage(e.target.value as DictationLanguage)}
          className={`py-1.5 ${fieldClass}`}
        >
          {DICTATION_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" className="text-xs">
        {listening && (
          <p className="text-moon-400">
            {interim ? <span className="italic text-moon-300">{interim}…</span> : 'Listening…'}
          </p>
        )}
        {error && <p className="text-rose-400">{error}</p>}
        {listening && (
          <p className="mt-1 text-moon-500">
            Your browser turns speech into text; Chrome and Edge send the audio to their speech
            service to do it.
          </p>
        )}
      </div>
    </div>
  )
}
