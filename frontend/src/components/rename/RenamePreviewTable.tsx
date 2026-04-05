import type { RenamePreviewItem } from '../../types/rename';

export function RenamePreviewTable({ previews }: { previews: RenamePreviewItem[] }) {
  if (previews.length === 0) return null;
  return (
    <div className="overflow-auto max-h-60">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-700 text-gray-400 text-xs uppercase">
            <th className="px-3 py-2 text-left">Old Name</th>
            <th className="px-3 py-2 text-left">New Name</th>
          </tr>
        </thead>
        <tbody>
          {previews.map((p) => (
            <tr key={p.file_id} className={`border-t border-gray-700 ${p.conflict ? 'bg-red-900/20' : ''}`}>
              <td className="px-3 py-1.5 text-gray-400 text-xs">{p.old_name}</td>
              <td className={`px-3 py-1.5 text-xs ${p.conflict ? 'text-red-400' : 'text-green-400'}`}>
                {p.new_name}{p.conflict && ' ⚠ conflict'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
