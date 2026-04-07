import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { countBeadUsage } from '../../lib/materialsCalc.ts'
import { Modal } from './Modal.tsx'

export function MaterialsModal() {
  const showMaterials = useUIStore(s => s.showMaterials)
  const setShowMaterials = useUIStore(s => s.setShowMaterials)
  const bodyPaint = useDesignStore(s => s.bodyPaint)
  const fringePaint = useDesignStore(s => s.fringePaint)
  const palette = usePaletteStore(s => s.beads)

  const entries = countBeadUsage(bodyPaint, fringePaint, palette)
  const total = entries.reduce((sum, e) => sum + e.count, 0)

  return (
    <Modal open={showMaterials} onClose={() => setShowMaterials(false)} title="Materials list">
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No beads painted yet.</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Bead</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ bead, count }) => (
                <tr key={bead.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full border border-gray-300 shrink-0"
                      style={{ background: bead.hex }}
                    />
                    {bead.name}
                  </td>
                  <td className="py-2 text-gray-500 capitalize">{bead.type}</td>
                  <td className="py-2 text-right font-mono font-medium">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-gray-500 text-right">Total: <strong>{total}</strong> beads</p>
        </>
      )}
    </Modal>
  )
}
