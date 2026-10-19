import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import LogoMark from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { useHabits } from '../context/useHabits'
import { todayLocal } from '../lib/dates'
import { ESSENCE_PERFECT_DAY, essenceFromHabits } from '../lib/essence'
import { currentTheme, setTheme, type Theme } from '../lib/theme'
import { primaryButtonClass } from '../styles/ui'

// Dreams (the feed), Dream Web and Progress are hidden for now; their pages still work by URL.
// Home has no link of its own: the logo goes there.
// Dusk is the evening side (habits and the diary), Dawn the morning side (the dream journal).
const links = [
  { to: '/habits', label: 'Dusk' },
  { to: '/journal', label: 'Dawn' },
]

// Only admins see it; the page and the database check too.
const ADMIN_LINK = { to: '/admin', label: 'Admin' }

const linkColors = (isActive: boolean) =>
  isActive ? 'bg-nebula-500/20 text-nebula-300' : 'text-moon-300 hover:text-moon-100'

// Wide screens: the links sit together in one pill; the current page is a raised pill inside it.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-full px-4 py-1.5 text-sm transition-all ${
    isActive
      ? 'bg-gradient-to-b from-midnight-600 to-midnight-700 text-moon-100 shadow-[0_2px_12px_-2px_rgba(124,92,255,0.45)]'
      : 'text-moon-400 hover:text-moon-100'
  }`

// Bigger rows in the phone menu, so each one is an easy thumb target.
const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 items-center rounded-2xl px-4 text-base transition-colors ${linkColors(isActive)}`

export default function NavBar() {
  const { user, profile, signOut } = useAuth()
  const { habits, checks } = useHabits()
  const navigate = useNavigate()
  const location = useLocation()
  // Remember which page the menu was opened on: following any link, including ones in the page
  // itself rather than in the menu, lands somewhere else and so closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null)
  const menuOpen = menuOpenOn === location.pathname
  const closeMenu = () => setMenuOpenOn(null)
  // index.html has already applied the saved theme; this keeps the header in step with it.
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  function toggleTheme() {
    const next = theme === 'dusk' ? 'dawn' : 'dusk'
    setTheme(next)
    setThemeState(next)
  }

  // The word for the current theme is lit, the other one rests.
  const word = (name: Theme) => (theme === name ? 'text-moon-100' : 'text-moon-500')

  async function handleSignOut() {
    closeMenu()
    await signOut()
    navigate('/')
  }

  const essence = user && (
    <span
      title={`Dream Essence: ${ESSENCE_PERFECT_DAY} for every day you complete all your habits`}
      className="inline-flex items-center gap-1.5 rounded-full border border-aurora-400/30 bg-aurora-400/10 px-3 py-1.5 text-xs font-medium text-aurora-300"
    >
      <span aria-hidden="true">✦</span>
      {/* Don't flash 0 while the habits are still loading. */}
      {habits === null ? '…' : essenceFromHabits(habits, checks, todayLocal())}
      <span className="sr-only">Dream Essence</span>
    </span>
  )

  const visibleLinks = profile?.isAdmin ? [...links, ADMIN_LINK] : links

  const auth = user ? (
    <>
      <NavLink
        to="/profile"
        onClick={closeMenu}
        title="Your profile"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm transition-colors ${
            isActive ? 'bg-nebula-500/20 text-nebula-300' : 'text-moon-300 hover:text-moon-100'
          }`
        }
      >
        <Avatar userId={user.id} name={profile?.displayName ?? '?'} />
        <span className="max-w-[10rem] truncate">{profile?.displayName ?? 'Profile'}</span>
      </NavLink>
      <button
        onClick={handleSignOut}
        className="min-h-11 rounded-full px-3 text-sm text-moon-500 transition-colors hover:text-moon-100"
      >
        Log out
      </button>
    </>
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
        className={primaryButtonClass}
      >
        Register
      </NavLink>
    </>
  )

  return (
    // The bottom edge is a hairline that glows from dawn to dusk, like the logo.
    <header className="sticky top-0 z-20 bg-midnight-950/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-nebula-400/40 after:to-transparent">
      <nav className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* The mark goes home and turns its dawn half to the top in the Dawn theme. */}
            <NavLink to="/" onClick={closeMenu} aria-label="Dusk & Dawn, home">
              <LogoMark
                className={`size-9 drop-shadow-[0_0_10px_rgba(155,127,255,0.45)] transition-transform duration-700 ${
                  theme === 'dawn' ? 'rotate-180' : ''
                }`}
              />
            </NavLink>
            {/* The name switches between the Dusk (dark) and Dawn (light) themes. */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dusk' ? 'Switch to the Dawn (light) theme' : 'Switch to the Dusk (dark) theme'}
              title={theme === 'dusk' ? 'Switch to Dawn' : 'Switch to Dusk'}
              className="rounded-full font-serif text-xl tracking-wide"
            >
              <span className={`transition-colors duration-500 ${word('dusk')}`}>Dusk</span>{' '}
              <span className="bg-gradient-to-r from-amber-200 to-nebula-300 bg-clip-text text-transparent italic">&amp;</span>{' '}
              <span className={`transition-colors duration-500 ${word('dawn')}`}>Dawn</span>
            </button>
          </div>

          {/* Wide screens: everything in one row. */}
          <div className="hidden items-center gap-3 md:flex">
            <ul className="flex items-center gap-1 rounded-full border border-midnight-700/70 bg-midnight-900/60 p-1">
              {visibleLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={linkClass}>
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
            onClick={() => setMenuOpenOn(menuOpen ? null : location.pathname)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-midnight-700 text-moon-300 hover:text-moon-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="rise-in mt-3 space-y-4 pb-2 md:hidden">
            <ul className="space-y-1">
              {visibleLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} onClick={closeMenu} className={mobileLinkClass}>
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
