import { useState } from 'react'
import type { BeadEntry, BeadType } from '../../types/design.ts'

interface Props {
  initial?: Partial<BeadEntry>
  onSave: (data: Omit<BeadEntry, 'id'>) => void
  onCancel: () => void
}

export function BeadEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [hex, setHex] = useState(initial?.hex ?? '#ff6b9d')
  const [type, setType] = useState<BeadType>(initial?.type ?? 'seed')

  const valid = name.trim().length > 0

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Miyuki 0006 Garnet"
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={e => setHex(e.target.value)}
            className="w-10 h-9 rounded cursor-pointer border border-gray-300"
          />
          <input
            type="text"
            value={hex}
            onChange={e => setHex(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Type</label>
        <div className="flex gap-2">
          {(['seed', 'bugle'] as BeadType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${
                type === t
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {t === 'seed' ? 'Seed bead' : 'Bugle bead'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => valid && onSave({ name: name.trim(), hex, type })}
          disabled={!valid}
          className="flex-1 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}
