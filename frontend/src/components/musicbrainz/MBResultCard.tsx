import type { MBRecording } from '../../types/musicbrainz';

interface MBResultCardProps {
  recording: MBRecording;
  onApply: (r: MBRecording) => void;
}

export function MBResultCard({ recording: r, onApply }: MBResultCardProps) {
  const scoreColor = r.score >= 75 ? 'text-green-400' : r.score >= 50 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="bg-gray-700 rounded p-3 flex items-start gap-3">
      <span className={`text-sm font-bold ${scoreColor} w-8 flex-shrink-0`}>{r.score}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100 truncate">{r.title}</p>
        <p className="text-xs text-gray-400 truncate">{r.artist}{r.album ? ` — ${r.album}` : ''}{r.year ? ` (${r.year})` : ''}</p>
      </div>
      <button onClick={() => onApply(r)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex-shrink-0">
        Apply
      </button>
    </div>
  );
}
