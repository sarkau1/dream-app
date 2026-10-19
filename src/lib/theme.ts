// The two looks of the site: Dusk (dark) and Dawn (light). Clicking the name in the header
// switches between them. The choice is remembered per device; until one is made it's Dusk, even
// on a device set to light mode, so the site never glares at night. index.html applies it
// before the first paint, so there's no flash of the wrong theme.

export type Theme = 'dusk' | 'dawn'

const THEME_KEY = 'dreamapp:theme'

// The browser bar colour on phones: each theme's page background.
const BAR_COLORS: Record<Theme, string> = { dusk: '#05040f', dawn: '#fbf6ee' }

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dawn' ? 'dawn' : 'dusk'
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLORS[theme])
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked: the theme still applies until the page is closed.
  }
}
