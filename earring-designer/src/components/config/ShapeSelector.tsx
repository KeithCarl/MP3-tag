import { useDesignStore } from '../../store/designStore.ts'
import { SHAPE_LABELS } from '../../lib/shapeUtils.ts'
import type { ShapePreset } from '../../types/design.ts'

const PRESETS: ShapePreset[] = ['triangle', 'diamond', 'leaf']

export function ShapeSelector() {
  const shapeConfig = useDesignStore(s => s.shapeConfig)
  const setShapeConfig = useDesignStore(s => s.setShapeConfig)

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shape</h3>

      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setShapeConfig({ ...shapeConfig, preset: p })}
            className={`px-2 py-1 rounded-lg text-xs border transition-colors ${
              shapeConfig.preset === p
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {SHAPE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs text-gray-600">
          <span>Rows</span>
          <span className="font-mono font-medium">{shapeConfig.rows}</span>
        </label>
        <input
          type="range"
          min={5}
          max={20}
          value={shapeConfig.rows}
          onChange={e => setShapeConfig({ ...shapeConfig, rows: Number(e.target.value) })}
          className="w-full accent-indigo-600"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs text-gray-600">
          <span>Width (cols)</span>
          <span className="font-mono font-medium">{shapeConfig.cols}</span>
        </label>
        <input
          type="range"
          min={5}
          max={21}
          step={2}
          value={shapeConfig.cols % 2 === 0 ? shapeConfig.cols + 1 : shapeConfig.cols}
          onChange={e => setShapeConfig({ ...shapeConfig, cols: Number(e.target.value) })}
          className="w-full accent-indigo-600"
        />
      </div>
    </div>
  )
}
