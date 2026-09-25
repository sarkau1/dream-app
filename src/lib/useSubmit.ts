import { useCallback, useState } from 'react'

type Action = () => Promise<{ error: string | null }>

/**
 * The pending / error / done state every form repeats. `run` awaits an action that returns
 * `{ error }` (as the auth and dream contexts do) and resolves to whether it succeeded.
 */
export function useSubmit() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const run = useCallback(async (action: Action) => {
    setPending(true)
    setError(null)
    setDone(false)
    const { error: actionError } = await action()
    setPending(false)
    setError(actionError)
    setDone(!actionError)
    return !actionError
  }, [])

  /** Show a problem found before submitting (e.g. passwords don't match). */
  const fail = useCallback((message: string) => {
    setError(message)
    setDone(false)
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setDone(false)
  }, [])

  return { pending, error, done, run, fail, reset }
}
