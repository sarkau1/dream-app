import { useEffect } from 'react'

const SITE_NAME = 'Lucent Dreaming'

/** Sets the browser tab title to "<title> · Lucent Dreaming", or just the site name. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])
}
