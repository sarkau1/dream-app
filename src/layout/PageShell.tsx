import type { ReactNode } from 'react'

export default function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
}
