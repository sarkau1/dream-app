import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EssencePop from './EssencePop'

/**
 * Shows the "+N Dream Essence" pop passed along in navigation state (see NewDreamPage), then
 * clears that state so a refresh or back-navigation doesn't show it again.
 */
export default function EssenceEarnedNotice() {
  const location = useLocation()
  const navigate = useNavigate()
  const [amount] = useState(
    () => (location.state as { essenceEarned?: number } | null)?.essenceEarned ?? 0,
  )

  useEffect(() => {
    if (location.state) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [location, navigate])

  return <EssencePop amount={amount} />
}
