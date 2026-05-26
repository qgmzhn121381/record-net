'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  color: string;
}

export default function SearchBar({ value, onChange, color }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="搜索事件..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-colors"
      style={{
        background: color + '20',
        borderColor: color + '40',
        color: '#f8fafc',
        fontFamily: 'Noto Sans SC, sans-serif',
      }}
    />
  );
}
