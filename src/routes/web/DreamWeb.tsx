import { useState } from 'react'
import { generateSampleDreamEntries } from '../../data/generateSampleDreamEntries'
import { buildDreamGraph } from '../../lib/buildDreamGraph'
import DreamNetworkGraph from '../../components/DreamNetworkGraph'

function generateGraph() {
  return buildDreamGraph(generateSampleDreamEntries())
}

export default function DreamWeb() {
  const [graph, setGraph] = useState(generateGraph)

  const entryCount = graph.nodes.filter((n) => n.type === 'entry').length
  const symbolCount = graph.nodes.filter((n) => n.type === 'symbol').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Dream Web</h1>
          <p className="mt-2 max-w-2xl text-moon-300">
            Every logged night links to the symbols it contains — recurring dream signs pull
            nights together into clusters, the same way linked notes cluster in Obsidian's graph
            view. This is sample data standing in for a real journal history.
          </p>
        </div>
        <button
          onClick={() => setGraph(generateGraph())}
          className="shrink-0 rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400"
        >
          Regenerate sample nights
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-moon-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-aurora-400" /> {entryCount} nights logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-nebula-400" /> {symbolCount} recurring symbols
        </span>
        <span>Drag nodes to rearrange · scroll to zoom · drag background to pan</span>
      </div>

      <DreamNetworkGraph graph={graph} />
    </div>
  )
}
