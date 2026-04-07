export type BeadType = 'seed' | 'bugle'

export interface BeadEntry {
  id: string
  name: string
  hex: string
  type: BeadType
}

export type ShapePreset = 'triangle' | 'diamond' | 'leaf'

export interface ShapeConfig {
  preset: ShapePreset
  rows: number
  cols: number
}

export interface FringeSegment {
  type: BeadType
}

export interface FringeConfig {
  count: number
  segmentsPerStrand: FringeSegment[]
}

export interface SavedDesign {
  id: string
  name: string
  savedAt: string
  shapeConfig: ShapeConfig
  fringeConfig: FringeConfig
  bodyPaint: Record<string, string>
  fringePaint: Record<string, string>
  palette: BeadEntry[]
}

export interface MaterialsEntry {
  bead: BeadEntry
  count: number
}
