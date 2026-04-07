import { useRef } from 'react'
import { useDesignStore } from '../../store/designStore.ts'
import { usePaletteStore } from '../../store/paletteStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { exportSvgAsPng } from '../../lib/exportPng.ts'

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function Toolbar({ svgRef }: Props) {
  const name = useDesignStore(s => s.name)
  const setName = useDesignStore(s => s.setName)
  const undo = useDesignStore(s => s.undo)
  const clear = useDesignStore(s => s.clear)
  const historyIndex = useDesignStore(s => s.historyIndex)
  const newDesign = useDesignStore(s => s.newDesign)
  const setShowMaterials = useUIStore(s => s.setShowMaterials)
  const addToast = useUIStore(s => s.addToast)
  const palette = usePaletteStore(s => s.beads)

  // silence unused warning
  void palette

  const inputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const svg = svgRef.current
    if (!svg) return
    try {
      await exportSvgAsPng(svg, `${name || 'earring'}.png`)
      addToast('Exported as PNG', 'success')
    } catch {
      addToast('Export failed', 'error')
    }
  }

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
      <span className="text-sm font-semibold text-indigo-700 mr-2">💎 Earring Designer</span>

      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
        placeholder="Design name"
      />

      <div className="flex gap-1.5 ml-auto">
        <ToolbarBtn onClick={() => undo()} disabled={historyIndex < 0} title="Undo">
          ↩ Undo
        </ToolbarBtn>
        <ToolbarBtn onClick={() => clear()} title="Clear all paint">
          🗑 Clear
        </ToolbarBtn>
        <ToolbarBtn onClick={() => newDesign()} title="New design">
          + New
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setShowMaterials(true)} title="Show materials list">
          📋 Materials
        </ToolbarBtn>
        <ToolbarBtn onClick={handleExport} primary title="Export as PNG">
          ⬇ Export PNG
        </ToolbarBtn>
      </div>
    </header>
  )
}

interface BtnProps {
  onClick: () => void
  disabled?: boolean
  title?: string
  primary?: boolean
  children: React.ReactNode
}

function ToolbarBtn({ onClick, disabled, title, primary, children }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 rounded-lg text-sm border transition-colors disabled:opacity-40 ${
        primary
          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
      }`}
    >
      {children}
    </button>
  )
}
