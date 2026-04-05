import { useRef } from 'react';

const TOKENS = ['artist', 'title', 'album', 'year', 'track', 'genre'];

interface TemplateRenameProps {
  pattern: string;
  onChange: (p: string) => void;
}

export function TemplateRename({ pattern, onChange }: TemplateRenameProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const insertToken = (token: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? pattern.length;
    const end = el.selectionEnd ?? pattern.length;
    const next = pattern.slice(0, start) + `{${token}}` + pattern.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length + 2, start + token.length + 2); });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {TOKENS.map((t) => (
          <button key={t} onClick={() => insertToken(t)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-xs font-mono">
            {`{${t}}`}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={pattern}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{artist} - {track}. {title}"
        className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm font-mono border border-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
