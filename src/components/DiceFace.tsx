const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
}

export default function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const pips = PIP_LAYOUTS[value] ?? PIP_LAYOUTS[1]
  return (
    <div
      className={`relative h-16 w-16 rounded-xl border-2 border-nebula-400/60 bg-midnight-900 shadow-lg ${
        rolling ? 'dice-rolling' : ''
      }`}
    >
      {pips.map(([x, y], i) => (
        <span
          key={i}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moon-100"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  )
}
