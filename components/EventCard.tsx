'use client';

import { useState } from 'react';
import { categories, milestoneDays } from '@/lib/moods';

interface Record {
  id: string;
  userId: string;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  category: string;
  mood: string;
  weather: string;
  note?: string | null;
  futureLetter?: string | null;
  futureLetterDate?: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventCardProps {
  record: Record;
  onEdit: (record: Record) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onShare: (record: Record) => void;
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
}

function getDaysDiff(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
}

function isMilestone(days: number): number | null {
  if (days > 0 && milestoneDays.includes(days)) return days;
  if (days < 0 && milestoneDays.includes(Math.abs(days))) return Math.abs(days);
  return null;
}

export default function EventCard({
  record,
  onEdit,
  onDelete,
  onTogglePin,
  onShare,
  cardBg,
  borderColor,
  textColor,
  textSecondary,
}: EventCardProps) {
  const [letterExpanded, setLetterExpanded] = useState(false);
  const days = getDaysDiff(record.eventDate);
  const isFuture = days < 0;
  const absDays = Math.abs(days);
  const milestone = isMilestone(days);
  const cat = categories.find((c) => c.name === record.category);

  const letterDate = record.futureLetterDate ? new Date(record.futureLetterDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const letterReady = letterDate ? today >= letterDate : false;

  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-300 hover:shadow-lg group"
      style={{
        background: cardBg,
        border: isFuture ? `2px dashed ${borderColor}` : `1px solid ${borderColor}`,
        boxShadow: isFuture ? undefined : `0 0 20px ${borderColor}15`,
      }}
    >
      {record.isPinned && (
        <span className="absolute -top-2 -left-2 text-lg">📌</span>
      )}

      {milestone && (
        <div
          className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            color: '#fff',
          }}
        >
          {milestone}天里程碑
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0">{record.mood}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-1 truncate" style={{ color: textColor, fontFamily: 'Noto Sans SC, sans-serif' }}>
            {record.title}
          </h3>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs" style={{ color: textSecondary, fontFamily: 'DM Mono, monospace' }}>
              {record.eventDate}
            </span>
            <span className="text-sm">{record.weather}</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: (cat?.color || '#6b7280') + '30', color: cat?.color || '#6b7280' }}
            >
              {record.category}
            </span>
          </div>

          <p className="text-xs mb-2" style={{ color: textSecondary }}>
            {isFuture ? `还有 ${absDays} 天` : `已过 ${absDays} 天`}
          </p>

          {record.note && (
            <p className="text-sm mb-2" style={{ color: textColor, opacity: 0.8 }}>
              {record.note}
            </p>
          )}

          {record.futureLetter && (
            <div className="mt-2">
              {!letterReady ? (
                <p className="text-xs" style={{ color: textSecondary }}>
                  🔒 写给未来的信 — 还未到打开时间
                </p>
              ) : (
                <div>
                  <button
                    onClick={() => setLetterExpanded(!letterExpanded)}
                    className="text-xs underline cursor-pointer"
                    style={{ color: textSecondary }}
                  >
                    📖 {letterExpanded ? '收起信件' : '展开信件'}
                  </button>
                  {letterExpanded && (
                    <div
                      className="mt-2 p-3 rounded-lg text-sm"
                      style={{ background: borderColor + '30', color: textColor }}
                    >
                      {record.futureLetter}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(record)}
          className="px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
          style={{ color: textSecondary }}
        >
          编辑
        </button>
        <button
          onClick={() => onTogglePin(record.id, !record.isPinned)}
          className="px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
          style={{ color: textSecondary }}
        >
          {record.isPinned ? '取消置顶' : '置顶'}
        </button>
        <button
          onClick={() => onShare(record)}
          className="px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
          style={{ color: textSecondary }}
        >
          分享
        </button>
        <button
          onClick={() => onDelete(record.id)}
          className="px-2 py-1 rounded text-xs hover:bg-red-500/20 text-red-400 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
