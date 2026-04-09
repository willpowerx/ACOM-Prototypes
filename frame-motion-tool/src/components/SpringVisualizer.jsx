import { useMemo } from 'react'
import { computeSpringCurve } from '../utils/springMath'

export default function SpringVisualizer({ stiffness, damping, mass }) {
  const points = useMemo(
    () => computeSpringCurve({ stiffness, damping, mass }),
    [stiffness, damping, mass]
  )

  // Map [t, position] to SVG coordinates
  // viewBox: 0 0 200 80
  // t 0–2 → x 10–190  (10px padding each side)
  // position range displayed: -0.3 to 1.5 (to show overshoot and undershoot)
  const tMax = 2
  const posMin = -0.3
  const posMax = 1.5

  const toX = (t) => 10 + (t / tMax) * 180
  const toY = (pos) => 70 - ((pos - posMin) / (posMax - posMin)) * 60

  const pathD = points
    .map(([t, pos], i) => `${i === 0 ? 'M' : 'L'}${toX(t).toFixed(1)},${toY(pos).toFixed(1)}`)
    .join(' ')

  // Equilibrium line (position = 1) y-coordinate
  const eqY = toY(1)

  return (
    <div className="mt-1 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 px-3 pt-2 pb-0">
        Spring Curve
      </p>
      <svg
        width="100%"
        height="80"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="block"
      >
        {/* Zero line (position = 0) */}
        <line
          x1="10" y1={toY(0)} x2="190" y2={toY(0)}
          stroke="#27272a" strokeWidth="0.5"
        />
        {/* Equilibrium line (position = 1) — dashed */}
        <line
          x1="10" y1={eqY} x2="190" y2={eqY}
          stroke="#3f3f46" strokeWidth="0.8" strokeDasharray="4 3"
        />
        {/* Spring curve */}
        <path
          d={pathD}
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Labels */}
        <text x="4" y={toY(0) + 1} fontSize="6" fill="#52525b" dominantBaseline="middle">0</text>
        <text x="193" y={eqY + 1} fontSize="6" fill="#52525b" dominantBaseline="middle">1</text>
      </svg>
    </div>
  )
}
