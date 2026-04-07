import { useState } from 'react'
import type { BeadEntry } from '../../types/design.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { BeadEditor } from './BeadEditor.tsx'

interface Props {
  bead: BeadEntry
  isSelected: boolean
}

export function BeadItem({ bead, isSelected }: Props) {
  const selectBead = usePaletteStore(s => s.selectBead)
  const updateBead = usePaletteStore(s => s.updateBead)
  const deleteBead = usePaletteStore(s => s.deleteBead)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="p-2 border border-indigo-300 rounded-lg bg-indigo-50">
        <BeadEditor
          initial={bead}
          onSave={data => { updateBead(bead.id, data); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-100 ring-1 ring-indigo-400' : 'hover:bg-gray-100'
      }`}
      onClick={() => selectBead(isSelected ? null : bead.id)}
    >
      <span
        className={`w-5 h-5 rounded-full border shrink-0 ${bead.type === 'bugle' ? 'rounded' : 'rounded-full'}`}
        style={{ background: bead.hex, borderColor: bead.hex, borderWidth: 1, outlineColor: '#888' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{bead.name}</p>
        <p className="text-xs text-gray-400 capitalize">{bead.type}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); setEditing(true) }}
        className="text-gray-400 hover:text-gray-600 text-xs px-1"
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={e => { e.stopPropagation(); deleteBead(bead.id) }}
        className="text-gray-400 hover:text-red-500 text-xs px-1"
        title="Delete"
      >
        ✕
      </button>
    </div>
  )
}
