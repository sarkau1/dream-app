import { useEffect, useRef, useState } from 'react'
import type { DreamGraph, DreamGraphNode } from '../types/dreamNetwork'

interface Props {
  graph: DreamGraph
}

interface Camera {
  zoom: number
  panX: number
  panY: number
}

interface Tooltip {
  node: DreamGraphNode
  screenX: number
  screenY: number
}

const REPULSION = 2200
const LINK_DISTANCE = 70
const LINK_STRENGTH = 0.05
const CENTER_STRENGTH = 0.015
const VELOCITY_DECAY = 0.65
const ALPHA_DECAY = 0.988
const ALPHA_MIN = 0.001

const SYMBOL_COLOR = '#9b7fff'
const SYMBOL_GLOW = 'rgba(124, 92, 255, 0.55)'
const ENTRY_COLOR = '#5ee6c8'
const ENTRY_GLOW = 'rgba(94, 230, 200, 0.45)'
const EDGE_COLOR = 'rgba(201, 195, 232, 0.14)'
const EDGE_COLOR_ACTIVE = 'rgba(191, 168, 255, 0.85)'

function nodeRadius(node: DreamGraphNode) {
  const base = node.type === 'symbol' ? 6 : 3.5
  return base + Math.sqrt(node.degree) * 2.2
}

