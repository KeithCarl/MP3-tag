import { useDesignStore } from '../../store/designStore.ts'
import { getShapeCells, getBottomEdgeCells } from '../../lib/shapeUtils.ts'
import type { BeadType, FringeSegment } from '../../types/design.ts'

export function FringeConfigurator() {
  const shapeConfig = useDesignStore(s => s.shapeConfig)
  const fringeConfig = useDesignStore(s => s.fringeConfig)
  const setFringeConfig = useDesignStore(s => s.setFringeConfig)

  const activeCells = getShapeCells(shapeConfig)
  const bottomEdge = getBottomEdgeCells(activeCells, shapeConfig.rows)
  const maxStrands = bottomEdge.length

  const count = Math.min(fringeConfig.count, maxStrands)

  function updateSegmentType(i: number, type: BeadType) {
    const segs = fringeConfig.segmentsPerStrand.map((s, idx) => idx === i ? { ...s, type } : s)
    setFringeConfig({ ...fringeConfig, segmentsPerStrand: segs })
  }

  function addSegment() {
    setFringeConfig({
      ...fringeConfig,
      segmentsPerStrand: [...fringeConfig.segmentsPerStrand, { type: 'seed' }],
    })
  }

  function removeSegment(i: number) {
    setFringeConfig({
      ...fringeConfig,
      segmentsPerStrand: fringeConfig.segmentsPerStrand.filter((_, idx) => idx !== i),
    })
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fringe</h3>

      <div className="space-y-1.5">
        <label className="flex items-center justify-between text-xs text-gray-600">
          <span>Strands</span>
          <span className="font-mono font-medium">{count} / {maxStrands}</span>
        </label>
        <input
          type="range"
          min={0}
          max={maxStrands}
          value={count}
          onChange={e => setFringeConfig({ ...fringeConfig, count: Number(e.target.value) })}
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5">Strand template (top → bottom)</p>
        <div className="space-y-1">
          {fringeConfig.segmentsPerStrand.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
              <SegmentToggle
                value={seg.type}
                onChange={type => updateSegmentType(i, type)}
              />
              <button
                onClick={() => removeSegment(i)}
                className="text-gray-300 hover:text-red-400 text-sm ml-auto"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {fringeConfig.segmentsPerStrand.length === 0 && (
          <p className="text-xs text-gray-400 italic">No segments — fringe strands will be empty.</p>
        )}
        <button
          onClick={addSegment}
          className="mt-2 w-full py-1 rounded border border-dashed border-gray-300 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Add segment
        </button>
      </div>
    </div>
  )
}

interface SegmentToggleProps {
  value: FringeSegment['type']
  onChange: (v: BeadType) => void
}

function SegmentToggle({ value, onChange }: SegmentToggleProps) {
  return (
    <div className="flex gap-1">
      {(['seed', 'bugle'] as BeadType[]).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${
            value === t
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
          }`}
        >
          {t === 'seed' ? '● seed' : '▬ bugle'}
        </button>
      ))}
    </div>
  )
}
