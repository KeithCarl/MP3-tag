import type { FringeSegmentLayout } from '../../lib/fringeUtils.ts'
import { BugleBeadCell, SeedBeadCell } from './BeadCell.tsx'
import { BEAD_R } from './BrickStitchBody.tsx'

interface Props {
  segment: FringeSegmentLayout
  hex: string | null
  onPointerEnter: () => void
}

export function FringeCell({ segment, hex, onPointerEnter }: Props) {
  if (segment.type === 'bugle') {
    return (
      <BugleBeadCell
        x={segment.x - segment.width / 2}
        y={segment.y - segment.height / 2}
        width={segment.width}
        height={segment.height}
        hex={hex}
        onPointerEnter={onPointerEnter}
      />
    )
  }

  return (
    <SeedBeadCell
      cx={segment.x}
      cy={segment.y}
      r={BEAD_R - 0.5}
      hex={hex}
      onPointerEnter={onPointerEnter}
    />
  )
}
