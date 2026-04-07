import { useState } from 'react'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { BeadItem } from './BeadItem.tsx'
import { BeadEditor } from './BeadEditor.tsx'

export function PalettePanel() {
  const beads = usePaletteStore(s => s.beads)
  const addBead = usePaletteStore(s => s.addBead)
  const selectedBeadId = usePaletteStore(s => s.selectedBeadId)
  const selectBead = usePaletteStore(s => s.selectBead)
  const [adding, setAdding] = useState(false)

  const selectedBead = beads.find(b => b.id === selectedBeadId)

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Palette</h2>

      {selectedBead && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <span
            className="w-5 h-5 rounded-full border shrink-0"
            style={{ background: selectedBead.hex }}
          />
          <span className="text-xs text-indigo-700 truncate">Active: {selectedBead.name}</span>
          <button
            onClick={() => selectBead(null)}
            className="ml-auto text-indigo-400 hover:text-indigo-600 text-xs"
            title="Deselect (eraser mode)"
          >
            ✕
          </button>
        </div>
      )}

      {!selectedBead && (
        <p className="text-xs text-gray-400 italic">Select a bead to paint. Click a painted cell to erase.</p>
      )}

      <div className="flex flex-col gap-1">
        {beads.map(b => (
          <BeadItem key={b.id} bead={b} isSelected={b.id === selectedBeadId} />
        ))}
        {beads.length === 0 && (
          <p className="text-xs text-gray-400 italic px-2">No beads yet — add some below.</p>
        )}
      </div>

      {adding ? (
        <div className="border border-gray-200 rounded-xl bg-white p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">New bead</p>
          <BeadEditor
            onSave={data => { addBead(data); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-auto w-full py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Add bead
        </button>
      )}
    </aside>
  )
}
