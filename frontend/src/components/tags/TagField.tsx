interface TagFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function TagField({ label, value, onChange, placeholder }: TagFieldProps) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
