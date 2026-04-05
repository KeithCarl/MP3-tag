import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { useRenamePreview } from '../../hooks/useRenamePreview';
import { renameApi } from '../../api/renameApi';
import { TemplateRename } from './TemplateRename';
import { RegexRename } from './RegexRename';
import { RenamePreviewTable } from './RenamePreviewTable';
import type { RenameRule } from '../../types/rename';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X } from 'lucide-react';

export function RenamePanel() {
  const { selectedIds, removeFiles } = useFileStore();
  const { setPanel, addToast } = useUIStore();
  const fileIds = [...selectedIds];

  const [mode, setMode] = useState<'template' | 'regex'>('template');
  const [templatePattern, setTemplatePattern] = useState('{artist} - {track}. {title}');
  const [regexPattern, setRegexPattern] = useState('');
  const [regexReplacement, setRegexReplacement] = useState('');
  const [backup, setBackup] = useState(true);
  const [applying, setApplying] = useState(false);

  const rule: RenameRule | null = mode === 'template'
    ? { mode: 'template', pattern: templatePattern }
    : regexPattern ? { mode: 'regex', pattern: regexPattern, replacement: regexReplacement } : null;

  const { preview, loading } = useRenamePreview(fileIds, rule);

  const handleApply = async () => {
    if (!rule || !preview || preview.has_conflicts) return;
    setApplying(true);
    try {
      await renameApi.apply(fileIds, rule, backup);
      removeFiles(fileIds);
      addToast(`Renamed ${fileIds.length} file${fileIds.length !== 1 ? 's' : ''}!`, 'success');
      setPanel(null);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Rename failed', 'error');
    } finally { setApplying(false); }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-100">Rename Files — {fileIds.length} selected</h2>
        <button onClick={() => setPanel(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-200" /></button>
      </div>
      <Tabs.Root value={mode} onValueChange={(v) => setMode(v as 'template' | 'regex')}>
        <Tabs.List className="flex border-b border-gray-700 mb-3">
          {(['template', 'regex'] as const).map((t) => (
            <Tabs.Trigger key={t} value={t} className="px-4 py-2 text-sm text-gray-400 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 capitalize">
              {t}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="template"><TemplateRename pattern={templatePattern} onChange={setTemplatePattern} /></Tabs.Content>
        <Tabs.Content value="regex"><RegexRename pattern={regexPattern} replacement={regexReplacement} onPatternChange={setRegexPattern} onReplacementChange={setRegexReplacement} /></Tabs.Content>
      </Tabs.Root>
      {loading && <div className="flex justify-center"><LoadingSpinner size="sm" /></div>}
      {preview && <RenamePreviewTable previews={preview.previews} />}
      {preview?.has_conflicts && <p className="text-red-400 text-xs">⚠ Conflicts detected. Resolve before applying.</p>}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="accent-blue-500" />
          Backup originals (.bak)
        </label>
        <button
          disabled={!preview || preview.has_conflicts || applying}
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {applying ? 'Applying...' : 'Apply Rename'}
        </button>
      </div>
    </div>
  );
}
