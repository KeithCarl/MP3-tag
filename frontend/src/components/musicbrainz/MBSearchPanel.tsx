import { useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { useMusicBrainz } from '../../hooks/useMusicBrainz';
import { musicbrainzApi } from '../../api/musicbrainzApi';
import { MBResultCard } from './MBResultCard';
import type { MBRecording, TagDiffResult } from '../../types/musicbrainz';
import { DryRunDiff } from '../tags/DryRunDiff';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X } from 'lucide-react';
import { filesApi } from '../../api/filesApi';

export function MBSearchPanel() {
  const { files, selectedIds, setFiles, scannedPaths } = useFileStore();
  const { setPanel, addToast } = useUIStore();
  const { results, loading, error, search } = useMusicBrainz();

  const fileIds = [...selectedIds];
  const firstFile = files.find((f) => f.file_id === fileIds[0]);

  const [searchTitle, setSearchTitle] = useState(firstFile?.tags.title ?? '');
  const [searchArtist, setSearchArtist] = useState(firstFile?.tags.artist ?? '');
  const [searchAlbum, setSearchAlbum] = useState('');
  const [diff, setDiff] = useState<TagDiffResult[] | null>(null);
  const [applying, setApplying] = useState(false);
  const [pendingRecording, setPendingRecording] = useState<MBRecording | null>(null);

  const handleApply = async (recording: MBRecording) => {
    setPendingRecording(recording);
    setApplying(true);
    try {
      const dryResult = await musicbrainzApi.apply({
        file_ids: fileIds,
        recording_mbid: recording.recording_mbid,
        dry_run: true,
      });
      setDiff(dryResult);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Preview failed', 'error');
    } finally { setApplying(false); }
  };

  const handleConfirm = async () => {
    if (!pendingRecording) return;
    setApplying(true);
    try {
      await musicbrainzApi.apply({ file_ids: fileIds, recording_mbid: pendingRecording.recording_mbid, backup: true });
      if (scannedPaths.length > 0) {
        const fresh = await filesApi.scan(scannedPaths);
        setFiles(fresh.files, scannedPaths, fresh.capped);
      }
      addToast('Tags applied from MusicBrainz!', 'success');
      setPanel(null);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Apply failed', 'error');
    } finally { setApplying(false); }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-100">MusicBrainz Lookup — {fileIds.length} file{fileIds.length !== 1 ? 's' : ''}</h2>
        <button onClick={() => setPanel(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-200" /></button>
      </div>
      <div className="flex gap-2">
        <input value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} placeholder="Title" className="flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500" />
        <input value={searchArtist} onChange={(e) => setSearchArtist(e.target.value)} placeholder="Artist" className="flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500" />
        <input value={searchAlbum} onChange={(e) => setSearchAlbum(e.target.value)} placeholder="Album" className="flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500" />
        <button onClick={() => search({ title: searchTitle, artist: searchArtist, album: searchAlbum })} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50">
          {loading ? <LoadingSpinner size="sm" /> : 'Search'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
        {results.map((r) => <MBResultCard key={r.recording_mbid} recording={r} onApply={handleApply} />)}
        {results.length === 0 && !loading && <p className="text-gray-500 text-sm text-center py-4">Search to find recordings.</p>}
      </div>
      {diff && (
        <>
          <DryRunDiff diffs={diff} />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setDiff(null); setPendingRecording(null); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-sm">Cancel</button>
            <button onClick={handleConfirm} disabled={applying} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50">
              {applying ? 'Applying...' : 'Confirm & Apply'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
