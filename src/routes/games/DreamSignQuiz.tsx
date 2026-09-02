import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dreamSignQuestions } from '../../data/dreamSigns'
import { useProgress } from '../../context/ProgressContext'
import SpinningTotem from '../../components/SpinningTotem'

export default function DreamSignQuiz() {
  const { quizBestScore, reportQuizScore } = useProgress()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = dreamSignQuestions[index]
  const isLast = index === dreamSignQuestions.length - 1

  function handleSelect(optionIndex: number) {
    if (selected !== null) return
    setSelected(optionIndex)
    if (optionIndex === question.correctIndex) {
      setScore((s) => s + 1)
    }
  }

  function handleNext() {
    if (isLast) {
      reportQuizScore(score)
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

  function handleRestart() {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="max-w-xl space-y-6">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-8 text-center">
          <h1 className="text-2xl font-semibold text-moon-100">Round complete</h1>
          <p className="mt-3 text-4xl font-semibold text-nebula-300">
            {score} / {dreamSignQuestions.length}
          </p>
          {quizBestScore !== null && (
            <p className="mt-2 text-sm text-moon-500">Best score: {quizBestScore}</p>
          )}
          <div className="mt-6 flex justify-center">
            <SpinningTotem />
          </div>
          <button
            onClick={handleRestart}
            className="mt-6 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
          >
            Play again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Games
        </Link>
        <span className="text-sm text-moon-500">
          Question {index + 1} / {dreamSignQuestions.length}
        </span>
      </div>

      <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
        <p className="text-lg text-moon-100">{question.prompt}</p>

        <div className="mt-5 space-y-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctIndex
            const isSelected = optionIndex === selected
            const revealed = selected !== null

            let style = 'border-midnight-700 bg-midnight-950/40 hover:border-nebula-400/60'
            if (revealed && isCorrect) {
              style = 'border-aurora-400/60 bg-aurora-400/10'
            } else if (revealed && isSelected && !isCorrect) {
              style = 'border-red-400/60 bg-red-400/10'
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(optionIndex)}
                disabled={revealed}
                className={`w-full rounded-lg border px-4 py-3 text-left text-moon-100 transition-colors ${style}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-moon-300">{question.explanation}</p>
            <button
              onClick={handleNext}
              className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
            >
              {isLast ? 'See results' : 'Next question'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
