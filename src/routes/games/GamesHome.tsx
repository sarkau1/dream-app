import { Link } from 'react-router-dom'
import { useProgress } from '../../context/ProgressContext'
import { useDreamStreak } from '../../context/DreamStreakContext'
import { useMetaProgress } from '../../context/MetaProgressContext'
import GameCard from '../../components/GameCard'

export default function GamesHome() {
  const { quizBestScore } = useProgress()
  const { currentStreak, longestStreak } = useDreamStreak()
  const { totalEssence, currentRegion, nextRegion } = useMetaProgress()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Games</h1>
          <p className="mt-2 text-moon-300">
            Quick, playable ways to build recall, reflexes, and reality-check habits.
          </p>
        </div>
        <Link
          to="/atlas"
          className="rounded-2xl border border-aurora-400/30 bg-aurora-400/5 px-5 py-3 text-right transition-colors hover:border-aurora-400/60"
        >
          <p className="text-xs uppercase tracking-wide text-moon-500">Dream Essence</p>
          <p className="text-xl font-semibold text-aurora-300">{totalEssence}</p>
          <p className="mt-0.5 text-xs text-moon-500">
            {currentRegion.name}
            {nextRegion ? ` → ${nextRegion.name}` : ' · atlas complete'}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GameCard
          to="/games/dream-streak"
          icon="🌙"
          title="Dream Streak"
          description="Log your dream recall every morning and drill reality checks all day to build toward lucid dreams."
          stat={
            currentStreak > 0
              ? `Current streak: ${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}${
                  longestStreak > currentStreak ? ` · best: ${longestStreak}` : ''
                }`
              : longestStreak > 0
                ? `Best streak: ${longestStreak} days`
                : 'Start your streak today'
          }
        />

        <GameCard
          to="/games/dream-sign-quiz"
          icon="🧠"
          title="Dream-Sign Reality Check"
          description="Spot the dream sign in each scenario before time runs out on your streak."
          stat={quizBestScore !== null ? `Best score: ${quizBestScore}` : undefined}
        />

        <GameCard
          to="/games/reflex-rift"
          icon="✦"
          title="Reflex Rift"
          description="Tap the glitching anomalies before they vanish. Fast, arcade-style dream-sign spotting."
          stat="30-second rounds · combo scoring"
        />

        <GameCard
          to="/games/memory-fold"
          icon="🃏"
          title="Memory Fold"
          description="Flip and match pairs of dream-sign symbols. Fewer moves earns more Dream Essence."
          stat="16-card match · beat your move count"
        />

        <GameCard
          to="/games/dream-walk"
          icon="🎲"
          title="Dream Walk"
          description="A branching lucid dream you walk through choice by choice — some rolled on a d6, some free. Every path teaches something, and always finds its way home."
          stat="Branching story · roll to resolve risk"
        />
      </div>
    </div>
  )
}
