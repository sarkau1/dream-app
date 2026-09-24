import type { ReactNode } from 'react'

export default function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
}
