import { useSyncExternalStore } from 'react'

// Chrome and Edge fire `beforeinstallprompt` when the site can be installed as an app, often only
// after the visitor has used the site for a little while. It can fire before any page that
// offers an install button has mounted, so it's caught here from startup (see main.tsx) and kept
// until used. Other browsers never fire it; for them the button shows how to install by hand.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep Chrome's own mini banner away; the app offers its own button instead.
    event.preventDefault()
    deferred = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** True when running as the installed app rather than in a browser tab. */
export function isRunningInstalled(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

export type InstallPlatform = 'ios' | 'android' | 'desktop'

/** Which by-hand install steps to show when the browser can't install in one tap. */
export function installPlatform(userAgent = navigator.userAgent): InstallPlatform {
  // iPadOS reports itself as a Mac, but only touch devices have touch points.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }
  return /Android/.test(userAgent) ? 'android' : 'desktop'
}

/**
 * Whether the browser will install the app in one tap right now (`canPrompt`), a function that
 * asks it to, and whether the app is already installed and running (nothing to offer then).
 */
export function useInstallApp() {
  const prompt = useSyncExternalStore(subscribe, () => deferred)
  const justInstalled = useSyncExternalStore(subscribe, () => installed)
  async function install() {
    if (!deferred) return
    const event = deferred
    await event.prompt()
    await event.userChoice
    // A prompt can only be shown once; the browser fires a fresh event if it may ask again.
    deferred = null
    notify()
  }
  return {
    canPrompt: prompt !== null,
    installed: justInstalled || isRunningInstalled(),
    install,
  }
}
