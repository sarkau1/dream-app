import type { ThoughtKind } from '../../types/thought'

// One colour per kind, used for the timeline dot and the kind label (as moods are for dreams).
export const KIND_COLORS: Record<ThoughtKind, { dot: string; text: string }> = {
  Thought: { dot: 'bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.6)]', text: 'text-sky-200' },
  Reading: { dot: 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.6)]', text: 'text-amber-200' },
  Idea: { dot: 'bg-aurora-400 shadow-[0_0_12px_rgba(94,230,200,0.7)]', text: 'text-aurora-300' },
  Reflection: { dot: 'bg-nebula-400 shadow-[0_0_12px_rgba(155,127,255,0.7)]', text: 'text-nebula-300' },
}

