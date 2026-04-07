import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { ShapeConfig, FringeConfig, SavedDesign } from '../types/design.ts'

const MAX_HISTORY = 50

interface HistorySnapshot {
  bodyPaint: Record<string, string>
  fringePaint: Record<string, string>
}

interface DesignStore {
  designId: string
  name: string
  shapeConfig: ShapeConfig
  fringeConfig: FringeConfig
  bodyPaint: Record<string, string>
  fringePaint: Record<string, string>
  history: HistorySnapshot[]
  historyIndex: number

  setName(name: string): void
  setShapeConfig(cfg: ShapeConfig): void
  setFringeConfig(cfg: FringeConfig): void
  paintCell(key: string, beadId: string | null): void
  paintCells(keys: string[], beadId: string | null): void
  paintFringeCell(key: string, beadId: string | null): void
  paintFringeCells(keys: string[], beadId: string | null): void
  undo(): void
  clear(): void
  newDesign(): void
  loadDesign(d: SavedDesign): void
  toSavedDesign(palette: import('../types/design.ts').BeadEntry[]): SavedDesign
}

function snapshot(state: Pick<DesignStore, 'bodyPaint' | 'fringePaint'>): HistorySnapshot {
  return { bodyPaint: { ...state.bodyPaint }, fringePaint: { ...state.fringePaint } }
}

function pushHistory(state: DesignStore): { history: HistorySnapshot[]; historyIndex: number } {
  const snap = snapshot(state)
  const sliced = state.history.slice(0, state.historyIndex + 1)
  const newHistory = [...sliced, snap].slice(-MAX_HISTORY)
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

const defaultShapeConfig: ShapeConfig = { preset: 'triangle', rows: 10, cols: 9 }
const defaultFringeConfig: FringeConfig = {
  count: 5,
  segmentsPerStrand: [
    { type: 'seed' },
    { type: 'seed' },
    { type: 'bugle' },
    { type: 'bugle' },
    { type: 'seed' },
  ],
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  designId: nanoid(),
  name: 'Untitled design',
  shapeConfig: defaultShapeConfig,
  fringeConfig: defaultFringeConfig,
  bodyPaint: {},
  fringePaint: {},
  history: [],
  historyIndex: -1,

  setName(name) { set({ name }) },

  setShapeConfig(cfg) {
    const hist = pushHistory(get())
    set({ shapeConfig: cfg, ...hist })
  },

  setFringeConfig(cfg) {
    const hist = pushHistory(get())
    set({ fringeConfig: cfg, ...hist })
  },

  paintCell(key, beadId) {
    const state = get()
    const hist = pushHistory(state)
    const bodyPaint = { ...state.bodyPaint }
    if (beadId === null) { delete bodyPaint[key] } else { bodyPaint[key] = beadId }
    set({ bodyPaint, ...hist })
  },

  paintCells(keys, beadId) {
    if (keys.length === 0) return
    const state = get()
    const hist = pushHistory(state)
    const bodyPaint = { ...state.bodyPaint }
    for (const key of keys) {
      if (beadId === null) { delete bodyPaint[key] } else { bodyPaint[key] = beadId }
    }
    set({ bodyPaint, ...hist })
  },

  paintFringeCell(key, beadId) {
    const state = get()
    const hist = pushHistory(state)
    const fringePaint = { ...state.fringePaint }
    if (beadId === null) { delete fringePaint[key] } else { fringePaint[key] = beadId }
    set({ fringePaint, ...hist })
  },

  paintFringeCells(keys, beadId) {
    if (keys.length === 0) return
    const state = get()
    const hist = pushHistory(state)
    const fringePaint = { ...state.fringePaint }
    for (const key of keys) {
      if (beadId === null) { delete fringePaint[key] } else { fringePaint[key] = beadId }
    }
    set({ fringePaint, ...hist })
  },

  undo() {
    const { history, historyIndex } = get()
    if (historyIndex < 0) return
    const snap = history[historyIndex]
    if (!snap) return
    set({
      bodyPaint: { ...snap.bodyPaint },
      fringePaint: { ...snap.fringePaint },
      historyIndex: historyIndex - 1,
    })
  },

  clear() {
    const hist = pushHistory(get())
    set({ bodyPaint: {}, fringePaint: {}, ...hist })
  },

  newDesign() {
    set({
      designId: nanoid(),
      name: 'Untitled design',
      shapeConfig: defaultShapeConfig,
      fringeConfig: defaultFringeConfig,
      bodyPaint: {},
      fringePaint: {},
      history: [],
      historyIndex: -1,
    })
  },

  loadDesign(d) {
    set({
      designId: d.id,
      name: d.name,
      shapeConfig: d.shapeConfig,
      fringeConfig: d.fringeConfig,
      bodyPaint: { ...d.bodyPaint },
      fringePaint: { ...d.fringePaint },
      history: [],
      historyIndex: -1,
    })
  },

  toSavedDesign(palette) {
    const { designId, name, shapeConfig, fringeConfig, bodyPaint, fringePaint } = get()
    return {
      id: designId,
      name,
      savedAt: new Date().toISOString(),
      shapeConfig,
      fringeConfig,
      bodyPaint: { ...bodyPaint },
      fringePaint: { ...fringePaint },
      palette: [...palette],
    }
  },
}))
