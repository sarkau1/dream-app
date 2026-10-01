import { useEffect } from 'react'

const SITE_NAME = 'Dusk & Dawn'

/** Sets the browser tab title to "<title> · Dusk & Dawn", or just the site name. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])
}
