import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { getShapeCells, cellKey } from '../../lib/shapeUtils.ts'
import { SeedBeadCell } from './BeadCell.tsx'

export const BEAD_R = 4      // seed bead radius (px)
export const BEAD_W = BEAD_R * 2
export const BEAD_VGAP = 0.85 // vertical overlap factor
export const PADDING = 6      // canvas padding

interface Props {
  onCellEnter: (key: string) => void
}

export function BrickStitchBody({ onCellEnter }: Props) {
  const shapeConfig = useDesignStore(s => s.shapeConfig)
  const bodyPaint = useDesignStore(s => s.bodyPaint)
  const palette = usePaletteStore(s => s.beads)

  const activeCells = getShapeCells(shapeConfig)

  return (
    <>
      {Array.from(activeCells).map(key => {
        const [row, col] = key.split(',').map(Number) as [number, number]
        const cx = PADDING + col * BEAD_W + (row % 2 === 1 ? BEAD_R : 0) + BEAD_R
        const cy = PADDING + row * BEAD_W * BEAD_VGAP + BEAD_R

        const beadId = bodyPaint[key]
        const bead = beadId ? palette.find(b => b.id === beadId) : null
        const hex = bead ? bead.hex : null

        return (
          <SeedBeadCell
            key={key}
            cx={cx}
            cy={cy}
            r={BEAD_R - 0.5}
            hex={hex}
            onPointerEnter={() => onCellEnter(key)}
          />
        )
      })}
    </>
  )
}

/** Compute SVG body dimensions for the current shape config */
export function getBodySvgDimensions(shapeConfig: { rows: number; cols: number }) {
  const width = (shapeConfig.cols + 1) * BEAD_W + PADDING * 2
  const height = shapeConfig.rows * BEAD_W * BEAD_VGAP + BEAD_W + PADDING * 2
  return { width, height }
}

/** Compute the Y coordinate of the bottom edge (center of bottom-row beads) */
export function getBodyBottomY(rows: number): number {
  return PADDING + (rows - 1) * BEAD_W * BEAD_VGAP + BEAD_R
}

/** Compute the X position of a bottom-edge cell anchor */
export function getAnchorX(row: number, col: number): number {
  return PADDING + col * BEAD_W + (row % 2 === 1 ? BEAD_R : 0) + BEAD_R
}

/** Map SVG pointer position back to (row, col), accounting for brick offset */
export function svgCoordsToCell(svgX: number, svgY: number): [number, number] {
  const row = Math.floor((svgY - PADDING) / (BEAD_W * BEAD_VGAP))
  const offsetX = svgX - PADDING - (row % 2 === 1 ? BEAD_R : 0)
  const col = Math.floor(offsetX / BEAD_W)
  return [row, col]
}

/** Returns all bottom-edge cell keys with their anchor X positions */
export function getAnchorPositions(
  activeCells: Set<string>,
  rows: number,
): Array<{ key: string; x: number }> {
  const bottomRow = rows - 1
  return Array.from(activeCells)
    .filter(k => {
      const [r] = k.split(',').map(Number)
      return r === bottomRow
    })
    .sort((a, b) => {
      const [, ca] = a.split(',').map(Number)
      const [, cb] = b.split(',').map(Number)
      return (ca ?? 0) - (cb ?? 0)
    })
    .map(key => {
      const [, col] = key.split(',').map(Number) as [number, number]
      return { key: cellKey(bottomRow, col), x: getAnchorX(bottomRow, col) }
    })
}
