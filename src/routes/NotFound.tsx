import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-3xl font-semibold text-moon-100">Lost in the dream</h1>
      <p className="text-moon-300">This page doesn&apos;t exist.</p>
      <Link to="/" className="text-nebula-300 hover:text-nebula-200">
        &larr; Back home
      </Link>
    </div>
  )
}
