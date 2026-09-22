import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import dreamWalkData from '../../data/dreamWalk.json'
import type { DreamWalkChoice, DreamWalkGraph } from '../../types/dreamWalk'
import { useMetaProgress } from '../../context/MetaProgressContext'
import DiceFace from '../../components/DiceFace'
import EssencePop from '../../components/EssencePop'

const graph = dreamWalkData as DreamWalkGraph

const ESSENCE_FREE = 3
const ESSENCE_ROLL_SUCCESS = 6
const ESSENCE_ROLL_FAIL = 2
const ESSENCE_LOOP_BONUS = 10
const ESSENCE_RARE_ENDING = 25
const ROLL_TICKS = 8
const ROLL_TICK_MS = 70

const LOOPS_KEY = 'dreamapp:dreamwalk-loops'

function loadLifetimeLoops(): number {
  try {
    const raw = localStorage.getItem(LOOPS_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

type RollState = 'idle' | 'rolling' | 'done'

export default function DreamWalk() {
  const { earnEssence } = useMetaProgress()

  const [nodeId, setNodeId] = useState(graph.startId)
  const [history, setHistory] = useState<string[]>([graph.startId])
  const [runEssence, setRunEssence] = useState(0)
  const [loopCount, setLoopCount] = useState(0)
  const [lifetimeLoops, setLifetimeLoops] = useState(loadLifetimeLoops)

  const [rollState, setRollState] = useState<RollState>('idle')
  const [pendingChoice, setPendingChoice] = useState<DreamWalkChoice | null>(null)
  const [diceValue, setDiceValue] = useState(1)
  const [outcome, setOutcome] = useState<{ success: boolean; dc: number } | null>(null)

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    }
  }, [])

  const node = graph.nodes[nodeId]

  function advance(nextId: string, baseEssence: number) {
    const isLoop = nextId === graph.startId
    const isRareEnding = nextId === 'lucid-mastery'
    const earned = baseEssence + (isLoop ? ESSENCE_LOOP_BONUS : 0) + (isRareEnding ? ESSENCE_RARE_ENDING : 0)

    setRunEssence((e) => e + earned)
    earnEssence(earned)
    setHistory((h) => [...h, nextId])
    setNodeId(nextId)

    if (isLoop) {
      setLoopCount((c) => c + 1)
      setLifetimeLoops((prev) => {
        const next = prev + 1
        localStorage.setItem(LOOPS_KEY, String(next))
        return next
      })
    }
  }

  function selectChoice(choice: DreamWalkChoice) {
    if (rollState !== 'idle') return
    if (choice.roll) {
      setPendingChoice(choice)
      setOutcome(null)
      setRollState('rolling')
      let ticks = 0
      rollIntervalRef.current = setInterval(() => {
        setDiceValue(1 + Math.floor(Math.random() * 6))
        ticks += 1
        if (ticks >= ROLL_TICKS) {
          if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
          const result = 1 + Math.floor(Math.random() * 6)
          setDiceValue(result)
          setOutcome({ success: result >= choice.roll!.dc, dc: choice.roll!.dc })
          setRollState('done')
        }
      }, ROLL_TICK_MS)
    } else if (choice.next) {
      advance(choice.next, ESSENCE_FREE)
    }
  }

  function continueAfterRoll() {
    if (!pendingChoice?.roll || !outcome) return
    const nextId = outcome.success ? pendingChoice.roll.success : pendingChoice.roll.failure
    const essence = outcome.success ? ESSENCE_ROLL_SUCCESS : ESSENCE_ROLL_FAIL
    advance(nextId, essence)
    setPendingChoice(null)
    setOutcome(null)
    setRollState('idle')
  }

  function restart() {
    setNodeId(graph.startId)
    setHistory([graph.startId])
    setRunEssence(0)
    setLoopCount(0)
    setRollState('idle')
    setPendingChoice(null)
    setOutcome(null)
  }

  const trail = history.slice(-6).map((id) => graph.nodes[id].title)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        <div className="flex items-center gap-2 text-xs text-moon-500">
          {loopCount > 0 && (
            <span className="rounded-full bg-nebula-500/20 px-2.5 py-1 text-nebula-300">
              Loop {loopCount}
            </span>
          )}
          <span>Lifetime loops: {lifetimeLoops}</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Dream Walk</h1>
        <p className="mt-2 text-moon-300">
          A branching lucid dream. Some choices are free — the story just continues. Others ask
          for a roll: meet or beat the difficulty and you get the stronger outcome, miss it and the
          dream bends a different way. Either way, you keep what you learn.
        </p>
      </div>

      {trail.length > 1 && (
        <p className="text-xs text-moon-500">
          Path so far: {trail.join(' → ')}
        </p>
      )}

      <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-medium text-moon-100">{node.title}</h2>
          {node.character && (
            <span className="rounded-full border border-nebula-400/40 bg-nebula-500/10 px-2.5 py-0.5 text-xs text-nebula-300">
              {node.character}
            </span>
          )}
        </div>
        <p className="mt-3 text-moon-300">{node.text}</p>

        {rollState === 'idle' && !node.terminal && (
          <div className="mt-5 space-y-2">
            {node.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => selectChoice(choice)}
                className="w-full rounded-lg border border-midnight-700 bg-midnight-950/40 px-4 py-3 text-left text-sm text-moon-100 transition-colors hover:border-nebula-400/60"
              >
                <span>{choice.label}</span>
                {choice.roll && (
                  <span className="ml-2 text-xs text-aurora-300">
                    🎲 need {choice.roll.dc}+ on a d6
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {rollState !== 'idle' && pendingChoice?.roll && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-midnight-700 bg-midnight-950/50 p-6">
            <p className="text-sm text-moon-300">{pendingChoice.label}</p>
            <DiceFace value={diceValue} rolling={rollState === 'rolling'} />
            {rollState === 'rolling' && <p className="text-xs text-moon-500">Rolling…</p>}
            {rollState === 'done' && outcome && (
              <>
                <p
                  className={`text-sm font-medium ${
                    outcome.success ? 'text-aurora-300' : 'text-red-300'
                  }`}
                >
                  Rolled {diceValue} vs DC {outcome.dc} — {outcome.success ? 'success' : 'failure'}
                </p>
                <button
                  onClick={continueAfterRoll}
                  className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        )}

        {node.terminal && (
          <div className="mt-6 text-center">
            <p className="text-sm uppercase tracking-wide text-aurora-300">Rare ending reached</p>
            <div className="mt-3 flex justify-center">
              <EssencePop amount={runEssence} />
            </div>
            <button
              onClick={restart}
              className="mt-5 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
            >
              Walk again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
