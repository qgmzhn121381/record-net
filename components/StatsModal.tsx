'use client';

import { categories, moods } from '@/lib/moods';

interface RecordStat {
  id: string;
  category: string;
  mood: string;
  eventDate: string;
  createdAt: string;
}

interface StatsModalProps {
  records: RecordStat[];
  onClose: () => void;
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
}

export default function StatsModal({ records, onClose, cardBg, borderColor, textColor, textSecondary }: StatsModalProps) {
  const categoryCounts = categories.map((c) => ({
    ...c,
    count: records.filter((r) => r.category === c.name).length,
  }));

  const moodCounts = moods.map((m) => ({
    ...m,
    count: records.filter((r) => r.mood === m.emoji).length,
  }));

  const maxCat = Math.max(...categoryCounts.map((c) => c.count), 1);
  const totalMood = records.length || 1;

  const sortedByDate = [...records].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const earliest = sortedByDate[0];
  const latest = sortedByDate[sortedByDate.length - 1];

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = records.filter((r) => r.createdAt.startsWith(thisMonth)).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stats-container" onClick={(e) => e.stopPropagation()} style={{ background: cardBg, borderColor }}>
        <h2 className="stats-title" style={{ color: textColor }}>数据统计</h2>

        <div className="stats-cards">
          <div className="stats-card" style={{ background: borderColor + '30' }}>
            <p className="stats-number" style={{ color: '#f59e0b' }}>{records.length}</p>
            <p className="stats-label" style={{ color: textSecondary }}>总记录数</p>
          </div>
          <div className="stats-card" style={{ background: borderColor + '30' }}>
            <p className="stats-number" style={{ color: '#22c55e' }}>{thisMonthCount}</p>
            <p className="stats-label" style={{ color: textSecondary }}>本月新增</p>
          </div>
        </div>

        <div className="stats-section">
          <h3 style={{ color: textColor }}>分类统计</h3>
          <div className="stats-bars">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="stats-bar-row">
                <span className="stats-bar-label" style={{ color: textSecondary }}>{cat.name}</span>
                <div className="stats-bar-track" style={{ background: borderColor + '30' }}>
                  <div
                    className="stats-bar-fill"
                    style={{
                      width: `${(cat.count / maxCat) * 100}%`,
                      background: cat.color,
                    }}
                  >
                    {cat.count > 0 && <span>{cat.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h3 style={{ color: textColor }}>心情分布</h3>
          <div className="stats-moods">
            {moodCounts.filter(m => m.count > 0).map((m) => {
              const pct = (m.count / totalMood) * 100;
              const size = 70;
              const stroke = 4;
              const radius = (size - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <div key={m.emoji} className="stats-mood-item">
                  <svg width={size} height={size} className="stats-mood-svg">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={borderColor + '30'} strokeWidth={stroke} />
                    <circle
                      cx={size / 2} cy={size / 2} r={radius} fill="none"
                      stroke="#667eea" strokeWidth={stroke}
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="stats-mood-emoji">{m.emoji}</span>
                  <span className="stats-mood-count" style={{ color: textSecondary }}>{m.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {earliest && latest && (
          <div className="stats-cards">
            <div className="stats-card" style={{ background: borderColor + '30' }}>
              <p className="stats-label" style={{ color: textSecondary }}>最早记录</p>
              <p className="stats-date" style={{ color: textColor }}>{earliest.eventDate}</p>
            </div>
            <div className="stats-card" style={{ background: borderColor + '30' }}>
              <p className="stats-label" style={{ color: textSecondary }}>最新记录</p>
              <p className="stats-date" style={{ color: textColor }}>{latest.eventDate}</p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="stats-close" style={{ color: textSecondary, background: borderColor + '40' }}>
          关闭
        </button>
      </div>
    </div>
  );
}
