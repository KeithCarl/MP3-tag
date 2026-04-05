import { useState, useRef } from 'react';
import { filesApi, scanStream } from '../../api/filesApi';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { FolderPathInput } from '../files/FolderPathInput';
import { FolderTree } from '../files/FolderTree';
import { FileTable } from '../files/FileTable';
import { SelectionToolbar } from '../files/SelectionToolbar';
import { ScanProgressBar } from '../files/ScanProgressBar';
import { TagEditor } from '../tags/TagEditor';
import { BatchTagEditor } from '../tags/BatchTagEditor';
import { RenamePanel } from '../rename/RenamePanel';
import { MBSearchPanel } from '../musicbrainz/MBSearchPanel';
import type { FolderNode, MP3FileInfo } from '../../types/mp3File';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function AppShell() {
  const { setFiles } = useFileStore();
  const { activePanel, addToast } = useUIStore();
  const [rootNodes, setRootNodes] = useState<FolderNode[] | null>(null);
  const [rootPath, setRootPath] = useState('');
  const [treeLoading, setTreeLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const filesBufRef = useRef<MP3FileInfo[]>([]);

  const handleBrowse = async (path: string) => {
    setRootPath(path);
    setTreeLoading(true);
    setRootNodes(null);
    try {
      const nodes = await filesApi.tree(path);
      setRootNodes(nodes);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to browse folder', 'error');
    } finally {
      setTreeLoading(false);
    }
  };

  const handleScan = async (paths: string[]) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setScanLoading(true);
    setScanCount(0);
    filesBufRef.current = [];
    setFiles([], paths, false);

    try {
      await scanStream(
        paths,
        (event) => {
          if (event.type === 'file') {
            filesBufRef.current = [...filesBufRef.current, event.file];
            setScanCount(event.scanned);
            if (event.scanned % 50 === 0) {
              setFiles([...filesBufRef.current], paths, false);
            }
          } else if (event.type === 'done') {
            setFiles([...filesBufRef.current], paths, event.capped);
            if (event.capped) {
              addToast(
                `Capped at ${event.total.toLocaleString()} files. Select fewer folders to see more.`,
                'info',
              );
            }
          }
        },
        abortRef.current.signal,
      );
      setFiles([...filesBufRef.current], paths, false);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        addToast(e instanceof Error ? e.message : 'Scan failed', 'error');
      }
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col p-4 gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-blue-400 mb-3">MP3 Tag Editor</h1>
          <FolderPathInput onSubmit={handleBrowse} isLoading={treeLoading} />
        </div>
        {treeLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}
        {rootNodes !== null && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <p className="text-xs text-gray-400 mb-2">Select folders to scan:</p>
            <div className="flex-1 overflow-y-auto">
              <FolderTree
                rootPath={rootPath}
                rootNodes={rootNodes}
                onScan={handleScan}
                isScanning={scanLoading}
              />
            </div>
            {scanLoading && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <ScanProgressBar scanned={scanCount} />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activePanel && (
          <div className="p-4 border-b border-gray-700 overflow-y-auto max-h-[60vh]">
            {activePanel === 'tags' && <TagEditor />}
            {activePanel === 'batch-tags' && <BatchTagEditor />}
            {activePanel === 'rename' && <RenamePanel />}
            {activePanel === 'musicbrainz' && <MBSearchPanel />}
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col">
          <FileTable />
        </div>
        <SelectionToolbar />
      </main>
    </div>
  );
}
