import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function GameCard({
  to,
  icon,
  title,
  description,
  stat,
}: {
  to: string
  icon: string
  title: string
  description: string
  stat?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6 transition-colors hover:border-nebula-400/60 hover:bg-midnight-800/60"
    >
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <h2 className="mt-3 text-lg font-medium text-moon-100 group-hover:text-nebula-300">{title}</h2>
      <p className="mt-2 text-sm text-moon-300">{description}</p>
      {stat && <div className="mt-3 text-xs text-aurora-300">{stat}</div>}
    </Link>
  )
}
