// All attributes must be inline SVG — no Tailwind classes (for PNG export compatibility)

interface BeadCellProps {
  cx: number
  cy: number
  r: number          // radius for seed bead
  hex: string | null // null = unpainted
  onPointerEnter?: () => void
}

/** Seed bead rendered as a circle. Uses only inline SVG attributes. */
export function SeedBeadCell({ cx, cy, r, hex, onPointerEnter }: BeadCellProps) {
  const fill = hex ?? '#f8f8f8'
  const stroke = hex ? darken(hex, 0.25) : '#d0d0d0'
  const strokeW = hex ? 0.8 : 0.5

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeW}
      style={{ cursor: 'crosshair' }}
      onPointerEnter={onPointerEnter}
    />
  )
}

interface BugleCellProps {
  x: number   // left edge
  y: number   // top edge
  width: number
  height: number
  hex: string | null
  onPointerEnter?: () => void
}

/** Bugle bead rendered as a tall rectangle. Uses only inline SVG attributes. */
export function BugleBeadCell({ x, y, width, height, hex, onPointerEnter }: BugleCellProps) {
  const fill = hex ?? '#f8f8f8'
  const stroke = hex ? darken(hex, 0.25) : '#d0d0d0'
  const rx = 1.5

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={0.8}
      style={{ cursor: 'crosshair' }}
      onPointerEnter={onPointerEnter}
    />
  )
}

/** Darken a hex color by a factor 0–1. */
function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount))).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}
