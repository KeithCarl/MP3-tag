import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { Tag, Tags, FileEdit, Music } from 'lucide-react';

export function SelectionToolbar() {
  const { selectedIds } = useFileStore();
  const { setPanel } = useUIStore();
  const count = selectedIds.size;
  if (count === 0) return null;

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center gap-2">
      <span className="text-sm text-gray-400 mr-2">{count} selected:</span>
      {count === 1 && (
        <button onClick={() => setPanel('tags')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200">
          <Tag className="h-4 w-4" /> Edit Tags
        </button>
      )}
      <button onClick={() => setPanel('batch-tags')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200">
        <Tags className="h-4 w-4" /> Batch Edit
      </button>
      <button onClick={() => setPanel('rename')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200">
        <FileEdit className="h-4 w-4" /> Rename
      </button>
      <button onClick={() => setPanel('musicbrainz')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200">
        <Music className="h-4 w-4" /> MusicBrainz
      </button>
    </div>
  );
}
