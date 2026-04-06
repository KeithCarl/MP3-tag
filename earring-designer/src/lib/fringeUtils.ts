import type { FringeConfig } from '../types/design.ts'

export const SEED_W = 8   // px, seed bead diameter
export const SEED_H = 8   // px, seed bead height in fringe
export const BUGLE_W = 4  // px, bugle bead width
export const BUGLE_H = 18 // px, bugle bead height
export const BEAD_GAP = 1 // px gap between fringe segments

export interface FringeSegmentLayout {
  x: number        // center x (same as strand anchor x)
  y: number        // center y of this segment
  width: number    // bead width
  height: number   // bead height
  type: 'seed' | 'bugle'
  segmentIndex: number
  strandIndex: number
}

export interface StrandLayout {
  strandIndex: number
  anchorX: number
  segments: FringeSegmentLayout[]
  totalHeight: number
}

/**
 * Builds the layout of all fringe strands given anchor X positions and fringe config.
 * bodyBottomY is the Y coordinate at the bottom of the last body row.
 */
export function buildFringeLayout(
  anchorXPositions: number[],
  fringeConfig: FringeConfig,
  bodyBottomY: number,
): StrandLayout[] {
  const strands: StrandLayout[] = []
  const count = Math.min(fringeConfig.count, anchorXPositions.length)

  // Distribute strands evenly across available anchors
  const anchors = distributeAnchors(anchorXPositions, count)

  for (let si = 0; si < count; si++) {
    const ax = anchors[si]!
    const segments: FringeSegmentLayout[] = []
    let currentY = bodyBottomY + SEED_H / 2 + 2

    for (let seg = 0; seg < fringeConfig.segmentsPerStrand.length; seg++) {
      const segDef = fringeConfig.segmentsPerStrand[seg]!
      const isBugle = segDef.type === 'bugle'
      const h = isBugle ? BUGLE_H : SEED_H
      const w = isBugle ? BUGLE_W : SEED_W

      segments.push({
        x: ax,
        y: currentY,
        width: w,
        height: h,
        type: segDef.type,
        segmentIndex: seg,
        strandIndex: si,
      })
      currentY += h + BEAD_GAP
    }

    strands.push({
      strandIndex: si,
      anchorX: ax,
      segments,
      totalHeight: currentY - (bodyBottomY + 2),
    })
  }

  return strands
}

/** Evenly distribute `count` strands across the anchor positions. */
function distributeAnchors(anchors: number[], count: number): number[] {
  if (count >= anchors.length) return anchors.slice(0, count)
  if (count === 1) return [anchors[Math.floor(anchors.length / 2)]!]

  const result: number[] = []
  const step = (anchors.length - 1) / (count - 1)
  for (let i = 0; i < count; i++) {
    result.push(anchors[Math.round(i * step)]!)
  }
  return result
}

/** Total fringe height = tallest strand's totalHeight */
export function maxFringeHeight(strands: StrandLayout[]): number {
  return strands.reduce((m, s) => Math.max(m, s.totalHeight), 0)
}
