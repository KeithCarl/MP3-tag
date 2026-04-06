import { useState, useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { filesApi } from '../../api/filesApi';
import { tagsApi } from '../../api/tagsApi';
import type { ID3VersionOption } from '../../api/tagsApi';
import { TagField } from './TagField';
import { LyricsEditor } from './LyricsEditor';
import { ID3VersionSelector } from './ID3VersionSelector';
import { DryRunDiff } from './DryRunDiff';
import type { TagDiffResult } from '../../types/musicbrainz';
import type { TagData } from '../../types/mp3File';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X } from 'lucide-react';

export function TagEditor() {
  const { files, selectedIds, updateFile } = useFileStore();
  const { setPanel, addToast } = useUIStore();
  const fileId = [...selectedIds][0];
  const file = files.find((f) => f.file_id === fileId);

  const [tags, setTags] = useState<TagData>(file?.tags ?? {});
  const [version, setVersion] = useState<ID3VersionOption>('id3v2.4');
  const [backup, setBackup] = useState(true);
  const [diff, setDiff] = useState<TagDiffResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (file) setTags({ ...file.tags }); }, [file?.file_id]);

  const setTag = (field: keyof TagData) => (v: string) => setTags((t) => ({ ...t, [field]: v || null }));

  const handlePreview = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const result = await tagsApi.preview({ file_ids: [fileId], tags, id3_version: version, dry_run: true });
      setDiff(result);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Preview failed', 'error');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      await tagsApi.writeTags(fileId, { tags, id3_version: version, dry_run: false, backup });
      const updated = await filesApi.getInfo(fileId);
      updateFile(updated);
      addToast('Tags saved!', 'success');
      setPanel(null);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally { setLoading(false); }
  };

  if (!file) return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-100">Edit Tags — {file.filename}</h2>
        <button onClick={() => setPanel(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-200" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TagField label="Title" value={tags.title ?? ''} onChange={setTag('title')} />
        <TagField label="Artist" value={tags.artist ?? ''} onChange={setTag('artist')} />
        <TagField label="Album" value={tags.album ?? ''} onChange={setTag('album')} />
        <TagField label="Year" value={tags.year ?? ''} onChange={setTag('year')} />
        <TagField label="Genre" value={tags.genre ?? ''} onChange={setTag('genre')} />
        <TagField label="Track #" value={tags.track_number ?? ''} onChange={setTag('track_number')} />
      </div>
      <TagField label="Comment" value={tags.comment ?? ''} onChange={setTag('comment')} />
      {version !== 'id3v1.1' && <LyricsEditor value={tags.lyrics ?? ''} onChange={setTag('lyrics')} />}
      <ID3VersionSelector value={version} onChange={setVersion} />
      {diff && <DryRunDiff diffs={diff} />}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="accent-blue-500" />
          Backup original (.bak)
        </label>
        <div className="flex gap-2">
          {loading && <LoadingSpinner size="sm" />}
          <button onClick={handlePreview} disabled={loading} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-sm disabled:opacity-50">
            Preview
          </button>
          {diff && (
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50">
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
