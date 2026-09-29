import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { moveItem, type Habit } from '../../lib/habits'

const GAP = 10 // px between rows; matches space-y-2.5

interface Drag {
  id: string
  pointerId: number
  startY: number
  dy: number
  from: number
  to: number
  /** Each row's top and height when the drag started. */
  rects: { top: number; height: number }[]
}

/**
 * Habits in order, rearranged by dragging the ≡ handle (touch or mouse) or with the arrow keys
 * on it. The other rows slide out of the way while dragging; `onReorder` gets the new order
 * on drop.
 */
export default function ReorderList({
  habits,
  onReorder,
}: {
  habits: Habit[]
  onReorder: (ids: string[]) => void
}) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const rowRefs = useRef(new Map<string, HTMLLIElement>())

  function start(e: PointerEvent<HTMLButtonElement>, index: number) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rects = habits.map((habit) => {
      const rect = rowRefs.current.get(habit.id)!.getBoundingClientRect()
      return { top: rect.top, height: rect.height }
    })
    navigator.vibrate?.(10)
    setDrag({ id: habits[index].id, pointerId: e.pointerId, startY: e.clientY, dy: 0, from: index, to: index, rects })
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return
    const dy = e.clientY - drag.startY
    const own = drag.rects[drag.from]
    const middle = own.top + own.height / 2 + dy
    // The new slot: past every other row whose middle the dragged one has crossed.
    let to = 0
    drag.rects.forEach((rect, i) => {
      if (i !== drag.from && middle > rect.top + rect.height / 2) to++
    })
    setDrag({ ...drag, dy, to })
  }

  function end(e: PointerEvent<HTMLButtonElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return
    if (drag.to !== drag.from) onReorder(moveItem(habits, drag.from, drag.to).map((h) => h.id))
    setDrag(null)
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
    const to = index + step
    if (step === 0 || to < 0 || to >= habits.length) return
    e.preventDefault()
    onReorder(moveItem(habits, index, to).map((h) => h.id))
  }

  // How far a row that isn't being dragged shifts to make room.
  function shift(index: number) {
    if (!drag || index === drag.from) return 0
    const size = drag.rects[drag.from].height + GAP
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -size
    if (drag.from > drag.to && index < drag.from && index >= drag.to) return size
    return 0
  }

  return (
    <ul className="space-y-2.5">
      {habits.map((habit, index) => {
        const dragging = drag?.id === habit.id
        return (
          <li
            key={habit.id}
            ref={(el) => {
              if (el) rowRefs.current.set(habit.id, el)
              else rowRefs.current.delete(habit.id)
            }}
            style={{
              transform: `translateY(${dragging ? drag!.dy : shift(index)}px)${dragging ? ' scale(1.02)' : ''}`,
              transition: dragging ? 'none' : 'transform 0.2s ease',
            }}
            className={`relative flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 ${
              dragging
                ? 'z-10 border-nebula-400/60 bg-midnight-800 shadow-2xl shadow-nebula-500/30'
                : 'border-midnight-700 bg-midnight-900/70'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-midnight-800 text-2xl" aria-hidden>
              {habit.emoji ?? '✦'}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-moon-300">{habit.name}</span>
            <button
              type="button"
              aria-label={`Move ${habit.name}. Drag, or use the up and down arrow keys.`}
              onPointerDown={(e) => start(e, index)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onKeyDown={(e) => onKey(e, index)}
              // touch-none: the finger drags the row instead of scrolling the page.
              className={`flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-xl text-xl text-moon-400 hover:bg-midnight-800 hover:text-moon-100 ${
                dragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              ≡
            </button>
          </li>
        )
      })}
    </ul>
  )
}
