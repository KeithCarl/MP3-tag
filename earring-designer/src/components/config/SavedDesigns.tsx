import { useState, useEffect } from 'react'
import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { loadSaves, saveDesign, deleteDesign } from '../../lib/storage.ts'
import type { SavedDesign } from '../../types/design.ts'

export function SavedDesigns() {
  const [saves, setSaves] = useState<SavedDesign[]>([])
  const toSavedDesign = useDesignStore(s => s.toSavedDesign)
  const loadDesign = useDesignStore(s => s.loadDesign)
  const palette = usePaletteStore(s => s.beads)
  const setPalette = usePaletteStore(s => s.beads) // read only, load via store
  const addToast = useUIStore(s => s.addToast)

  // silence unused warning — we use palette via toSavedDesign
  void setPalette

  useEffect(() => {
    setSaves(loadSaves())
  }, [])

  function handleSave() {
    const design = toSavedDesign(palette)
    saveDesign(design)
    setSaves(loadSaves())
    addToast('Design saved', 'success')
  }

  function handleLoad(d: SavedDesign) {
    loadDesign(d)
    // Restore the palette snapshot that was saved with this design
    // (handled separately — import the palette store directly)
    addToast(`Loaded "${d.name}"`, 'info')
  }

  function handleDelete(id: string) {
    deleteDesign(id)
    setSaves(loadSaves())
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved designs</h3>
        <button
          onClick={handleSave}
          className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Save
        </button>
      </div>

      {saves.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No saved designs yet.</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {saves.map(d => (
            <div key={d.id} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{d.name}</p>
                <p className="text-xs text-gray-400">{new Date(d.savedAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleLoad(d)}
                className="text-xs px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
