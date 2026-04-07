import type { ShapeConfig, ShapePreset } from '../types/design.ts'

export type CellKey = string // "row,col"

export function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`
}

export function parseKey(key: CellKey): [number, number] {
  const [r, c] = key.split(',').map(Number)
  return [r!, c!]
}

/** Returns the set of active cell keys for the given shape config. */
export function getShapeCells(config: ShapeConfig): Set<CellKey> {
  const { preset, rows, cols } = config
  switch (preset) {
    case 'triangle': return triangleShape(rows, cols)
    case 'diamond': return diamondShape(rows, cols)
    case 'leaf': return leafShape(rows, cols)
  }
}

/**
 * Triangle: apex (1 bead) at top, each row grows by 1 bead per row.
 * In brick stitch, odd rows are offset right by half a bead width visually.
 * To keep the visual center consistent across all rows:
 *   - Even rows use an odd bead count: centerCol-halfW to centerCol+halfW
 *   - Odd rows use an even bead count: centerCol-halfW to centerCol+halfW-1
 * This ensures every row's visual center aligns, producing a symmetric shape.
 */
function triangleShape(rows: number, cols: number): Set<CellKey> {
  const cells = new Set<CellKey>()
  const maxCols = cols % 2 === 0 ? cols - 1 : cols
  const centerCol = Math.floor(maxCols / 2)
  const maxHalfW = Math.floor(maxCols / 2)

  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) {
      // Even row: odd bead count, symmetric around centerCol
      const halfW = Math.min(Math.floor(r / 2), maxHalfW)
      for (let c = centerCol - halfW; c <= centerCol + halfW; c++) {
        cells.add(cellKey(r, c))
      }
    } else {
      // Odd row: even bead count; range shifted one col left so visual
      // center (accounting for brick offset) matches even rows
      const halfW = Math.min(Math.ceil(r / 2), maxHalfW)
      for (let c = centerCol - halfW; c <= centerCol + halfW - 1; c++) {
        cells.add(cellKey(r, c))
      }
    }
  }
  return cells
}

/** Diamond: widens from apex (top) to midpoint then narrows to apex (bottom). */
function diamondShape(rows: number, cols: number): Set<CellKey> {
  const cells = new Set<CellKey>()
  const maxCols = cols % 2 === 0 ? cols - 1 : cols
  const centerCol = Math.floor(maxCols / 2)
  const midRow = Math.floor((rows - 1) / 2)
  const maxHalfW = Math.floor(maxCols / 2)

  for (let r = 0; r < rows; r++) {
    const dist = Math.abs(r - midRow)
    const baseHalfW = maxHalfW - dist
    if (r % 2 === 0) {
      // Even row: odd bead count
      if (baseHalfW < 0) continue
      for (let c = centerCol - baseHalfW; c <= centerCol + baseHalfW; c++) {
        cells.add(cellKey(r, c))
      }
    } else {
      // Odd row: even bead count; need at least 2 beads (baseHalfW >= 1)
      if (baseHalfW <= 0) continue
      for (let c = centerCol - baseHalfW; c <= centerCol + baseHalfW - 1; c++) {
        cells.add(cellKey(r, c))
      }
    }
  }
  return cells
}

/**
 * Leaf/Flame: top tapers sharply, widens in the middle, tapers gradually at bottom.
 * Same even/odd parity rule applied for visual symmetry.
 */
function leafShape(rows: number, cols: number): Set<CellKey> {
  const cells = new Set<CellKey>()
  const maxCols = cols % 2 === 0 ? cols - 1 : cols
  const centerCol = Math.floor(maxCols / 2)
  const maxHalfW = Math.floor(maxCols / 2)

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1) // 0 at top, 1 at bottom
    let baseHalfW: number
    if (t < 0.35) {
      // top: sharp taper, apex at very top
      baseHalfW = Math.round(t / 0.35 * maxHalfW)
    } else if (t < 0.6) {
      // middle: full width
      baseHalfW = maxHalfW
    } else {
      // bottom: gradual taper
      baseHalfW = Math.round((1 - (t - 0.6) / 0.4) * maxHalfW)
    }
    if (r % 2 === 0) {
      // Even row: odd bead count
      for (let c = centerCol - baseHalfW; c <= centerCol + baseHalfW; c++) {
        cells.add(cellKey(r, c))
      }
    } else {
      // Odd row: even bead count; skip if baseHalfW is 0 (would be 0 beads)
      if (baseHalfW <= 0) continue
      for (let c = centerCol - baseHalfW; c <= centerCol + baseHalfW - 1; c++) {
        cells.add(cellKey(r, c))
      }
    }
  }
  return cells
}

/** Returns the active cells in the last (bottom) row — fringe anchor points. */
export function getBottomEdgeCells(cells: Set<CellKey>, rows: number): CellKey[] {
  const bottomRow = rows - 1
  return Array.from(cells)
    .filter(k => parseKey(k)[0] === bottomRow)
    .sort((a, b) => parseKey(a)[1] - parseKey(b)[1])
}

/** Returns the bounding box of the active cell set (in row/col units). */
export function getBounds(cells: Set<CellKey>): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity
  for (const k of cells) {
    const [r, c] = parseKey(k)
    if (r < minRow) minRow = r
    if (r > maxRow) maxRow = r
    if (c < minCol) minCol = c
    if (c > maxCol) maxCol = c
  }
  return { minRow, maxRow, minCol, maxCol }
}

/** Given a shape config, return valid preset shapes with display labels. */
export const SHAPE_LABELS: Record<ShapePreset, string> = {
  triangle: 'Triangle',
  diamond: 'Diamond',
  leaf: 'Leaf / Flame',
}
