import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

interface FolderPathInputProps {
  onSubmit: (path: string) => void;
  isLoading?: boolean;
}

export function FolderPathInput({ onSubmit, isLoading }: FolderPathInputProps) {
  const [path, setPath] = useState('');
  return (
    <div className="flex gap-2 items-center">
      <FolderOpen className="text-blue-400 h-5 w-5 flex-shrink-0" />
      <input
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && path && onSubmit(path)}
        placeholder="/path/to/music"
        className="flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
      />
      <button
        disabled={!path || isLoading}
        onClick={() => path && onSubmit(path)}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        Browse
      </button>
    </div>
  );
}
