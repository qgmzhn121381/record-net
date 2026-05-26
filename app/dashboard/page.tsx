'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import ShareCard from '@/components/ShareCard';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import MilestoneBar from '@/components/MilestoneBar';
import StatsModal from '@/components/StatsModal';
import { themes, defaultTheme, Theme } from '@/lib/themes';
import { milestoneDays } from '@/lib/moods';

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
  futureLetter?: string | null;
  futureLetterDate?: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
}

function getDaysDiff(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);
  const [shareRecord, setShareRecord] = useState<RecordType | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(stored);
    setUser(userData);

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

  const handleThemeChange = (themeId: string) => {
    const t = themes.find((th) => th.id === themeId);
    if (t) {
      setCurrentTheme(t);
      localStorage.setItem('theme', t.id);
    }
  };

  const handleSave = async (data: Omit<RecordType, 'id' | 'userId' | 'isPinned' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    if (editingRecord) {
      await fetch(`/api/records/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: user.id }),
      });
    }

    setShowModal(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return;
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned }),
    });
    fetchRecords();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.note || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === '全部' || r.category === category;
    return matchSearch && matchCategory;
  });

  const todayMilestones = records
    .map((r) => {
      const days = getDaysDiff(r.eventDate);
      if (days > 0 && milestoneDays.includes(days)) {
        return { title: r.title, days };
      }
      return null;
    })
    .filter(Boolean) as { title: string; days: number }[];

  if (!user) return null;

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: currentTheme.background, color: currentTheme.text }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 md:px-6 py-3" style={{ background: currentTheme.background + 'ee', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: currentTheme.text, fontFamily: 'Noto Sans SC, sans-serif' }}>
              欢迎，{user.username}
            </span>
            {user.isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="px-2 py-0.5 rounded text-xs hover:bg-yellow-500/20 transition-colors cursor-pointer"
                style={{ background: '#f59e0b20', color: '#f59e0b' }}
              >
                👑 管理员
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <ThemeSwitcher
              themes={themes}
              currentTheme={currentTheme.id}
              onThemeChange={handleThemeChange}
            />
            <SearchBar value={search} onChange={setSearch} color={currentTheme.accent} />
            <button
              onClick={() => setShowStats(true)}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background: currentTheme.card, color: currentTheme.text, border: `1px solid ${currentTheme.border}` }}
            >
              统计
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              style={{ border: `1px solid ${currentTheme.border}` }}
            >
              退出
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Milestones */}
        <MilestoneBar milestones={todayMilestones} />

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter selected={category} onSelect={setCategory} cardBg={currentTheme.card} />
        </div>

        {/* Timeline */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📝</p>
            <p style={{ color: currentTheme.textSecondary, fontFamily: 'Noto Sans SC, sans-serif' }}>
              还没有记录，点击 + 添加你的第一条记录
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline center line */}
            <div
              className="absolute left-1/2 transform -translate-x-px h-full w-0.5 hidden md:block"
              style={{ background: `linear-gradient(to bottom, ${currentTheme.accent}40, ${currentTheme.accent}10)` }}
            />

            <div className="space-y-6">
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`md:w-[calc(50%-1.5rem)] ${index % 2 === 0 ? 'md:ml-0 md:mr-auto' : 'md:ml-auto md:mr-0'}`}
                >
                  <EventCard
                    record={record}
                    onEdit={(r) => {
                      setEditingRecord(r);
                      setShowModal(true);
                    }}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                    onShare={(r) => setShareRecord(r)}
                    cardBg={currentTheme.card}
                    borderColor={currentTheme.border}
                    textColor={currentTheme.text}
                    textSecondary={currentTheme.textSecondary}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setEditingRecord(null);
          setShowModal(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition-transform hover:scale-110 z-30"
        style={{
          background: 'linear-gradient(135deg, #f97316, #ec4899)',
          animation: 'breathe 3s ease-in-out infinite',
        }}
      >
        +
      </button>

      {/* Modals */}
      {showModal && (
        <EventModal
          record={editingRecord}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingRecord(null);
          }}
          cardBg={currentTheme.card}
          borderColor={currentTheme.border}
          textColor={currentTheme.text}
          textSecondary={currentTheme.textSecondary}
          accent={currentTheme.accent}
        />
      )}

      {shareRecord && (
        <ShareCard record={shareRecord} onClose={() => setShareRecord(null)} />
      )}

      {showStats && (
        <StatsModal
          records={records}
          onClose={() => setShowStats(false)}
          cardBg={currentTheme.card}
          borderColor={currentTheme.border}
          textColor={currentTheme.text}
          textSecondary={currentTheme.textSecondary}
        />
      )}

      <style jsx global>{`
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 35px rgba(236, 72, 153, 0.6); }
        }
      `}</style>
    </div>
  );
}
