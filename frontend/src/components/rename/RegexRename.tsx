interface RegexRenameProps {
  pattern: string;
  replacement: string;
  onPatternChange: (v: string) => void;
  onReplacementChange: (v: string) => void;
}

export function RegexRename({ pattern, replacement, onPatternChange, onReplacementChange }: RegexRenameProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Match pattern (regex)</label>
        <input type="text" value={pattern} onChange={(e) => onPatternChange(e.target.value)}
          placeholder="^(\d+)\s*-\s*(.+)\.mp3$"
          className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm font-mono border border-gray-600 focus:outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Replacement</label>
        <input type="text" value={replacement} onChange={(e) => onReplacementChange(e.target.value)}
          placeholder="\\2 - Track \\1.mp3"
          className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm font-mono border border-gray-600 focus:outline-none focus:border-blue-500" />
      </div>
    </div>
  );
}
