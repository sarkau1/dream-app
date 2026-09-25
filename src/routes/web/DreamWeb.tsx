import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buildDreamGraph } from '../../lib/buildDreamGraph'
import DreamNetworkGraph from '../../components/DreamNetworkGraph'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { formatDreamDate } from '../../lib/dates'
import type { DreamGraphEntry, DreamGraphNode } from '../../types/dreamNetwork'
import type { DreamSummary } from '../../types/dream'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

function toGraphEntries(dreams: DreamSummary[]): DreamGraphEntry[] {
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
  useDocumentTitle('Dream Web')
  const { user, loading: authLoading } = useAuth()
  const { myDreams, loadingMyDreams } = useDreamPosts()
  const navigate = useNavigate()

  const myEntries = useMemo(() => toGraphEntries(myDreams), [myDreams])
  // Rebuild only when something the graph shows changes: sharing or unsharing a dream hands
  // us a new myDreams array, but shouldn't restart the layout.
  const entriesJson = JSON.stringify(myEntries)
  const graph = useMemo(
    () => buildDreamGraph(JSON.parse(entriesJson) as DreamGraphEntry[]),
    [entriesJson],
  )

  const entryCount = graph.nodes.filter((n) => n.type === 'entry').length
  const symbolNodes = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.type === 'symbol')
        .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label)),
    [graph],
  )
  const symbolCount = symbolNodes.length

  // A night opens that dream; a symbol opens the journal searched for it.
  function openNode(node: DreamGraphNode) {
    if (node.type === 'entry' && node.dreamId) navigate(`/dreams/${node.dreamId}`)
    else if (node.type === 'symbol') navigate(`/journal?q=${encodeURIComponent(node.label)}`)
  }

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
            {/* Worded for the device: mouse and trackpad, or touch. */}
            <span className="pointer-coarse:hidden">
              Click a node to open it · drag to rearrange · scroll to zoom · drag background to pan
            </span>
            <span className="hidden pointer-coarse:inline">
              Tap a node to open it · drag to rearrange · pinch to zoom · drag background to pan
            </span>
          </div>

          <DreamNetworkGraph
            graph={graph}
            onNodeClick={openNode}
            label={`Graph of ${entryCount} nights and ${symbolCount} symbols. The same connections are listed below.`}
          />

          {/* The graph is a canvas, which keyboards and screen readers can't use; this lists the
              same connections as links. */}
          <section aria-labelledby="web-list-heading" className="grid gap-6 sm:grid-cols-2">
            <h2 id="web-list-heading" className="sr-only">
              Dream Web as a list
            </h2>
            <div>
              <h3 className="text-sm font-medium text-moon-300">Symbols, most recurring first</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {symbolNodes.map((node) => (
                  <li key={node.id}>
                    <Link
                      to={`/journal?q=${encodeURIComponent(node.label)}`}
                      className="inline-block rounded-full border border-midnight-700 px-3 py-1 text-xs text-moon-300 hover:border-nebula-400/60 hover:text-moon-100"
                    >
                      {node.label}
                      <span className="text-moon-500"> · {node.degree}</span>
                      <span className="sr-only"> nights</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-moon-300 hover:text-moon-100">
                All {entryCount} nights
              </summary>
              <ul className="mt-3 space-y-1.5 text-sm">
                {myEntries.map((entry) => (
                  <li key={entry.id}>
                    <Link to={`/dreams/${entry.id}`} className="text-moon-300 hover:text-nebula-300">
                      <span className="text-moon-500">{formatDreamDate(entry.date)}</span> ·{' '}
                      {entry.note}
                    </Link>
                    <span className="text-xs text-moon-500"> — {entry.symbols.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        </>
      )}
    </div>
  )
}
