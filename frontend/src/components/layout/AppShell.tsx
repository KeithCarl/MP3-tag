import { useState } from 'react';
import { filesApi } from '../../api/filesApi';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { FolderPathInput } from '../files/FolderPathInput';
import { FolderTree } from '../files/FolderTree';
import { FileTable } from '../files/FileTable';
import { SelectionToolbar } from '../files/SelectionToolbar';
import { TagEditor } from '../tags/TagEditor';
import { BatchTagEditor } from '../tags/BatchTagEditor';
import { RenamePanel } from '../rename/RenamePanel';
import { MBSearchPanel } from '../musicbrainz/MBSearchPanel';
import type { FolderNode } from '../../types/mp3File';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function AppShell() {
  const { setFiles } = useFileStore();
  const { activePanel, addToast } = useUIStore();
  const [rootNodes, setRootNodes] = useState<FolderNode[] | null>(null);
  const [rootPath, setRootPath] = useState('');
  const [treeLoading, setTreeLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const handleBrowse = async (path: string) => {
    setRootPath(path);
    setTreeLoading(true);
    setRootNodes(null);
    try {
      const nodes = await filesApi.tree(path);
      setRootNodes(nodes);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to browse folder', 'error');
    } finally { setTreeLoading(false); }
  };

  const handleScan = async (paths: string[]) => {
    setScanLoading(true);
    try {
      const result = await filesApi.scan(paths);
      setFiles(result.files, paths, result.capped);
      if (result.capped) addToast(`Showing first ${result.files.length} files. Refine your folder selection to see more.`, 'info');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Scan failed', 'error');
    } finally { setScanLoading(false); }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col p-4 gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-blue-400 mb-3">MP3 Tag Editor</h1>
          <FolderPathInput onSubmit={handleBrowse} isLoading={treeLoading} />
        </div>
        {treeLoading && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
        {rootNodes && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-xs text-gray-400 mb-2">Select folders to scan:</p>
            <FolderTree rootPath={rootPath} rootNodes={rootNodes} onScan={handleScan} isScanning={scanLoading} />
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Active Panel */}
        {activePanel && (
          <div className="p-4 border-b border-gray-700 bg-gray-850 overflow-y-auto max-h-[60vh]">
            {activePanel === 'tags' && <TagEditor />}
            {activePanel === 'batch-tags' && <BatchTagEditor />}
            {activePanel === 'rename' && <RenamePanel />}
            {activePanel === 'musicbrainz' && <MBSearchPanel />}
          </div>
        )}
        <FileTable />
        <SelectionToolbar />
      </main>
    </div>
  );
}
