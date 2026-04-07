import type { StrandLayout } from '../../lib/fringeUtils.ts'
import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { FringeCell } from './FringeCell.tsx'

interface Props {
  strands: StrandLayout[]
  onSegmentEnter: (key: string) => void
}

export function FringeStrands({ strands, onSegmentEnter }: Props) {
  const fringePaint = useDesignStore(s => s.fringePaint)
  const palette = usePaletteStore(s => s.beads)

  return (
    <>
      {strands.map(strand =>
        strand.segments.map(segment => {
          const key = `${segment.strandIndex},${segment.segmentIndex}`
          const beadId = fringePaint[key]
          const bead = beadId ? palette.find(b => b.id === beadId) : null
          const hex = bead ? bead.hex : null

          return (
            <FringeCell
              key={key}
              segment={segment}
              hex={hex}
              onPointerEnter={() => onSegmentEnter(key)}
            />
          )
        })
      )}
    </>
  )
}
