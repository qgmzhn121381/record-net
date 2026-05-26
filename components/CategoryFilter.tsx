'use client';

import { categories } from '@/lib/moods';

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
  cardBg: string;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <button
        onClick={() => onSelect('全部')}
        className={`category-btn ${selected === '全部' ? 'active' : ''}`}
        style={{
          background: selected === '全部' ? '#667eea' : 'rgba(255,255,255,0.05)',
          color: selected === '全部' ? '#fff' : '#94a3b8',
        }}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`category-btn ${selected === cat.name ? 'active' : ''}`}
          style={{
            background: selected === cat.name ? cat.color : cat.color + '15',
            color: selected === cat.name ? '#fff' : cat.color,
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
