'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { categories, moods } from '@/lib/moods';
import { themes, defaultTheme, Theme } from '@/lib/themes';

interface RecordType {
  id: string;
  category: string;
  mood: string;
  eventDate: string;
  createdAt: string;
}

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
}

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(stored));

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const t = themes.find((th) => th.id === savedTheme);
      if (t) setCurrentTheme(t);
    }
  }, [router]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/records?userId=${user.id}`);
    const data = await res.json();
    if (data.records) setRecords(data.records);
  }, [user]);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user, fetchRecords]);

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

  if (!user) return null;

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-500"
      style={{ background: currentTheme.background, color: currentTheme.text }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            数据统计
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ color: currentTheme.textSecondary, background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}
          >
            返回
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl p-6 text-center" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <p className="text-4xl font-bold" style={{ color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
              {records.length}
            </p>
            <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>总记录数</p>
          </div>
          <div className="rounded-xl p-6 text-center" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <p className="text-4xl font-bold" style={{ color: '#22c55e', fontFamily: 'DM Mono, monospace' }}>
              {thisMonthCount}
            </p>
            <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>本月新增</p>
          </div>
        </div>

        <div className="rounded-xl p-6 mb-8" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>分类统计</h2>
          <div className="space-y-3">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm w-12 text-right" style={{ color: currentTheme.textSecondary }}>{cat.name}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: currentTheme.border + '30' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: cat.count > 0 ? `${Math.max((cat.count / maxCat) * 100, 10)}%` : '0%',
                      background: cat.color,
                    }}
                  >
                    {cat.count > 0 && (
                      <span className="text-xs text-white font-bold" style={{ fontFamily: 'DM Mono, monospace' }}>{cat.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6 mb-8" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>心情分布</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {moodCounts.filter((m) => m.count > 0).map((m) => {
              const pct = (m.count / totalMood) * 100;
              const size = 80;
              const stroke = 5;
              const radius = (size - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <div key={m.emoji} className="flex flex-col items-center">
                  <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={currentTheme.border + '30'} strokeWidth={stroke} />
                      <circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke={currentTheme.accent} strokeWidth={stroke}
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">{m.emoji}</div>
                  </div>
                  <span className="text-xs mt-2" style={{ color: currentTheme.textSecondary, fontFamily: 'DM Mono, monospace' }}>
                    {m.count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
            {moodCounts.filter((m) => m.count > 0).length === 0 && (
              <p style={{ color: currentTheme.textSecondary }}>暂无数据</p>
            )}
          </div>
        </div>

        {earliest && latest && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 text-center" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>最早记录</p>
              <p className="text-lg font-bold mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>
                {earliest.eventDate}
              </p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>最新记录</p>
              <p className="text-lg font-bold mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>
                {latest.eventDate}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
