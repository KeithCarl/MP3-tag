import type { BeadEntry, MaterialsEntry } from '../types/design.ts'

export function countBeadUsage(
  bodyPaint: Record<string, string>,
  fringePaint: Record<string, string>,
  palette: BeadEntry[],
): MaterialsEntry[] {
  const counts = new Map<string, number>()

  for (const beadId of Object.values(bodyPaint)) {
    counts.set(beadId, (counts.get(beadId) ?? 0) + 1)
  }
  for (const beadId of Object.values(fringePaint)) {
    counts.set(beadId, (counts.get(beadId) ?? 0) + 1)
  }

  const result: MaterialsEntry[] = []
  for (const [beadId, count] of counts.entries()) {
    const bead = palette.find(b => b.id === beadId)
    if (bead) result.push({ bead, count })
  }

  return result.sort((a, b) => b.count - a.count)
}
