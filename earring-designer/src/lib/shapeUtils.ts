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
 * Triangle: apex (1 bead) at top, each row grows by 2, base = cols (must be odd).
 * If cols is even, we treat it as cols - 1 at the base.
 */
function triangleShape(rows: number, cols: number): Set<CellKey> {
  const cells = new Set<CellKey>()
  const maxCols = cols % 2 === 0 ? cols - 1 : cols
  const centerCol = Math.floor(maxCols / 2)

  for (let r = 0; r < rows; r++) {
    // at row r, half-width = r (grows by 1 each side per row)
    const halfW = Math.min(r, Math.floor(maxCols / 2))
    for (let c = centerCol - halfW; c <= centerCol + halfW; c++) {
      cells.add(cellKey(r, c))
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

  for (let r = 0; r < rows; r++) {
    const dist = Math.abs(r - midRow)
    const halfW = Math.floor(maxCols / 2) - dist
    if (halfW < 0) continue
    for (let c = centerCol - halfW; c <= centerCol + halfW; c++) {
      cells.add(cellKey(r, c))
    }
  }
  return cells
}

/**
 * Leaf/Flame: top tapers sharply (like diamond top half), bottom is wider and
 * tapers more gradually. Slightly asymmetric shape.
 */
function leafShape(rows: number, cols: number): Set<CellKey> {
  const cells = new Set<CellKey>()
  const maxCols = cols % 2 === 0 ? cols - 1 : cols
  const centerCol = Math.floor(maxCols / 2)
  const maxHalfW = Math.floor(maxCols / 2)

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1) // 0 at top, 1 at bottom
    let halfW: number
    if (t < 0.35) {
      // top: sharp taper, apex at very top
      halfW = Math.round(t / 0.35 * maxHalfW)
    } else if (t < 0.6) {
      // middle: full width
      halfW = maxHalfW
    } else {
      // bottom: gradual taper
      halfW = Math.round((1 - (t - 0.6) / 0.4) * maxHalfW)
    }
    for (let c = centerCol - halfW; c <= centerCol + halfW; c++) {
      cells.add(cellKey(r, c))
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
