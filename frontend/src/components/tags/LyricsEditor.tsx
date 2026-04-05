interface LyricsEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function LyricsEditor({ value, onChange, placeholder }: LyricsEditorProps) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">Lyrics (USLT)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Leave blank to skip'}
        rows={6}
        className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 font-mono resize-y"
      />
    </div>
  );
}
