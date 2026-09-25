import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/useAuth'
import { useDreamPosts } from '../context/useDreamPosts'
import { essenceFromDreams } from '../lib/essence'
import { primaryButtonClass, secondaryButtonClass } from '../styles/ui'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/journal', label: 'Journal' },
  { to: '/dreams', label: 'Dreams' },
  { to: '/web', label: 'Dream Web' },
]

const linkColors = (isActive: boolean) =>
  isActive ? 'bg-nebula-500/20 text-nebula-300' : 'text-moon-300 hover:text-moon-100'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-full px-4 py-2 text-sm transition-colors ${linkColors(isActive)}`

// Bigger rows in the phone menu, so each one is an easy thumb target.
const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 items-center rounded-2xl px-4 text-base transition-colors ${linkColors(isActive)}`

export default function NavBar() {
  const { user, profile, signOut } = useAuth()
  const { myDreams, loadingMyDreams } = useDreamPosts()
  const navigate = useNavigate()
  const location = useLocation()
  // Remember which page the menu was opened on: following any link, including ones in the page
  // itself rather than in the menu, lands somewhere else and so closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null)
  const menuOpen = menuOpenOn === location.pathname
  const closeMenu = () => setMenuOpenOn(null)

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
      {/* Don't flash 0 while the journal is still loading. */}
      {loadingMyDreams && myDreams.length === 0 ? '…' : essenceFromDreams(myDreams)}
      <span className="sr-only">Dream Essence</span>
    </span>
  )

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
        className={secondaryButtonClass}
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
    <header className="sticky top-0 z-20 border-b border-midnight-700/60 bg-midnight-950/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <nav className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-4">
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
          <div id="mobile-menu" className="mt-3 space-y-4 pb-2 md:hidden">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} onClick={closeMenu} className={mobileLinkClass}>
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
