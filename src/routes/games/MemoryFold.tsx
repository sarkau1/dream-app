import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { memorySymbols } from '../../data/memorySymbols'
import { useMetaProgress } from '../../context/MetaProgressContext'
import EssencePop from '../../components/EssencePop'

const BEST_MOVES_KEY = 'dreamapp:memory-best-moves'
const RESOLVE_MATCH_MS = 300
const RESOLVE_MISS_MS = 700

interface CardState {
  id: number
  symbolId: string
  icon: string
  label: string
}

function shuffledDeck(): CardState[] {
  const deck = memorySymbols.flatMap((symbol, i) => [
    { id: i * 2, symbolId: symbol.id, icon: symbol.icon, label: symbol.label },
    { id: i * 2 + 1, symbolId: symbol.id, icon: symbol.icon, label: symbol.label },
  ])
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function loadBestMoves(): number | null {
  try {
    const raw = localStorage.getItem(BEST_MOVES_KEY)
    const n = raw ? Number(raw) : null
    return n !== null && Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export default function MemoryFold() {
  const { earnEssence } = useMetaProgress()
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [cards, setCards] = useState<CardState[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [bestMoves, setBestMoves] = useState<number | null>(loadBestMoves)
  const [essenceEarned, setEssenceEarned] = useState(0)

  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function finishGame(finalMoves: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('finished')
    const earned = Math.max(15, 90 - finalMoves * 3)
    setEssenceEarned(earned)
    earnEssence(earned)
    setBestMoves((prev) => {
      const next = prev === null ? finalMoves : Math.min(prev, finalMoves)
      localStorage.setItem(BEST_MOVES_KEY, String(next))
      return next
    })
  }

  function startGame() {
    if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setCards(shuffledDeck())
    setFlipped([])
    setMatched(new Set())
    setMoves(0)
    setElapsed(0)
    setEssenceEarned(0)
    setStatus('playing')
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }

  function handleFlip(index: number) {
    if (status !== 'playing') return
    if (flipped.length === 2) return
    if (flipped.includes(index) || matched.has(index)) return

    const nextFlipped = [...flipped, index]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      const newMoves = moves + 1
      setMoves(newMoves)
      const [a, b] = nextFlipped
      const isMatch = cards[a].symbolId === cards[b].symbolId
      resolveTimeoutRef.current = setTimeout(
        () => {
          if (isMatch) {
            setMatched((prev) => {
              const next = new Set(prev).add(a).add(b)
              if (next.size === cards.length) finishGame(newMoves)
              return next
            })
          }
          setFlipped([])
        },
        isMatch ? RESOLVE_MATCH_MS : RESOLVE_MISS_MS,
      )
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        {status === 'playing' && (
          <span className="text-sm text-moon-500">
            Moves: {moves} · {elapsed}s
          </span>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Memory Fold</h1>
        <p className="mt-2 text-moon-300">
          Flip pairs to match dream-sign categories with their symbols. Fewer moves, more Dream
          Essence.
        </p>
      </div>

      {status === 'idle' && (
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-8 text-center">
          <p className="text-sm text-moon-300">16 cards, 8 dream-sign pairs. Clear the board.</p>
          {bestMoves !== null && <p className="mt-3 text-xs text-moon-500">Best: {bestMoves} moves</p>}
          <button
            onClick={startGame}
            className="mt-5 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            Shuffle & start
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="grid grid-cols-4 gap-3">
          {cards.map((card, index) => {
            const isFaceUp = flipped.includes(index) || matched.has(index)
            return (
              <div key={card.id} className="card-flip-scene aspect-square">
                <button
                  onClick={() => handleFlip(index)}
                  disabled={isFaceUp}
                  className={`card-flip-inner h-full w-full ${isFaceUp ? 'is-flipped' : ''}`}
                >
                  <span className="card-flip-face flex items-center justify-center rounded-xl border border-midnight-700 bg-midnight-900/80 text-2xl text-nebula-400">
                    ✧
                  </span>
                  <span className="card-flip-face is-back flex flex-col items-center justify-center gap-1 rounded-xl border border-nebula-400/50 bg-midnight-800/90 p-1 text-center">
                    <span className="text-xl">{card.icon}</span>
                    <span className="text-[9px] leading-tight text-moon-300">{card.label}</span>
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {status === 'finished' && (
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-8 text-center">
          <h2 className="text-2xl font-semibold text-moon-100">Board cleared</h2>
          <p className="mt-3 text-4xl font-semibold text-nebula-300">{moves} moves</p>
          <p className="mt-1 text-sm text-moon-500">
            In {elapsed}s · Best: {bestMoves} moves
          </p>
          <div className="mt-4 flex justify-center">
            <EssencePop amount={essenceEarned} />
          </div>
          <button
            onClick={startGame}
            className="mt-6 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
