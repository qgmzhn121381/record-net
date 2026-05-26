'use client';

import { useState } from 'react';
import { categories, milestoneDays, tagColors } from '@/lib/moods';

interface RecordType {
  id: string;
  userId: string;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  category: string;
  mood: string;
  weather: string;
  note?: string | null;
  tags?: string | null;
  futureLetter?: string | null;
  futureLetterDate?: string | null;
  isPinned: boolean;
  notifyDaily?: boolean;
  notifyMilestone?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventCardProps {
  record: RecordType;
  onEdit: (record: RecordType) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onShare: (record: RecordType) => void;
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
  const cardColor = cat?.color || '#95a5a6';

  const tags = record.tags ? record.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const letterDate = record.futureLetterDate ? new Date(record.futureLetterDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const letterReady = letterDate ? today >= letterDate : false;

  const isMilestoneCard = milestone !== null;

  return (
    <div
      className={`event-card ${isFuture ? 'future' : ''} ${isMilestoneCard ? 'milestone' : ''}`}
      style={{
        background: isMilestoneCard
          ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))'
          : cardBg,
        borderColor: isMilestoneCard ? '#f59e0b' : cardColor,
      }}
    >
      {record.isPinned && <span className="event-pin">📌</span>}

      {milestone && (
        <div className="event-milestone-badge">
          {milestone}天里程碑 ✨
        </div>
      )}

      <div className="event-card-body">
        <div className="event-mood-circle" style={{ background: cardColor + '25' }}>
          {record.mood}
        </div>
        <div className="event-info">
          <h3 className="event-title" style={{ color: textColor }}>{record.title}</h3>

          <div className="event-meta">
            <span className="event-date" style={{ color: textSecondary }}>{record.eventDate}</span>
            <span className="event-weather">{record.weather}</span>
            <span
              className="event-category-tag"
              style={{ background: cardColor + '30', color: cardColor }}
            >
              {record.category}
            </span>
          </div>

          <div className="event-days" style={{ color: isFuture ? '#3b82f6' : '#f59e0b' }}>
            {isFuture ? `还有 ${absDays} 天` : `已过 ${absDays} 天`}
          </div>

          {tags.length > 0 && (
            <div className="event-tags">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="event-tag"
                  style={{ background: tagColors[i % tagColors.length] + '30', color: tagColors[i % tagColors.length] }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {record.note && (
            <p className="event-note" style={{ color: textColor }}>{record.note}</p>
          )}

          {record.futureLetter && (
            <div className="event-letter">
              {!letterReady ? (
                <p className="event-letter-locked" style={{ color: textSecondary }}>
                  🔒 写给未来的信 — 还未到打开时间
                </p>
              ) : (
                <div>
                  <button
                    onClick={() => setLetterExpanded(!letterExpanded)}
                    className="event-letter-toggle"
                    style={{ color: textSecondary }}
                  >
                    📖 {letterExpanded ? '收起信件' : '展开信件'}
                  </button>
                  {letterExpanded && (
                    <div className="event-letter-content" style={{ background: borderColor + '30', color: textColor }}>
                      {record.futureLetter}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="event-actions">
        <button onClick={() => onEdit(record)} style={{ color: textSecondary }}>编辑</button>
        <button onClick={() => onTogglePin(record.id, !record.isPinned)} style={{ color: textSecondary }}>
          {record.isPinned ? '取消置顶' : '置顶'}
        </button>
        <button onClick={() => onShare(record)} style={{ color: textSecondary }}>分享</button>
        <button onClick={() => onDelete(record.id)} className="delete">删除</button>
      </div>
    </div>
  );
}
