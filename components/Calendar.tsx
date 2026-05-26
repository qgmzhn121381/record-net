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

interface CalendarProps {
  records: RecordType[];
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  onClose: () => void;
}

export default function Calendar({ records, cardBg, borderColor, textColor, textSecondary, onClose }: CalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDate(null);
  };

  const getRecordsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.filter((r) => r.eventDate === dateStr);
  };

  const selectedRecords = selectedDate ? records.filter((r) => r.eventDate === selectedDate) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calendar-container" onClick={(e) => e.stopPropagation()} style={{ background: cardBg, borderColor }}>
        <div className="calendar-header">
          <button onClick={onClose} className="calendar-close" style={{ color: textSecondary }}>✕</button>
          <h2 style={{ color: textColor }}>日历视图</h2>
          <div />
        </div>

        <div className="calendar-nav">
          <button onClick={prevMonth} style={{ color: textColor }}>&lt;</button>
          <span style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}>{year}年{month + 1}月</span>
          <button onClick={nextMonth} style={{ color: textColor }}>&gt;</button>
        </div>

        <div className="calendar-weekdays">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="calendar-weekday" style={{ color: textSecondary }}>{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRecords = getRecordsForDate(day);
            const isToday = dateStr === new Date().toISOString().slice(0, 10);
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  borderColor: isSelected ? '#667eea' : 'transparent',
                  background: isToday ? '#667eea20' : 'transparent',
                }}
              >
                <span style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}>{day}</span>
                <div className="calendar-dots">
                  {dayRecords.slice(0, 3).map((r) => {
                    const cat = categories.find((c) => c.name === r.category);
                    return (
                      <span key={r.id} className="calendar-dot" style={{ background: cat?.color || '#95a5a6' }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDate && selectedRecords.length > 0 && (
          <div className="calendar-events" style={{ borderColor }}>
            <h3 style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}>{selectedDate}</h3>
            {selectedRecords.map((r) => {
              const cat = categories.find((c) => c.name === r.category);
              return (
                <div key={r.id} className="calendar-event-item" style={{ borderColor: (cat?.color || '#95a5a6') + '40' }}>
                  <span className="calendar-event-mood">{r.mood}</span>
                  <div>
                    <p style={{ color: textColor, fontWeight: 600 }}>{r.title}</p>
                    <p style={{ color: textSecondary, fontSize: '0.75rem' }}>
                      {r.weather} {r.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedDate && selectedRecords.length === 0 && (
          <div className="calendar-events" style={{ borderColor }}>
            <p style={{ color: textSecondary, textAlign: 'center', padding: '1rem' }}>
              这一天没有记录
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
