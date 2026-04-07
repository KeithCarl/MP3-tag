import { useRef } from 'react'
import { PalettePanel } from '../palette/PalettePanel.tsx'
import { ConfigPanel } from '../config/ConfigPanel.tsx'
import { Toolbar } from '../toolbar/Toolbar.tsx'
import { DesignCanvas } from '../canvas/DesignCanvas.tsx'
import { MaterialsModal } from '../common/MaterialsModal.tsx'
import { ToastProvider } from '../common/ToastProvider.tsx'

export function AppShell() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Toolbar svgRef={svgRef} />

      <div className="flex flex-1 min-h-0">
        <PalettePanel />

        {/* Canvas area */}
        <main className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 inline-block">
            <DesignCanvas svgRef={svgRef} />
          </div>
        </main>

        <ConfigPanel />
      </div>

      <MaterialsModal />
      <ToastProvider />
    </div>
  )
}
