import { NavLink, useNavigate } from 'react-router-dom'
import { useMetaProgress } from '../context/MetaProgressContext'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/dreams', label: 'Dreams' },
  { to: '/learn', label: 'Learn' },
  { to: '/journal', label: 'Journal' },
  { to: '/forum', label: 'Forum' },
  { to: '/games', label: 'Games' },
  { to: '/atlas', label: 'Atlas' },
  { to: '/web', label: 'Dream Web' },
]

export default function NavBar() {
  const { totalEssence } = useMetaProgress()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-midnight-700/60 bg-midnight-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="text-lg font-semibold tracking-wide text-moon-100">
          <span className="text-nebula-400">Lucent</span> Dreaming
        </NavLink>
        <div className="flex items-center gap-3">
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
          <NavLink
            to="/atlas"
            className="hidden items-center gap-1.5 rounded-full border border-aurora-400/30 bg-aurora-400/10 px-3 py-1.5 text-xs font-medium text-aurora-300 sm:flex"
          >
            <span aria-hidden="true">✦</span>
            {totalEssence}
          </NavLink>
          {user ? (
            <button
              onClick={handleSignOut}
              className="rounded-full border border-midnight-700 px-4 py-2 text-sm text-moon-300 hover:text-moon-100"
            >
              Log out
            </button>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-full px-4 py-2 text-sm text-moon-300 hover:text-moon-100"
              >
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-nebula-500 px-4 py-2 text-sm font-medium text-white hover:bg-nebula-400"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
