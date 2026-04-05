import { AlertTriangle } from 'lucide-react';
import type { ID3VersionOption } from '../../api/tagsApi';

interface ID3VersionSelectorProps {
  value: ID3VersionOption;
  onChange: (v: ID3VersionOption) => void;
}

export function ID3VersionSelector({ value, onChange }: ID3VersionSelectorProps) {
  const options: { label: string; value: ID3VersionOption }[] = [
    { label: 'ID3v2.4 (recommended)', value: 'id3v2.4' },
    { label: 'ID3v2.3', value: 'id3v2.3' },
    { label: 'ID3v1.1 (lossy)', value: 'id3v1.1' },
  ];
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">Save as ID3 version:</label>
      <div className="flex gap-3">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-200">
            <input type="radio" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-blue-500" />
            {o.label}
          </label>
        ))}
      </div>
      {value === 'id3v1.1' && (
        <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs bg-amber-900/20 rounded px-3 py-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ID3v1.1 is lossy: text truncated to 30 chars, lyrics not supported.
        </div>
      )}
    </div>
  );
}
