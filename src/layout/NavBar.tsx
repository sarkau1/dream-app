import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDreamPosts } from '../context/DreamPostContext'
import { essenceFromDreams } from '../lib/essence'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/journal', label: 'Journal' },
  { to: '/dreams', label: 'Dreams' },
  { to: '/web', label: 'Dream Web' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-full px-4 py-2 text-sm transition-colors ${
    isActive ? 'bg-nebula-500/20 text-nebula-300' : 'text-moon-300 hover:text-moon-100'
  }`

export default function NavBar() {
  const { user, signOut } = useAuth()
  const { myDreams } = useDreamPosts()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  async function handleSignOut() {
    closeMenu()
    await signOut()
    navigate('/')
  }

  const essence = user && (
    <span
      title="Dream Essence: earned for every lucid dream in your journal"
      className="inline-flex items-center gap-1.5 rounded-full border border-aurora-400/30 bg-aurora-400/10 px-3 py-1.5 text-xs font-medium text-aurora-300"
    >
      <span aria-hidden="true">✦</span>
      {essenceFromDreams(myDreams)}
      <span className="sr-only">Dream Essence</span>
    </span>
  )

  const auth = user ? (
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
        onClick={closeMenu}
        className="rounded-full px-4 py-2 text-sm text-moon-300 hover:text-moon-100"
      >
        Log in
      </NavLink>
      <NavLink
        to="/register"
        onClick={closeMenu}
        className="rounded-full bg-nebula-500 px-4 py-2 text-sm font-medium text-white hover:bg-nebula-400"
      >
        Register
      </NavLink>
    </>
  )

  return (
    <header className="sticky top-0 z-10 border-b border-midnight-700/60 bg-midnight-950/80 backdrop-blur">
      <nav className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <NavLink
            to="/"
            onClick={closeMenu}
            className="text-lg font-semibold tracking-wide text-moon-100"
          >
            <span className="text-nebula-400">Lucent</span> Dreaming
          </NavLink>

          {/* Desktop: everything in one row. */}
          <div className="hidden items-center gap-3 md:flex">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={linkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {essence}
            {auth}
          </div>

          {/* Mobile: collapse into a menu. */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-full border border-midnight-700 p-2 text-moon-300 hover:text-moon-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="mt-4 space-y-4 md:hidden">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} onClick={closeMenu} className={linkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 border-t border-midnight-700/60 pt-4">
              {essence}
              {auth}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
