'use client';

import { categories, moods } from '@/lib/moods';

interface Record {
  id: string;
  category: string;
  mood: string;
  eventDate: string;
  createdAt: string;
}

interface StatsModalProps {
  records: Record[];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
        style={{ background: cardBg, border: `1px solid ${borderColor}` }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: textColor, fontFamily: 'Noto Sans SC, sans-serif' }}>
          数据统计
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl p-4 text-center" style={{ background: borderColor + '30' }}>
            <p className="text-3xl font-bold" style={{ color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
              {records.length}
            </p>
            <p className="text-xs mt-1" style={{ color: textSecondary }}>总记录数</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: borderColor + '30' }}>
            <p className="text-3xl font-bold" style={{ color: '#22c55e', fontFamily: 'DM Mono, monospace' }}>
              {thisMonthCount}
            </p>
            <p className="text-xs mt-1" style={{ color: textSecondary }}>本月新增</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: textColor }}>分类统计</h3>
          <div className="space-y-2">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-xs w-12 text-right" style={{ color: textSecondary }}>{cat.name}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: borderColor + '30' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(cat.count / maxCat) * 100}%`,
                      background: cat.color,
                    }}
                  />
                </div>
                <span className="text-xs w-6 text-right" style={{ color: textSecondary, fontFamily: 'DM Mono, monospace' }}>
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: textColor }}>心情分布</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {moodCounts.filter(m => m.count > 0).map((m) => {
              const pct = (m.count / totalMood) * 100;
              const size = 60;
              const stroke = 4;
              const radius = (size - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <div key={m.emoji} className="flex flex-col items-center">
                  <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={borderColor + '30'}
                      strokeWidth={stroke}
                    />
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={stroke}
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xl -mt-9 mb-3">{m.emoji}</span>
                  <span className="text-xs mt-1" style={{ color: textSecondary, fontFamily: 'DM Mono, monospace' }}>
                    {m.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {earliest && latest && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-3 text-center" style={{ background: borderColor + '30' }}>
              <p className="text-xs" style={{ color: textSecondary }}>最早记录</p>
              <p className="text-sm font-bold mt-1" style={{ color: textColor, fontFamily: 'DM Mono, monospace' }}>
                {earliest.eventDate}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: borderColor + '30' }}>
              <p className="text-xs" style={{ color: textSecondary }}>最新记录</p>
              <p className="text-sm font-bold mt-1" style={{ color: textColor, fontFamily: 'DM Mono, monospace' }}>
                {latest.eventDate}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-2 rounded-lg text-sm transition-colors"
          style={{ color: textSecondary, background: borderColor + '40' }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}
