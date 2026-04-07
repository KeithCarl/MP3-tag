import { ShapeSelector } from './ShapeSelector.tsx'
import { FringeConfigurator } from './FringeConfigurator.tsx'
import { SavedDesigns } from './SavedDesigns.tsx'

export function ConfigPanel() {
  return (
    <aside className="w-56 shrink-0 flex flex-col gap-5 p-3 border-l border-gray-200 bg-gray-50 overflow-y-auto">
      <ShapeSelector />
      <hr className="border-gray-200" />
      <FringeConfigurator />
      <hr className="border-gray-200" />
      <SavedDesigns />
    </aside>
  )
}
