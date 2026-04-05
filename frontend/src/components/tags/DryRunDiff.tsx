import type { TagDiffResult } from '../../types/musicbrainz';

interface DryRunDiffProps {
  diffs: TagDiffResult[];
}

export function DryRunDiff({ diffs }: DryRunDiffProps) {
  const allChanges = diffs.flatMap((d) => d.changes.map((c) => ({ ...c, filename: d.filename })));
  if (allChanges.length === 0) {
    return <p className="text-gray-400 text-sm py-4 text-center">No changes to apply.</p>;
  }
  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-700 text-gray-400 text-xs uppercase">
            <th className="px-3 py-2 text-left">File</th>
            <th className="px-3 py-2 text-left">Field</th>
            <th className="px-3 py-2 text-left">Before</th>
            <th className="px-3 py-2 text-left">After</th>
          </tr>
        </thead>
        <tbody>
          {allChanges.map((c, i) => (
            <tr key={i} className="border-t border-gray-700 bg-amber-900/10">
              <td className="px-3 py-1.5 text-gray-400 text-xs max-w-xs truncate">{c.filename}</td>
              <td className="px-3 py-1.5 text-gray-300 capitalize">{c.field.replace('_', ' ')}</td>
              <td className="px-3 py-1.5 text-red-400 line-through">{c.old_value ?? '—'}</td>
              <td className="px-3 py-1.5 text-green-400">{c.new_value ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
