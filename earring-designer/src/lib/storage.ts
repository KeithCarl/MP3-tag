import type { BeadEntry, SavedDesign } from '../types/design.ts'

const SAVES_KEY = 'earring-designer:saves'
const PALETTE_KEY = 'earring-designer:palette'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function loadSaves(): SavedDesign[] {
  return readJson<SavedDesign[]>(SAVES_KEY, [])
}

export function saveDesign(design: SavedDesign): void {
  const saves = loadSaves().filter(s => s.id !== design.id)
  saves.unshift(design)
  writeJson(SAVES_KEY, saves)
}

export function deleteDesign(id: string): void {
  const saves = loadSaves().filter(s => s.id !== id)
  writeJson(SAVES_KEY, saves)
}

export function loadPalette(): BeadEntry[] {
  return readJson<BeadEntry[]>(PALETTE_KEY, [])
}

export function savePalette(palette: BeadEntry[]): void {
  writeJson(PALETTE_KEY, palette)
}
