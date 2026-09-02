import { Link } from 'react-router-dom'
import { useProgress } from '../../context/ProgressContext'

export default function GamesHome() {
  const { quizBestScore } = useProgress()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Games</h1>
        <p className="mt-2 text-moon-300">Quick, playable ways to sharpen your dream-sign recognition.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/games/dream-sign-quiz"
          className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6 transition-colors hover:border-nebula-400/60 hover:bg-midnight-800/60"
        >
          <h2 className="text-lg font-medium text-moon-100">Dream-Sign Reality Check</h2>
          <p className="mt-2 text-sm text-moon-300">
            Spot the dream sign in each scenario before time runs out on your streak.
          </p>
          {quizBestScore !== null && (
            <p className="mt-3 text-xs text-aurora-300">Best score: {quizBestScore}</p>
          )}
        </Link>

        <div className="rounded-2xl border border-dashed border-midnight-700 p-6 text-moon-500">
          <h2 className="text-lg font-medium text-moon-300">More games coming soon</h2>
          <p className="mt-2 text-sm">A dream journal pattern game and a technique simulator are next up.</p>
        </div>
      </div>
    </div>
  )
}
