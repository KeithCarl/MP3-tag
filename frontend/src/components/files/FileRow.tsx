import type { MP3FileInfo } from '../../types/mp3File';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ID3Badge({ version }: { version: string }) {
  const colors: Record<string, string> = {
    'id3v2.4': 'bg-green-700 text-green-100',
    'id3v2.3': 'bg-blue-700 text-blue-100',
    'id3v1.1': 'bg-amber-700 text-amber-100',
    none: 'bg-gray-600 text-gray-300',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${colors[version] ?? colors.none}`}>
      {version}
    </span>
  );
}

interface FileRowProps {
  file: MP3FileInfo;
  selected: boolean;
  onToggle: (id: string, shiftKey: boolean) => void;
}

export function FileRow({ file, selected, onToggle }: FileRowProps) {
  return (
    <tr
      className={`border-b border-gray-700 hover:bg-gray-750 cursor-pointer select-none ${selected ? 'bg-blue-900/30' : ''}`}
      onClick={(e) => onToggle(file.file_id, e.shiftKey)}
    >
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(file.file_id, false)}
          className="h-4 w-4 accent-blue-500"
        />
      </td>
      <td className="px-3 py-2 text-sm text-gray-200 max-w-xs truncate">{file.filename}</td>
      <td className="px-3 py-2 text-sm text-gray-300 max-w-xs truncate">{file.tags.title ?? ''}</td>
      <td className="px-3 py-2 text-sm text-gray-300 max-w-xs truncate">{file.tags.artist ?? ''}</td>
      <td className="px-3 py-2 text-sm text-gray-300 max-w-xs truncate">{file.tags.album ?? ''}</td>
      <td className="px-3 py-2 text-sm text-gray-300 max-w-xs truncate">{file.tags.genre ?? ''}</td>
      <td className="px-3 py-2 text-sm text-gray-300">{file.tags.year ?? ''}</td>
      <td className="px-3 py-2"><ID3Badge version={file.id3_version} /></td>
      <td className="px-3 py-2 text-sm text-gray-400">{formatDuration(file.duration_seconds)}</td>
      <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">{file.path ?? ''}</td>
    </tr>
  );
}
