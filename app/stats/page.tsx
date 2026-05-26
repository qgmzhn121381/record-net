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
    <div className="stats-page" style={{ background: currentTheme.background, color: currentTheme.text }}>
      <div className="stats-page-inner">
        <div className="stats-page-header">
          <h1 style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>数据统计</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="stats-page-back"
            style={{ color: currentTheme.textSecondary, background: currentTheme.card, borderColor: currentTheme.border }}
          >
            返回
          </button>
        </div>

        <div className="stats-cards" style={{ marginBottom: '2rem' }}>
          <div className="stats-card" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <p className="stats-number" style={{ color: '#f59e0b' }}>{records.length}</p>
            <p className="stats-label" style={{ color: currentTheme.textSecondary }}>总记录数</p>
          </div>
          <div className="stats-card" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <p className="stats-number" style={{ color: '#22c55e' }}>{thisMonthCount}</p>
            <p className="stats-label" style={{ color: currentTheme.textSecondary }}>本月新增</p>
          </div>
        </div>

        <div className="stats-page-section" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>
          <h2 style={{ color: currentTheme.text, fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>分类统计</h2>
          <div className="stats-bars">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="stats-bar-row">
                <span className="stats-bar-label" style={{ color: currentTheme.textSecondary }}>{cat.name}</span>
                <div className="stats-bar-track" style={{ background: currentTheme.border + '30' }}>
                  <div
                    className="stats-bar-fill"
                    style={{
                      width: cat.count > 0 ? `${Math.max((cat.count / maxCat) * 100, 8)}%` : '0%',
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

        <div className="stats-page-section" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>
          <h2 style={{ color: currentTheme.text, fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>心情分布</h2>
          <div className="stats-moods">
            {moodCounts.filter((m) => m.count > 0).map((m) => {
              const pct = (m.count / totalMood) * 100;
              const size = 80;
              const stroke = 5;
              const radius = (size - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <div key={m.emoji} className="stats-mood-item">
                  <svg width={size} height={size} className="stats-mood-svg">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={currentTheme.border + '30'} strokeWidth={stroke} />
                    <circle
                      cx={size / 2} cy={size / 2} r={radius} fill="none"
                      stroke={currentTheme.accent} strokeWidth={stroke}
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="stats-mood-emoji">{m.emoji}</span>
                  <span className="stats-mood-count" style={{ color: currentTheme.textSecondary }}>
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
          <div className="stats-cards">
            <div className="stats-card" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <p className="stats-label" style={{ color: currentTheme.textSecondary }}>最早记录</p>
              <p className="stats-date" style={{ color: currentTheme.text }}>{earliest.eventDate}</p>
            </div>
            <div className="stats-card" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <p className="stats-label" style={{ color: currentTheme.textSecondary }}>最新记录</p>
              <p className="stats-date" style={{ color: currentTheme.text }}>{latest.eventDate}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
