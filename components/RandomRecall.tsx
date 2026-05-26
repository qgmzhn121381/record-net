'use client';

import { useState } from 'react';
import { categories } from '@/lib/moods';

interface RecordType {
  id: string;
  title: string;
  eventDate: string;
  category: string;
  mood: string;
  weather: string;
  note?: string | null;
}

interface RandomRecallProps {
  records: RecordType[];
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onClose: () => void;
}

function getDaysDiff(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RandomRecall({ records, cardBg, borderColor, textColor, textSecondary, onClose }: RandomRecallProps) {
  const pastRecords = records.filter((r) => getDaysDiff(r.eventDate) > 0);
  const [current, setCurrent] = useState(() =>
    pastRecords.length > 0 ? pastRecords[Math.floor(Math.random() * pastRecords.length)] : null
  );

  const nextRandom = () => {
    if (pastRecords.length <= 1) return;
    let next: RecordType;
    do {
      next = pastRecords[Math.floor(Math.random() * pastRecords.length)];
    } while (next.id === current?.id);
    setCurrent(next);
  };

  if (!current) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="recall-container" onClick={(e) => e.stopPropagation()} style={{ background: cardBg, borderColor }}>
          <p style={{ color: textSecondary, textAlign: 'center' }}>还没有过去的回忆可以随机</p>
          <button onClick={onClose} className="recall-close" style={{ color: textSecondary }}>关闭</button>
        </div>
      </div>
    );
  }

  const days = getDaysDiff(current.eventDate);
  const cat = categories.find((c) => c.name === current.category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="recall-container" onClick={(e) => e.stopPropagation()} style={{ background: cardBg, borderColor }}>
        <div className="recall-mood">{current.mood}</div>
        <h2 className="recall-title" style={{ color: textColor }}>{current.title}</h2>
        <p className="recall-date" style={{ color: textSecondary, fontFamily: 'Inter, sans-serif' }}>
          {current.eventDate} {current.weather}
        </p>
        <div className="recall-days" style={{ fontFamily: 'Inter, sans-serif' }}>
          已经过去了 <strong>{days}</strong> 天
        </div>
        <span
          className="recall-category"
          style={{ background: (cat?.color || '#95a5a6') + '30', color: cat?.color || '#95a5a6' }}
        >
          {current.category}
        </span>
        {current.note && (
          <p className="recall-note" style={{ color: textColor }}>{current.note}</p>
        )}

        <div className="recall-actions">
          <button onClick={nextRandom} className="recall-again">再看一条</button>
          <button onClick={onClose} className="recall-close-btn" style={{ color: textSecondary }}>关闭</button>
        </div>
      </div>
    </div>
  );
}
