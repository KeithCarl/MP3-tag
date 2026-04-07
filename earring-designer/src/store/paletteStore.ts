import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { BeadEntry } from '../types/design.ts'
import { loadPalette, savePalette } from '../lib/storage.ts'

interface PaletteStore {
  beads: BeadEntry[]
  selectedBeadId: string | null
  addBead(b: Omit<BeadEntry, 'id'>): void
  updateBead(id: string, patch: Partial<Omit<BeadEntry, 'id'>>): void
  deleteBead(id: string): void
  selectBead(id: string | null): void
  loadFromStorage(): void
}

export const usePaletteStore = create<PaletteStore>((set, get) => ({
  beads: loadPalette(),
  selectedBeadId: null,

  addBead(b) {
    const entry: BeadEntry = { id: nanoid(), ...b }
    const beads = [...get().beads, entry]
    set({ beads })
    savePalette(beads)
  },

  updateBead(id, patch) {
    const beads = get().beads.map(b => b.id === id ? { ...b, ...patch } : b)
    set({ beads })
    savePalette(beads)
  },

  deleteBead(id) {
    const beads = get().beads.filter(b => b.id !== id)
    const selectedBeadId = get().selectedBeadId === id ? null : get().selectedBeadId
    set({ beads, selectedBeadId })
    savePalette(beads)
  },

  selectBead(id) {
    set({ selectedBeadId: id })
  },

  loadFromStorage() {
    set({ beads: loadPalette() })
  },
}))
