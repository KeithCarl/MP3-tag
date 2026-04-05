import { useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { tagsApi } from '../../api/tagsApi';
import type { ID3VersionOption } from '../../api/tagsApi';
import { filesApi } from '../../api/filesApi';
import { TagField } from './TagField';
import { LyricsEditor } from './LyricsEditor';
import { ID3VersionSelector } from './ID3VersionSelector';
import { DryRunDiff } from './DryRunDiff';
import type { TagData } from '../../types/mp3File';
import type { TagDiffResult } from '../../types/musicbrainz';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X } from 'lucide-react';

function cleanTags(tags: TagData): TagData {
  // Remove empty strings so they are not sent (null = skip field)
  return Object.fromEntries(
    Object.entries(tags).filter(([, v]) => v !== '' && v !== null)
  ) as TagData;
}

export function BatchTagEditor() {
  const { selectedIds, setFiles, scannedPaths } = useFileStore();
  const { setPanel, addToast } = useUIStore();
  const fileIds = [...selectedIds];
  const [tags, setTags] = useState<TagData>({});
  const [version, setVersion] = useState<ID3VersionOption>('id3v2.3');
  const [backup, setBackup] = useState(true);
  const [diff, setDiff] = useState<TagDiffResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const setTag = (field: keyof TagData) => (v: string) => setTags((t) => ({ ...t, [field]: v }));

  const handlePreview = async () => {
    setLoading(true);
    try {
      const result = await tagsApi.preview({ file_ids: fileIds, tags: cleanTags(tags), id3_version: version, dry_run: true });
      setDiff(result);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Preview failed', 'error');
    } finally { setLoading(false); }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await tagsApi.batchWrite({ file_ids: fileIds, tags: cleanTags(tags), id3_version: version, backup });
      // Re-scan to refresh file list
      if (scannedPaths.length > 0) {
        const fresh = await filesApi.scan(scannedPaths);
        setFiles(fresh.files, scannedPaths, fresh.capped);
      }
      addToast(`Tags applied to ${fileIds.length} file${fileIds.length !== 1 ? 's' : ''}!`, 'success');
      setPanel(null);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Apply failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-100">Batch Edit Tags — {fileIds.length} files</h2>
        <button onClick={() => setPanel(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-200" /></button>
      </div>
      <p className="text-xs text-gray-400">Leave a field blank to skip it (won't overwrite existing values).</p>
      <div className="grid grid-cols-2 gap-3">
        <TagField label="Title" value={tags.title ?? ''} onChange={setTag('title')} placeholder="Leave blank to skip" />
        <TagField label="Artist" value={tags.artist ?? ''} onChange={setTag('artist')} placeholder="Leave blank to skip" />
        <TagField label="Album" value={tags.album ?? ''} onChange={setTag('album')} placeholder="Leave blank to skip" />
        <TagField label="Year" value={tags.year ?? ''} onChange={setTag('year')} placeholder="Leave blank to skip" />
        <TagField label="Genre" value={tags.genre ?? ''} onChange={setTag('genre')} placeholder="Leave blank to skip" />
        <TagField label="Track #" value={tags.track_number ?? ''} onChange={setTag('track_number')} placeholder="Leave blank to skip" />
      </div>
      <TagField label="Comment" value={tags.comment ?? ''} onChange={setTag('comment')} placeholder="Leave blank to skip" />
      {version !== 'id3v1.1' && <LyricsEditor value={tags.lyrics ?? ''} onChange={setTag('lyrics')} placeholder="Leave blank to skip" />}
      <ID3VersionSelector value={version} onChange={setVersion} />
      {diff && <DryRunDiff diffs={diff} />}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="accent-blue-500" />
          Backup originals (.bak)
        </label>
        <div className="flex gap-2">
          {loading && <LoadingSpinner size="sm" />}
          <button onClick={handlePreview} disabled={loading} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-sm disabled:opacity-50">Preview</button>
          {diff && <button onClick={handleApply} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50">Apply to {fileIds.length} Files</button>}
        </div>
      </div>
    </div>
  );
}
