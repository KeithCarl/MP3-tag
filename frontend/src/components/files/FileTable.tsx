import { useState, useCallback } from 'react';
import { useFileStore } from '../../store/fileStore';
import { FileRow } from './FileRow';
import { ArrowUpDown } from 'lucide-react';

type SortField = 'filename' | 'title' | 'artist' | 'year' | 'id3_version' | 'duration_seconds';
type SortDir = 'asc' | 'desc';

export function FileTable() {
  const { files, selectedIds, toggleSelect, selectAll, clearSelection, rangeSelect } = useFileStore();
  const [sortField, setSortField] = useState<SortField>('filename');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...files].sort((a, b) => {
    let av: string = '', bv: string = '';
    if (sortField === 'filename') { av = a.filename; bv = b.filename; }
    else if (sortField === 'title') { av = a.tags.title ?? ''; bv = b.tags.title ?? ''; }
    else if (sortField === 'artist') { av = a.tags.artist ?? ''; bv = b.tags.artist ?? ''; }
    else if (sortField === 'year') { av = a.tags.year ?? ''; bv = b.tags.year ?? ''; }
    else if (sortField === 'id3_version') { av = a.id3_version; bv = b.id3_version; }
    else if (sortField === 'duration_seconds') { av = String(a.duration_seconds); bv = String(b.duration_seconds); }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleToggle = useCallback((id: string, shiftKey: boolean) => {
    if (shiftKey && lastSelected) {
      rangeSelect(lastSelected, id);
    } else {
      toggleSelect(id);
      setLastSelected(id);
    }
  }, [lastSelected, toggleSelect, rangeSelect]);

  const allSelected = files.length > 0 && files.every((f) => selectedIds.has(f.file_id));

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs text-gray-400 uppercase cursor-pointer hover:text-gray-200 whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">{label}<ArrowUpDown className="h-3 w-3" /></span>
    </th>
  );

  if (files.length === 0) {
    return <div className="text-center text-gray-500 py-16">No files loaded. Scan a folder to begin.</div>;
  }

  return (
    <div className="overflow-auto flex-1">
      {selectedIds.size > 0 && (
        <div className="sticky top-0 bg-blue-900/50 px-4 py-2 text-sm text-blue-200 flex items-center gap-4">
          <span>{selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <button onClick={clearSelection} className="text-xs underline hover:no-underline">Clear</button>
          <button onClick={selectAll} className="text-xs underline hover:no-underline">Select all {files.length}</button>
        </div>
      )}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th className="px-3 py-2 w-8">
              <input type="checkbox" checked={allSelected} onChange={allSelected ? clearSelection : selectAll} className="h-4 w-4 accent-blue-500" />
            </th>
            <SortHeader field="filename" label="Filename" />
            <SortHeader field="title" label="Title" />
            <SortHeader field="artist" label="Artist" />
            <SortHeader field="year" label="Year" />
            <SortHeader field="id3_version" label="ID3" />
            <SortHeader field="duration_seconds" label="Duration" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => (
            <FileRow key={f.file_id} file={f} selected={selectedIds.has(f.file_id)} onToggle={handleToggle} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
