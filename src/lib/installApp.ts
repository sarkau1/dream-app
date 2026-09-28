import { useSyncExternalStore } from 'react'

// Chrome and Edge fire `beforeinstallprompt` when the site can be installed as an app. It can
// fire before any page that offers an install button has mounted, so it's caught here from
// startup (see main.tsx) and kept until used. Safari never fires it: there, installing is
// Share -> Add to Home Screen, and no button is shown.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
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
    notify()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whether the browser will install the app right now, and a function that asks it to. */
export function useInstallApp() {
  const prompt = useSyncExternalStore(subscribe, () => deferred)
  async function install() {
    if (!deferred) return
    const event = deferred
    await event.prompt()
    await event.userChoice
    // A prompt can only be shown once; the browser fires a fresh event if it may ask again.
    deferred = null
    notify()
  }
  return { canInstall: prompt !== null, install }
}
