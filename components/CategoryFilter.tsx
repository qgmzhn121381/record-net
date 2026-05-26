'use client';

import { categories } from '@/lib/moods';

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
  cardBg: string;
}

export default function CategoryFilter({ selected, onSelect, cardBg }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('全部')}
        className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
        style={{
          background: selected === '全部' ? '#f97316' : cardBg,
          color: selected === '全部' ? '#fff' : '#94a3b8',
        }}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
          style={{
            background: selected === cat.name ? cat.color : cardBg,
            color: selected === cat.name ? '#fff' : '#94a3b8',
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
