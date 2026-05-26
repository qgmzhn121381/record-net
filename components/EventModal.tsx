'use client';

import { useState, useEffect } from 'react';
import { moods, weathers, categories } from '@/lib/moods';

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

interface EventModalProps {
  record: Record | null;
  onSave: (data: Omit<Record, 'id' | 'userId' | 'isPinned' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  accent: string;
}

export default function EventModal({
  record,
  onSave,
  onClose,
  cardBg,
  borderColor,
  textColor,
  textSecondary,
  accent,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('其他');
  const [mood, setMood] = useState('😊');
  const [weather, setWeather] = useState('☀️');
  const [note, setNote] = useState('');
  const [futureLetter, setFutureLetter] = useState('');
  const [futureLetterDate, setFutureLetterDate] = useState('');

  useEffect(() => {
    if (record) {
      setTitle(record.title);
      setEventDate(record.eventDate);
      setCategory(record.category);
      setMood(record.mood);
      setWeather(record.weather);
      setNote(record.note || '');
      setFutureLetter(record.futureLetter || '');
      setFutureLetterDate(record.futureLetterDate || '');
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    onSave({
      title: title.trim(),
      eventDate,
      category,
      mood,
      weather,
      note: note || null,
      futureLetter: futureLetter || null,
      futureLetterDate: futureLetterDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
        style={{ background: cardBg, border: `1px solid ${borderColor}` }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: textColor, fontFamily: 'Noto Sans SC, sans-serif' }}>
          {record ? '编辑事件' : '添加事件'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>事件名称 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>日期 *</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>心情</label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${mood === m.emoji ? 'scale-110' : ''}`}
                  style={{
                    background: mood === m.emoji ? accent + '30' : borderColor + '40',
                    boxShadow: mood === m.emoji ? `0 0 0 2px ${accent}` : 'none',
                  }}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>天气</label>
            <div className="flex flex-wrap gap-2">
              {weathers.map((w) => (
                <button
                  key={w.emoji}
                  type="button"
                  onClick={() => setWeather(w.emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${weather === w.emoji ? 'scale-110' : ''}`}
                  style={{
                    background: weather === w.emoji ? accent + '30' : borderColor + '40',
                    boxShadow: weather === w.emoji ? `0 0 0 2px ${accent}` : 'none',
                  }}
                  title={w.label}
                >
                  {w.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors resize-none"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: textSecondary }}>写给未来的信</label>
            <textarea
              value={futureLetter}
              onChange={(e) => setFutureLetter(e.target.value)}
              rows={2}
              placeholder="写点什么给未来的自己..."
              className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors resize-none"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          {futureLetter && (
            <div>
              <label className="block text-xs mb-1" style={{ color: textSecondary }}>信件开放日期</label>
              <input
                type="date"
                value={futureLetterDate}
                onChange={(e) => setFutureLetterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none transition-colors"
                style={{ background: borderColor + '40', borderColor, color: textColor }}
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: textSecondary, background: borderColor + '40' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, #f97316, #ec4899)` }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
