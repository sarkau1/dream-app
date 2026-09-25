import { useEffect, useRef, useState } from 'react'
import type { DreamGraph, DreamGraphNode } from '../types/dreamNetwork'

interface Props {
  graph: DreamGraph
  /** Called when a node is clicked or tapped (not dragged). */
  onNodeClick?: (node: DreamGraphNode) => void
  /** What the graph shows, for screen readers (the canvas itself says nothing). */
  label?: string
}

type Gesture =
  | { kind: 'node'; node: DreamGraphNode; downX: number; downY: number; moved: boolean }
  | { kind: 'pan'; startX: number; startY: number; camX: number; camY: number }
  | { kind: 'pinch'; startDist: number; startZoom: number; worldX: number; worldY: number }

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

const MIN_ZOOM = 0.15
const MAX_ZOOM = 4
// How far a pointer can wander (in CSS px) and still count as a click rather than a drag.
const CLICK_SLOP = 5

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

function nodeRadius(node: DreamGraphNode) {
  const base = node.type === 'symbol' ? 6 : 3.5
  return base + Math.sqrt(node.degree) * 2.2
}

export default function DreamNetworkGraph({ graph, onNodeClick, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<DreamGraphNode[]>(graph.nodes)
  const cameraRef = useRef<Camera>({ zoom: 1, panX: 0, panY: 0 })
  const alphaRef = useRef(1)
  const hoveredRef = useRef<DreamGraphNode | null>(null)
  const gestureRef = useRef<Gesture | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  // Kept in a ref so a new callback doesn't restart the simulation effect below.
  const onNodeClickRef = useRef(onNodeClick)
  useEffect(() => {
    onNodeClickRef.current = onNodeClick
  }, [onNodeClick])

  // A new graph comes in whenever the dreams change. Nodes that were already on screen keep their
  // positions so editing one dream nudges the layout instead of scattering it; only a graph with
  // brand-new nodes gets a full reheat.
  useEffect(() => {
    const previous = new Map(nodesRef.current.map((n) => [n.id, n]))
    const added = graph.nodes.some((node) => !previous.has(node.id))
    nodesRef.current = graph.nodes.map((node) => {
      const old = previous.get(node.id)
      return old && old !== node ? { ...node, x: old.x, y: old.y } : node
    })
    alphaRef.current = added ? 1 : Math.max(alphaRef.current, 0.3)
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
    // Once the layout has settled, only redraw after something visible changed (hover, drag,
    // pan, zoom, resize) instead of repainting an unchanged canvas every frame.
    let dirty = true
    // Every pointer currently down (mouse, pen or finger), by pointerId, in client coordinates.
    const pointers = new Map<number, { x: number; y: number }>()
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
      dirty = true
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
      const moving = alpha > ALPHA_MIN
      if (moving) {
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

      if (moving || dirty) {
        render()
        dirty = false
      }
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

    function localPoint(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    // Two fingers down: zoom by how far apart they are, keeping the world point that was under
    // their midpoint under it as they move.
    function pinchState() {
      const [a, b] = [...pointers.values()]
      const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2)
      return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid }
    }

    function releaseNode() {
      const gesture = gestureRef.current
      if (gesture?.kind === 'node') gesture.node.pinned = false
    }

    function handlePointerDown(e: PointerEvent) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      canvas.setPointerCapture(e.pointerId)

      if (pointers.size === 2) {
        releaseNode()
        const { dist, mid } = pinchState()
        const world = screenToWorld(mid.x, mid.y)
        gestureRef.current = {
          kind: 'pinch',
          startDist: dist,
          startZoom: cameraRef.current.zoom,
          worldX: world.x,
          worldY: world.y,
        }
        hoveredRef.current = null
        setTooltip(null)
        return
      }
      if (pointers.size > 2) return

      const { x: sx, y: sy } = localPoint(e.clientX, e.clientY)
      const node = pickNode(sx, sy)
      if (node) {
        node.pinned = true
        gestureRef.current = { kind: 'node', node, downX: e.clientX, downY: e.clientY, moved: false }
      } else {
        const cam = cameraRef.current
        gestureRef.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, camX: cam.panX, camY: cam.panY }
      }
    }

    function handlePointerMove(e: PointerEvent) {
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      const { x: sx, y: sy } = localPoint(e.clientX, e.clientY)
      const gesture = gestureRef.current
      dirty = true

      if (gesture?.kind === 'pinch') {
        if (pointers.size < 2) return
        const { dist, mid } = pinchState()
        const cam = cameraRef.current
        cam.zoom = clampZoom(gesture.startZoom * (dist / gesture.startDist))
        const { width, height } = sizeRef.current
        cam.panX = (mid.x - width / 2) / cam.zoom - gesture.worldX
        cam.panY = (mid.y - height / 2) / cam.zoom - gesture.worldY
        return
      }
      if (gesture?.kind === 'node') {
        // Small wobbles while clicking shouldn't move the node or count as a drag.
        if (!gesture.moved && Math.hypot(e.clientX - gesture.downX, e.clientY - gesture.downY) < CLICK_SLOP) {
          return
        }
        gesture.moved = true
        const world = screenToWorld(sx, sy)
        gesture.node.x = world.x
        gesture.node.y = world.y
        gesture.node.vx = 0
        gesture.node.vy = 0
        alphaRef.current = Math.max(alphaRef.current, 0.3)
        setTooltip({ node: gesture.node, screenX: sx, screenY: sy })
        return
      }
      if (gesture?.kind === 'pan') {
        const cam = cameraRef.current
        cam.panX = gesture.camX + (e.clientX - gesture.startX) / cam.zoom
        cam.panY = gesture.camY + (e.clientY - gesture.startY) / cam.zoom
        return
      }

      const node = pickNode(sx, sy)
      hoveredRef.current = node
      setTooltip(node ? { node, screenX: sx, screenY: sy } : null)
      canvas.style.cursor = node ? 'pointer' : 'grab'
    }

    function endPointer(e: PointerEvent, cancelled: boolean) {
      pointers.delete(e.pointerId)
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)

      const gesture = gestureRef.current
      if (gesture?.kind === 'pinch') {
        // Lifting one finger ends the pinch; the other one doesn't start a pan mid-gesture.
        if (pointers.size < 2) gestureRef.current = null
        return
      }
      releaseNode()
      gestureRef.current = null
      if (!cancelled && gesture?.kind === 'node' && !gesture.moved) {
        onNodeClickRef.current?.(gesture.node)
      }
    }

    function handlePointerUp(e: PointerEvent) {
      endPointer(e, false)
    }

    // The browser can cancel a drag (touch scroll, alt-tab); without this the node stays pinned.
    function handlePointerCancel(e: PointerEvent) {
      endPointer(e, true)
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      dirty = true
      const cam = cameraRef.current
      const { x, y } = localPoint(e.clientX, e.clientY)
      const before = screenToWorld(x, y)
      cam.zoom = clampZoom(cam.zoom * Math.exp(-e.deltaY * 0.001))
      const after = screenToWorld(x, y)
      cam.panX += after.x - before.x
      cam.panY += after.y - before.y
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      pointers.clear()
      gestureRef.current = null
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [graph])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={label}
      className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-midnight-700 bg-midnight-950/60">
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
          {onNodeClick && (
            <p className="mt-1 text-moon-500">
              {tooltip.node.type === 'symbol' ? 'Click to see these dreams' : 'Click to open'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
