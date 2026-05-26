'use client';

import { useState, useEffect } from 'react';
import { moods, weathers, categories } from '@/lib/moods';

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

interface EventModalProps {
  record: RecordType | null;
  onSave: (data: Omit<RecordType, 'id' | 'userId' | 'isPinned' | 'createdAt' | 'updatedAt'>) => void;
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
  const [tags, setTags] = useState('');
  const [futureLetter, setFutureLetter] = useState('');
  const [futureLetterDate, setFutureLetterDate] = useState('');
  const [notifyDaily, setNotifyDaily] = useState(false);
  const [notifyMilestone, setNotifyMilestone] = useState(true);

  useEffect(() => {
    if (record) {
      setTitle(record.title);
      setEventDate(record.eventDate);
      setCategory(record.category);
      setMood(record.mood);
      setWeather(record.weather);
      setNote(record.note || '');
      setTags(record.tags || '');
      setFutureLetter(record.futureLetter || '');
      setFutureLetterDate(record.futureLetterDate || '');
      setNotifyDaily(record.notifyDaily ?? false);
      setNotifyMilestone(record.notifyMilestone ?? true);
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
      tags: tags || null,
      futureLetter: futureLetter || null,
      futureLetterDate: futureLetterDate || null,
      notifyDaily,
      notifyMilestone,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ background: cardBg, borderColor }}
      >
        <h2 className="modal-title" style={{ color: textColor }}>
          {record ? '编辑事件' : '添加事件'}
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label style={{ color: textSecondary }}>事件名称 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="modal-input"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div className="modal-field">
            <label style={{ color: textSecondary }}>日期 *</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="modal-input"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div className="modal-field">
            <label style={{ color: textSecondary }}>分类</label>
            <div className="modal-categories">
              {categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className={`modal-category-btn ${category === c.name ? 'selected' : ''}`}
                  style={{
                    background: category === c.name ? c.color : c.color + '20',
                    color: category === c.name ? '#fff' : c.color,
                    borderColor: c.color,
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label style={{ color: textSecondary }}>心情</label>
            <div className="modal-moods">
              {moods.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  className={`modal-mood-btn ${mood === m.emoji ? 'selected' : ''}`}
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

          <div className="modal-field">
            <label style={{ color: textSecondary }}>天气</label>
            <div className="modal-moods">
              {weathers.map((w) => (
                <button
                  key={w.emoji}
                  type="button"
                  onClick={() => setWeather(w.emoji)}
                  className={`modal-mood-btn ${weather === w.emoji ? 'selected' : ''}`}
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

          <div className="modal-field">
            <label style={{ color: textSecondary }}>自定义标签（用逗号分隔）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：浪漫,惊喜,旅行"
              className="modal-input"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div className="modal-field">
            <label style={{ color: textSecondary }}>备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="modal-input modal-textarea"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          <div className="modal-field">
            <label style={{ color: textSecondary }}>写给未来的信</label>
            <textarea
              value={futureLetter}
              onChange={(e) => setFutureLetter(e.target.value)}
              rows={2}
              placeholder="写点什么给未来的自己..."
              className="modal-input modal-textarea"
              style={{ background: borderColor + '40', borderColor, color: textColor }}
            />
          </div>

          {futureLetter && (
            <div className="modal-field">
              <label style={{ color: textSecondary }}>信件开放日期</label>
              <input
                type="date"
                value={futureLetterDate}
                onChange={(e) => setFutureLetterDate(e.target.value)}
                className="modal-input"
                style={{ background: borderColor + '40', borderColor, color: textColor }}
              />
            </div>
          )}

          <div className="modal-field">
            <label style={{ color: textSecondary }}>通知设置</label>
            <div className="modal-notifications">
              <label className="modal-checkbox" style={{ color: textColor }}>
                <input
                  type="checkbox"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                />
                <span>每日倒计时提醒</span>
              </label>
              <label className="modal-checkbox" style={{ color: textColor }}>
                <input
                  type="checkbox"
                  checked={notifyMilestone}
                  onChange={(e) => setNotifyMilestone(e.target.checked)}
                />
                <span>里程碑提醒（100天、365天、500天、1000天）</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-cancel" style={{ color: textSecondary, background: borderColor + '40' }}>
              取消
            </button>
            <button type="submit" className="modal-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
