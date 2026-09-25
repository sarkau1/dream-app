import type { DreamPost } from '../types/dream'

/** A readable journal: one section per dream, oldest first, in plain Markdown. */
export function dreamsToMarkdown(dreams: DreamPost[], exportedOn: string): string {
  const lines = [`# Dream journal`, '', `Exported ${exportedOn} · ${dreams.length} dreams`, '']
  for (const dream of dreams) {
    lines.push(`## ${dream.dreamtOn} — ${dream.title}`, '')
    const facts = [
      dream.mood && `Mood: ${dream.mood}`,
      dream.symbols.length > 0 && `Signs: ${dream.symbols.join(', ')}`,
      dream.isPrivate ? 'Private' : 'Shared in the Dream Feed',
    ].filter(Boolean)
    lines.push(`_${facts.join(' · ')}_`, '', dream.body, '')
  }
  return lines.join('\n')
}

/** Everything, machine-readable, for moving to another app or keeping a backup. */
export function dreamsToJson(dreams: DreamPost[], exportedOn: string): string {
  return JSON.stringify(
    {
      exportedOn,
      dreams: dreams.map((dream) => ({
        id: dream.id,
        dreamtOn: dream.dreamtOn,
        createdAt: dream.createdAt,
        title: dream.title,
        body: dream.body,
        mood: dream.mood,
        symbols: dream.symbols,
        isPrivate: dream.isPrivate,
      })),
    },
    null,
    2,
  )
}

/** Hands the browser a file to save. */
export function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
