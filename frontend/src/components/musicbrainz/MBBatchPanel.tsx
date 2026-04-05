import { useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { musicbrainzApi } from '../../api/musicbrainzApi';
import { filesApi } from '../../api/filesApi';
import type { MBRecording } from '../../types/musicbrainz';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface MatchRow {
  file_id: string;
  filename: string;
  result: MBRecording | null;
  confirmed: boolean;
}

export function MBBatchPanel() {
  const { files, selectedIds, setFiles, scannedPaths } = useFileStore();
  const { addToast } = useUIStore();
  const fileIds = [...selectedIds];
  const selectedFiles = files.filter((f) => fileIds.includes(f.file_id));

  const [rows, setRows] = useState<MatchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState(false);

  const runBatchSearch = async () => {
    setSearching(true);
    const results: MatchRow[] = [];
    for (const f of selectedFiles) {
      try {
        const hits = await musicbrainzApi.search({
          title: f.tags.title ?? '',
          artist: f.tags.artist ?? '',
          limit: 1,
        });
        results.push({
          file_id: f.file_id,
          filename: f.filename,
          result: hits[0] ?? null,
          confirmed: (hits[0]?.score ?? 0) >= 75,
        });
      } catch {
        results.push({ file_id: f.file_id, filename: f.filename, result: null, confirmed: false });
      }
    }
    setRows(results);
    setSearching(false);
  };

  const toggleConfirm = (id: string) =>
    setRows((r) => r.map((row) => (row.file_id === id ? { ...row, confirmed: !row.confirmed } : row)));

  const handleApplyAll = async () => {
    const confirmed = rows.filter((r) => r.confirmed && r.result);
    if (confirmed.length === 0) return;
    setApplying(true);
    try {
      for (const row of confirmed) {
        await musicbrainzApi.apply({
          file_ids: [row.file_id],
          recording_mbid: row.result!.recording_mbid,
          backup: true,
        });
      }
      if (scannedPaths.length > 0) {
        const fresh = await filesApi.scan(scannedPaths);
        setFiles(fresh.files, scannedPaths, fresh.capped);
      }
      addToast(`Applied MusicBrainz tags to ${confirmed.length} files!`, 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Batch apply failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={runBatchSearch}
        disabled={searching}
        className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {searching && <LoadingSpinner size="sm" />}
        {searching ? 'Searching...' : `Auto-search ${fileIds.length} files`}
      </button>
      {rows.length > 0 && (
        <>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-700 text-gray-400 text-xs uppercase">
                  <th className="px-2 py-2">Use</th>
                  <th className="px-3 py-2 text-left">File</th>
                  <th className="px-3 py-2 text-left">Match</th>
                  <th className="px-3 py-2 text-left">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.file_id} className="border-t border-gray-700">
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.confirmed}
                        disabled={!row.result}
                        onChange={() => toggleConfirm(row.file_id)}
                        className="accent-blue-500"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-gray-300 text-xs truncate max-w-xs">{row.filename}</td>
                    <td className="px-3 py-1.5 text-gray-300 text-xs truncate max-w-xs">
                      {row.result ? `${row.result.title} — ${row.result.artist}` : '—'}
                    </td>
                    <td className={`px-3 py-1.5 text-xs font-bold ${(row.result?.score ?? 0) >= 75 ? 'text-green-400' : 'text-amber-400'}`}>
                      {row.result?.score ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleApplyAll}
            disabled={applying || rows.filter((r) => r.confirmed).length === 0}
            className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            {applying ? 'Applying...' : `Apply ${rows.filter((r) => r.confirmed).length} matches`}
          </button>
        </>
      )}
    </div>
  );
}
