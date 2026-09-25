import type { ReactNode } from 'react'

export default function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-5xl px-4 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-10">{children}</main>
}