export default function DreamNetworkGraph({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<DreamGraphNode[]>(graph.nodes)
  const cameraRef = useRef<Camera>({ zoom: 1, panX: 0, panY: 0 })
  const alphaRef = useRef(1)
  const hoveredRef = useRef<DreamGraphNode | null>(null)
  const draggingRef = useRef<{ node: DreamGraphNode } | { pan: true; startX: number; startY: number; camX: number; camY: number } | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Reset the simulation whenever a new graph comes in (e.g. "Regenerate" was clicked).
  useEffect(() => {
    nodesRef.current = graph.nodes
    alphaRef.current = 1
  }, [graph])

  useEffect(() => {
    const canvasMaybe = canvasRef.current
    const containerMaybe = containerRef.current
    if (!canvasMaybe || !containerMaybe) return
    const contextMaybe = canvasMaybe.getContext('2d')
    if (!contextMaybe) return
    // Explicit annotations so TS keeps these non-null inside the closures declared below —
    // control-flow narrowing from the guards above doesn't reach nested function bodies.
    const canvas: HTMLCanvasElement = canvasMaybe
    const container: HTMLDivElement = containerMaybe
    const ctx: CanvasRenderingContext2D = contextMaybe

    let raf = 0
    let disposed = false
    const nodeById = new Map(nodesRef.current.map((n) => [n.id, n]))

    function resize() {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { width: rect.width, height: rect.height }
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    function worldToScreen(x: number, y: number) {
      const { width, height } = sizeRef.current
      const cam = cameraRef.current
      return {
        x: width / 2 + (x + cam.panX) * cam.zoom,
        y: height / 2 + (y + cam.panY) * cam.zoom,
      }
    }

    function screenToWorld(x: number, y: number) {
      const { width, height } = sizeRef.current
      const cam = cameraRef.current
      return {
        x: (x - width / 2) / cam.zoom - cam.panX,
        y: (y - height / 2) / cam.zoom - cam.panY,
      }
    }

    function tick() {
      const nodes = nodesRef.current
      const alpha = alphaRef.current
      if (alpha > ALPHA_MIN) {
        for (let i = 0; i < nodes.length; i += 1) {
          const a = nodes[i]
          if (a.pinned) continue
          for (let j = i + 1; j < nodes.length; j += 1) {
            const b = nodes[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const distSq = dx * dx + dy * dy + 0.01
            const force = (REPULSION * alpha) / distSq
            const dist = Math.sqrt(distSq)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            a.vx += fx
            a.vy += fy
            if (!b.pinned) {
              b.vx -= fx
              b.vy -= fy
            }
          }
          a.vx -= a.x * CENTER_STRENGTH * alpha
          a.vy -= a.y * CENTER_STRENGTH * alpha
        }

        for (const edge of graph.edges) {
          const source = nodeById.get(edge.source)
          const target = nodeById.get(edge.target)
          if (!source || !target) continue
          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
          const diff = ((dist - LINK_DISTANCE) / dist) * LINK_STRENGTH * alpha
          const fx = dx * diff
          const fy = dy * diff
          if (!source.pinned) {
            source.vx += fx
            source.vy += fy
          }
          if (!target.pinned) {
            target.vx -= fx
            target.vy -= fy
          }
        }

        for (const node of nodes) {
          if (node.pinned) {
            node.vx = 0
            node.vy = 0
            continue
          }
          node.vx *= VELOCITY_DECAY
          node.vy *= VELOCITY_DECAY
          node.x += node.vx
          node.y += node.vy
        }

        alphaRef.current *= ALPHA_DECAY
      }

      render()
      raf = requestAnimationFrame(tick)
    }

    function render() {
      const { width, height } = sizeRef.current
      ctx.clearRect(0, 0, width, height)
      const nodes = nodesRef.current
      const hovered = hoveredRef.current
      const connected = new Set<string>()
      if (hovered) {
        for (const edge of graph.edges) {
          if (edge.source === hovered.id) connected.add(edge.target)
          if (edge.target === hovered.id) connected.add(edge.source)
        }
      }

      ctx.lineWidth = 1
      for (const edge of graph.edges) {
        const source = nodeById.get(edge.source)
        const target = nodeById.get(edge.target)
        if (!source || !target) continue
        const a = worldToScreen(source.x, source.y)
        const b = worldToScreen(target.x, target.y)
        const isActive = hovered && (edge.source === hovered.id || edge.target === hovered.id)
        ctx.strokeStyle = isActive ? EDGE_COLOR_ACTIVE : EDGE_COLOR
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      for (const node of nodes) {
        const { x, y } = worldToScreen(node.x, node.y)
        const r = nodeRadius(node) * cameraRef.current.zoom
        const dimmed = hovered && hovered.id !== node.id && !connected.has(node.id)
        const color = node.type === 'symbol' ? SYMBOL_COLOR : ENTRY_COLOR
        const glow = node.type === 'symbol' ? SYMBOL_GLOW : ENTRY_GLOW

        ctx.globalAlpha = dimmed ? 0.25 : 1
        ctx.shadowColor = glow
        ctx.shadowBlur = hovered?.id === node.id ? 18 : 8
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        if (node.type === 'symbol' && (cameraRef.current.zoom > 0.55 || hovered?.id === node.id)) {
          ctx.globalAlpha = dimmed ? 0.35 : 0.9
          ctx.fillStyle = '#f4f2fd'
          ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          ctx.textBaseline = 'middle'
          ctx.fillText(node.label, x + r + 5, y)
        }
        ctx.globalAlpha = 1
      }
    }

    function pickNode(sx: number, sy: number): DreamGraphNode | null {
      const world = screenToWorld(sx, sy)
      let closest: DreamGraphNode | null = null
      let closestDist = Infinity
      for (const node of nodesRef.current) {
        const dx = node.x - world.x
        const dy = node.y - world.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const r = nodeRadius(node) + 4
        if (dist <= r && dist < closestDist) {
          closest = node
          closestDist = dist
        }
      }
      return closest
    }

    function handlePointerDown(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const node = pickNode(sx, sy)
      if (node) {
        node.pinned = true
        draggingRef.current = { node }
      } else {
        const cam = cameraRef.current
        draggingRef.current = { pan: true, startX: e.clientX, startY: e.clientY, camX: cam.panX, camY: cam.panY }
      }
      canvas.setPointerCapture(e.pointerId)
    }

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const drag = draggingRef.current

      if (drag && 'node' in drag) {
        const world = screenToWorld(sx, sy)
        drag.node.x = world.x
        drag.node.y = world.y
        drag.node.vx = 0
        drag.node.vy = 0
        alphaRef.current = Math.max(alphaRef.current, 0.3)
        setTooltip({ node: drag.node, screenX: sx, screenY: sy })
        return
      }
      if (drag && 'pan' in drag) {
        const cam = cameraRef.current
        cam.panX = drag.camX + (e.clientX - drag.startX) / cam.zoom
        cam.panY = drag.camY + (e.clientY - drag.startY) / cam.zoom
        return
      }

      const node = pickNode(sx, sy)
      hoveredRef.current = node
      setTooltip(node ? { node, screenX: sx, screenY: sy } : null)
      canvas.style.cursor = node ? 'pointer' : 'grab'
    }

    function handlePointerUp(e: PointerEvent) {
      const drag = draggingRef.current
      if (drag && 'node' in drag) {
        drag.node.pinned = false
      }
      draggingRef.current = null
      canvas.releasePointerCapture(e.pointerId)
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const cam = cameraRef.current
      const rect = canvas.getBoundingClientRect()
      const before = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
      const factor = Math.exp(-e.deltaY * 0.001)
      cam.zoom = Math.min(4, Math.max(0.15, cam.zoom * factor))
      const after = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
      cam.panX += after.x - before.x
      cam.panY += after.y - before.y
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
      void disposed
    }
  }, [graph])

  return (
    <div ref={containerRef} className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-midnight-700 bg-midnight-950/60">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-lg border border-midnight-600 bg-midnight-900/95 px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.screenX + 14, top: tooltip.screenY + 14 }}
        >
          {tooltip.node.type === 'symbol' ? (
            <p className="font-medium text-nebula-300">
              {tooltip.node.label}
              <span className="ml-1.5 font-normal text-moon-500">· {tooltip.node.degree} nights</span>
            </p>
          ) : (
            <>
              <p className="font-medium text-aurora-300">{tooltip.node.date}</p>
              <p className="mt-1 text-moon-300">{tooltip.node.note}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
