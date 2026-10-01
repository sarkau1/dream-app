import { useState } from 'react'
import { installPlatform, useInstallApp } from '../lib/installApp'
import { secondaryButtonClass } from '../styles/ui'

const STEPS = {
  android: [
    'Open this site in Chrome.',
    'Tap the ⋮ menu in the top right corner.',
    'Tap “Install app” (or “Add to Home screen”), then “Install”.',
  ],
  ios: [
    'Open this site in Safari.',
    'Tap the Share button (the square with an arrow).',
    'Tap “Add to Home Screen”, then “Add”.',
  ],
  desktop: [
    'Open this site in Chrome or Edge.',
    'Click the install icon at the right end of the address bar,',
    'or open the ⋮ / … menu and choose “Install Dusk & Dawn”.',
  ],
}

/**
 * Installs the app in one tap where the browser allows it (Chrome and Edge, once they're ready);
 * otherwise shows how to install it by hand. Hidden inside the installed app.
 */
export default function InstallAppButton() {
  const { canPrompt, installed, install } = useInstallApp()
  const [showSteps, setShowSteps] = useState(false)
  if (installed) return null

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={() => (canPrompt ? void install() : setShowSteps(!showSteps))}
        aria-expanded={canPrompt ? undefined : showSteps}
        className={secondaryButtonClass}
      >
        <span aria-hidden>📲</span> Install app
      </button>
      {showSteps && !canPrompt && (
        <ol className="mt-3 max-w-sm list-decimal space-y-1 rounded-xl border border-midnight-700 bg-midnight-900/80 py-3 pl-8 pr-4 text-sm text-moon-300">
          {STEPS[installPlatform()].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
