import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/forum', label: 'Forum' },
  { to: '/games', label: 'Games' },
]

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-midnight-700/60 bg-midnight-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="text-lg font-semibold tracking-wide text-moon-100">
          <span className="text-nebula-400">Lucent</span> Dreaming
        </NavLink>
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-nebula-500/20 text-nebula-300'
                      : 'text-moon-300 hover:text-moon-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
