import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMetaProgress } from '../../context/MetaProgressContext'
import EssencePop from '../../components/EssencePop'

const ROUND_SECONDS = 30
const SPAWN_INTERVAL_MS = 650
const BLIP_LIFETIME_MS = 950
const ANOMALY_CHANCE = 0.32
const BEST_KEY = 'dreamapp:reflex-best'

interface Blip {
  id: number
  kind: 'normal' | 'anomaly'
  left: number
  top: number
}

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export default function ReflexRift() {
  const { earnEssence } = useMetaProgress()
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [blips, setBlips] = useState<Blip[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [best, setBest] = useState(loadBest)
  const [essenceEarned, setEssenceEarned] = useState(0)
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null)

  const nextId = useRef(0)
  const scoreRef = useRef(0)
  const blipTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const multiplier = Math.min(4, 1 + Math.floor(combo / 5))

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  function clearTimers() {
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    blipTimeouts.current.forEach((t) => clearTimeout(t))
    blipTimeouts.current.clear()
  }

  useEffect(() => clearTimers, [])

  function removeBlip(id: number) {
    setBlips((prev) => prev.filter((b) => b.id !== id))
    const t = blipTimeouts.current.get(id)
    if (t) {
      clearTimeout(t)
      blipTimeouts.current.delete(id)
    }
  }

  function spawnBlip() {
    const id = nextId.current++
    const kind: Blip['kind'] = Math.random() < ANOMALY_CHANCE ? 'anomaly' : 'normal'
    const left = 8 + Math.random() * 84
    const top = 10 + Math.random() * 72
    setBlips((prev) => [...prev, { id, kind, left, top }])
    const timeout = setTimeout(() => {
      setBlips((prev) => prev.filter((b) => b.id !== id))
      blipTimeouts.current.delete(id)
      if (kind === 'anomaly') setCombo(0)
    }, BLIP_LIFETIME_MS)
    blipTimeouts.current.set(id, timeout)
  }

  function finishRound(finalScore: number) {
    clearTimers()
    setStatus('finished')
    setBlips([])
    const earned = Math.max(5, Math.floor(finalScore / 4))
    setEssenceEarned(earned)
    earnEssence(earned)
    setBest((prevBest) => {
      const next = Math.max(prevBest, finalScore)
      localStorage.setItem(BEST_KEY, String(next))
      return next
    })
  }

  function startRound() {
    clearTimers()
    setBlips([])
    setScore(0)
    setCombo(0)
    setTimeLeft(ROUND_SECONDS)
    setEssenceEarned(0)
    setStatus('playing')

    spawnIntervalRef.current = setInterval(spawnBlip, SPAWN_INTERVAL_MS)
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
  }

  useEffect(() => {
    if (status === 'playing' && timeLeft === 0) {
      finishRound(scoreRef.current)
    }
    // eslint-disable-next-line
  }, [timeLeft, status])

  function handleTap(blip: Blip) {
    removeBlip(blip.id)
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)

    if (blip.kind === 'anomaly') {
      setCombo((c) => c + 1)
      setScore((s) => s + 10 * multiplier)
      setFlash('hit')
    } else {
      setCombo(0)
      setScore((s) => Math.max(0, s - 5))
      setFlash('miss')
    }
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 300)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        {status === 'playing' && <span className="text-sm text-moon-500">{timeLeft}s left</span>}
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Reflex Rift</h1>
        <p className="mt-2 text-moon-300">
          Anomalies flicker across the rift. Tap only the glitchy ones before they vanish — tapping
          a normal one breaks your combo.
        </p>
      </div>

      {status === 'idle' && (
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-8 text-center">
          <p className="text-sm text-moon-300">
            Spot the <span className="text-nebula-300">glitching</span> symbols, ignore the plain
            ones. Chain hits to raise your multiplier.
          </p>
          {best > 0 && <p className="mt-3 text-xs text-moon-500">Best score: {best}</p>}
          <button
            onClick={startRound}
            className="mt-5 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            Start 30s round
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div>
          <div className="flex items-center justify-between text-sm text-moon-300">
            <span>
              Score: <span className="font-medium text-moon-100">{score}</span>
            </span>
            <span>
              Combo: <span className="font-medium text-aurora-300">{combo}</span> (x{multiplier})
            </span>
          </div>
          <div
            className={`relative mt-3 h-80 overflow-hidden rounded-2xl border bg-midnight-950/60 ${
              flash === 'hit'
                ? 'border-aurora-400/60'
                : flash === 'miss'
                  ? 'border-red-400/60'
                  : 'border-midnight-700'
            }`}
          >
            {blips.map((blip) => (
              <button
                key={blip.id}
                onClick={() => handleTap(blip)}
                style={{ left: `${blip.left}%`, top: `${blip.top}%` }}
                className={`blip-enter absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xl ${
                  blip.kind === 'anomaly'
                    ? 'border-nebula-400/70 bg-nebula-500/20 text-nebula-200'
                    : 'border-midnight-600 bg-midnight-800/80 text-moon-300'
                }`}
              >
                {blip.kind === 'anomaly' ? '✦' : '●'}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-8 text-center">
          <h2 className="text-2xl font-semibold text-moon-100">Rift closed</h2>
          <p className="mt-3 text-4xl font-semibold text-nebula-300">{score}</p>
          <p className="mt-1 text-sm text-moon-500">Best score: {best}</p>
          <div className="mt-4 flex justify-center">
            <EssencePop amount={essenceEarned} />
          </div>
          <button
            onClick={startRound}
            className="mt-6 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
