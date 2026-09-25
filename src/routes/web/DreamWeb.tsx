import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildDreamGraph } from '../../lib/buildDreamGraph'
import DreamNetworkGraph from '../../components/DreamNetworkGraph'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import type { DreamGraphEntry } from '../../types/dreamNetwork'
import type { DreamPost } from '../../types/dream'

function toGraphEntries(dreams: DreamPost[]): DreamGraphEntry[] {
  return dreams
    .filter((dream) => dream.symbols.length > 0)
    .map((dream) => ({
      id: dream.id,
      date: dream.dreamtOn,
      note: dream.title,
      symbols: dream.symbols,
    }))
}

export default function DreamWeb() {
  const { user, loading: authLoading } = useAuth()
  const { myDreams, loadingMyDreams } = useDreamPosts()

  const myEntries = useMemo(() => toGraphEntries(myDreams), [myDreams])
  // Rebuild only when something the graph shows changes: sharing or unsharing a dream hands
  // us a new myDreams array, but shouldn't restart the layout.
  const entriesJson = JSON.stringify(myEntries)
  const graph = useMemo(
    () => buildDreamGraph(JSON.parse(entriesJson) as DreamGraphEntry[]),
    [entriesJson],
  )

  const entryCount = graph.nodes.filter((n) => n.type === 'entry').length
  const symbolCount = graph.nodes.filter((n) => n.type === 'symbol').length

  let emptyMessage = null
  if (!authLoading && !user) {
    emptyMessage = (
      <>
        <Link to="/login" className="text-nebula-300 hover:text-nebula-200">
          Log in
        </Link>{' '}
        to see the web of your own dreams.
      </>
    )
  } else if (user && !loadingMyDreams && myEntries.length === 0) {
    emptyMessage = (
      <>
        Tag some symbols when you{' '}
        <Link to="/dreams/new?from=journal" className="text-nebula-300 hover:text-nebula-200">
          write a dream
        </Link>{' '}
        and they&apos;ll show up here as your own web.
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Dream Web</h1>
        <p className="mt-2 max-w-2xl text-moon-300">
          Every logged night links to the symbols it contains — recurring dream signs pull nights
          together into clusters, the same way linked notes cluster in Obsidian's graph view.
        </p>
      </div>

      {emptyMessage ? (
        <p className="text-sm text-moon-400">{emptyMessage}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 text-xs text-moon-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-aurora-400" /> {entryCount} nights
              logged
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-nebula-400" /> {symbolCount} symbols
            </span>
            <span>Drag nodes to rearrange · scroll to zoom · drag background to pan</span>
          </div>

          <DreamNetworkGraph graph={graph} />
        </>
      )}
    </div>
  )
}
