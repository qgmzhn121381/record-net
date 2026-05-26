'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  color: string;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="搜索事件..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="search-bar"
    />
  );
}
