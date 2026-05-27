'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import ShareCard from '@/components/ShareCard';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import MilestoneBar from '@/components/MilestoneBar';
import StatsModal from '@/components/StatsModal';
import Calendar from '@/components/Calendar';
import RandomRecall from '@/components/RandomRecall';
import { themes, defaultTheme, Theme } from '@/lib/themes';
import { milestoneDays, categories, tagColors } from '@/lib/moods';
import { getTodayQuote } from '@/lib/quotes';
import { isSolarBirthdayToday, isLunarBirthdayToday, getDaysUntilBirthday } from '@/lib/lunar';
import { getUpcomingFestivals } from '@/lib/festivals';

interface RecordType {
  id: string; userId: string; title: string; eventDate: string;
  eventTime?: string | null; category: string; mood: string; weather: string;
  note?: string | null; tags?: string | null; futureLetter?: string | null;
  futureLetterDate?: string | null; isPinned: boolean;
  notifyDaily?: boolean; notifyMilestone?: boolean;
  createdAt: string; updatedAt: string;
}

interface UserData {
  id: string; username: string; isAdmin: boolean;
  birthday?: string | null; birthdayType?: string | null; festivalNotify?: boolean;
}

interface BirthdayCard {
  id: string; name: string; birthday: string; birthdayType: string;
  remind30: boolean; remind15: boolean; remind7: boolean; remind0: boolean;
}

function getDaysDiff(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [category, setCategory] = useState('全部');
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);
  const [shareRecord, setShareRecord] = useState<RecordType | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecall, setShowRecall] = useState(false);
  const [quote] = useState(getTodayQuote);
  const [isBirthday, setIsBirthday] = useState(false);
  const [showBirthdayCard, setShowBirthdayCard] = useState(false);
  const [dailyReminders, setDailyReminders] = useState<{ title: string; days: number; isFuture: boolean }[]>([]);
  const [birthdayReminders, setBirthdayReminders] = useState<{ name: string; days: number }[]>([]);
  const [festivalReminders, setFestivalReminders] = useState<{ name: string; emoji: string; greeting: string; isToday: boolean }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [festivalNotify, setFestivalNotify] = useState(true);
  const notifRequested = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/'); return; }
    const userData = JSON.parse(stored);
    setUser(userData);
    setFestivalNotify(userData.festivalNotify ?? true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) { const t = themes.find((th) => th.id === savedTheme); if (t) setCurrentTheme(t); }
  }, [router]);

  // Notification permission
  useEffect(() => {
    if (notifRequested.current) return;
    notifRequested.current = true;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/records?userId=${user.id}`);
    const data = await res.json();
    if (data.records) setRecords(data.records);
  }, [user]);

  useEffect(() => { if (user) fetchRecords(); }, [user, fetchRecords]);

  // Birthday & notifications check
  useEffect(() => {
    if (!user) return;

    // Check user birthday
    if (user.birthday) {
      const bd = new Date(user.birthday);
      const type = user.birthdayType || 'solar';
      let isToday = false;
      if (type === 'solar') {
        isToday = isSolarBirthdayToday(bd.getMonth() + 1, bd.getDate());
      } else {
        isToday = isLunarBirthdayToday(bd.getMonth() + 1, bd.getDate());
      }
      if (isToday) {
        setIsBirthday(true);
        setShowBirthdayCard(true);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('生日快乐！', { body: '记录网祝你生日快乐！🎈' });
        }
      }
    }

    // Daily reminders
    const reminders: { title: string; days: number; isFuture: boolean }[] = [];
    records.forEach((r) => {
      if (r.notifyDaily) {
        const days = getDaysDiff(r.eventDate);
        if (days < 0) reminders.push({ title: r.title, days: Math.abs(days), isFuture: true });
      }
    });
    setDailyReminders(reminders);

    // Milestone notifications
    const today = new Date().toISOString().slice(0, 10);
    const notifiedKey = `milestone-notified-${today}`;
    const notified: string[] = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
    records.forEach((r) => {
      if (r.notifyMilestone) {
        const days = getDaysDiff(r.eventDate);
        if (days > 0 && milestoneDays.includes(days) && !notified.includes(r.id)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('里程碑！', { body: `今天是你「${r.title}」的第${days}天！` });
          }
          notified.push(r.id);
        }
      }
    });
    localStorage.setItem(notifiedKey, JSON.stringify(notified));

    // Festival reminders
    if (festivalNotify) {
      const festivals = getUpcomingFestivals();
      const festKey = `festival-notified-${today}`;
      const festNotified: string[] = JSON.parse(localStorage.getItem(festKey) || '[]');
      const festReminders: typeof festivalReminders = [];
      festivals.forEach((f) => {
        const isToday = f.month === new Date().getMonth() + 1 && f.day === new Date().getDate();
        festReminders.push({ name: f.name, emoji: f.emoji, greeting: f.greeting, isToday });
        if (!festNotified.includes(f.name)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${f.emoji} ${f.name}`, { body: f.greeting });
          }
          festNotified.push(f.name);
        }
      });
      setFestivalReminders(festReminders);
      localStorage.setItem(festKey, JSON.stringify(festNotified));
    }
  }, [records, user, festivalNotify]);

  // Birthday cards check
  useEffect(() => {
    if (!user) return;
    const checkCards = async () => {
      const res = await fetch(`/api/birthday-cards?userId=${user.id}`);
      const data = await res.json();
      if (!data.cards) return;
      const reminders: { name: string; days: number }[] = [];
      data.cards.forEach((card: BirthdayCard) => {
        const days = getDaysUntilBirthday(card.birthday, card.birthdayType);
        if ((days <= 30 && card.remind30) || (days <= 15 && card.remind15) ||
            (days <= 7 && card.remind7) || (days === 0 && card.remind0)) {
          reminders.push({ name: card.name, days });
          if (days === 0 && 'Notification' in window && Notification.permission === 'granted') {
            const key = `bcard-notified-${card.id}-${new Date().toISOString().slice(0, 10)}`;
            if (!localStorage.getItem(key)) {
              new Notification('🎂 生日提醒', { body: `今天是${card.name}的生日！` });
              localStorage.setItem(key, '1');
            }
          }
        }
      });
      setBirthdayReminders(reminders);
    };
    checkCards();
  }, [user]);

  const handleThemeChange = (themeId: string) => {
    const t = themes.find((th) => th.id === themeId);
    if (t) { setCurrentTheme(t); localStorage.setItem('theme', t.id); }
  };

  const handleSave = async (data: Omit<RecordType, 'id' | 'userId' | 'isPinned' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    if (editingRecord) {
      await fetch(`/api/records/${editingRecord.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, userId: user.id }) });
    }
    setShowModal(false); setEditingRecord(null); fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return;
    await fetch(`/api/records/${id}`, { method: 'DELETE' }); fetchRecords();
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await fetch(`/api/records/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPinned }) }); fetchRecords();
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/'); };

  const handleExport = () => {
    const data = JSON.stringify(records, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `record-net-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const allTags = Array.from(new Set(records.flatMap((r) => (r.tags || '').split(',').map((t) => t.trim())).filter(Boolean)));

  const filteredRecords = records.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || (r.note || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === '全部' || r.category === category;
    const matchTag = !tagFilter || (r.tags || '').includes(tagFilter);
    return matchSearch && matchCategory && matchTag;
  });

  const todayMilestones = records
    .map((r) => { const days = getDaysDiff(r.eventDate); if (days > 0 && milestoneDays.includes(days)) return { title: r.title, days }; return null; })
    .filter(Boolean) as { title: string; days: number }[];

  if (!user) return null;

  return (
    <div className="dashboard" style={{ background: currentTheme.background, color: currentTheme.text }}>
      {/* Header */}
      <div className="dashboard-header" style={{ background: currentTheme.background + 'ee' }}>
        <div className="dashboard-header-inner">
          <div className="dashboard-welcome">
            <span>欢迎，{user.username}</span>
            {user.isAdmin && (
              <button onClick={() => router.push('/admin')} className="admin-badge-btn">👑 管理员</button>
            )}
          </div>
          <div className="dashboard-controls">
            <ThemeSwitcher themes={themes} currentTheme={currentTheme.id} onThemeChange={handleThemeChange} />
            <SearchBar value={search} onChange={setSearch} color={currentTheme.accent} />
            <button onClick={() => setShowCalendar(true)} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>📅</button>
            <button onClick={() => setShowRecall(true)} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>🎲</button>
            <button onClick={() => router.push('/birthday-cards')} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>🎂</button>
            <button onClick={() => router.push('/watch')} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>🎬</button>
            <button onClick={() => setShowStats(true)} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>统计</button>
            <button onClick={() => setShowSettings(!showSettings)} className="header-btn" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>⚙️</button>
            <button onClick={handleLogout} className="header-btn logout">退出</button>
          </div>
        </div>
        {/* Settings dropdown */}
        {showSettings && (
          <div className="settings-dropdown" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>
            <button onClick={() => { handleExport(); setShowSettings(false); }} className="settings-item" style={{ color: currentTheme.text }}>📥 导出数据</button>
            <label className="settings-item" style={{ color: currentTheme.text }}>
              <input type="checkbox" checked={festivalNotify} onChange={(e) => {
                setFestivalNotify(e.target.checked);
                if (user) {
                  fetch(`/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, password: '' }) });
                }
              }} />
              节日提醒
            </label>
            <button onClick={() => router.push('/stats')} className="settings-item" style={{ color: currentTheme.text }}>📊 详细统计</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* Birthday Card */}
        {showBirthdayCard && isBirthday && (
          <div className="birthday-card">
            <button onClick={() => setShowBirthdayCard(false)} className="birthday-close">✕</button>
            <div className="birthday-emoji">🎂</div>
            <p className="birthday-text">生日快乐，{user.username}！</p>
            <p className="birthday-sub">愿你的每一天都充满阳光和快乐 🎈</p>
          </div>
        )}

        {/* Festival Reminders */}
        {festivalReminders.map((f, i) => (
          <div key={i} className="festival-card">
            <span className="festival-emoji">{f.emoji}</span>
            <div>
              <p className="festival-name">{f.name}{f.isToday ? '（今天！）' : '（即将到来）'}</p>
              <p className="festival-greeting">{f.greeting}</p>
            </div>
          </div>
        ))}

        {/* Birthday Card Reminders */}
        {birthdayReminders.map((r, i) => (
          <div key={i} className="daily-reminder-card" style={{ background: 'rgba(253,121,168,0.1)', borderColor: 'rgba(253,121,168,0.2)' }}>
            <span>🎂</span>
            <p>{r.name}的生日{r.days === 0 ? '就是今天！' : `还有 ${r.days} 天！`}</p>
          </div>
        ))}

        {/* Daily Reminders */}
        {dailyReminders.map((r, i) => (
          <div key={i} className="daily-reminder-card">
            <span>⏰</span>
            <p>距离「{r.title}」还有 <strong>{r.days}</strong> 天！加油！</p>
          </div>
        ))}

        <MilestoneBar milestones={todayMilestones} />

        {/* Quote */}
        <div className="quote-card" style={{ background: currentTheme.card, borderColor: currentTheme.border }}>
          <span className="quote-mark">&ldquo;</span>
          <p className="quote-text" style={{ color: currentTheme.text }}>{quote}</p>
          <span className="quote-mark-end">&rdquo;</span>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <CategoryFilter selected={category} onSelect={setCategory} cardBg={currentTheme.card} />
          {allTags.length > 0 && (
            <div className="tag-filter">
              <button onClick={() => setTagFilter('')} className={`tag-filter-btn ${!tagFilter ? 'active' : ''}`}
                style={{ background: !tagFilter ? '#667eea' : 'rgba(255,255,255,0.05)', color: !tagFilter ? '#fff' : '#94a3b8' }}>
                全部标签
              </button>
              {allTags.map((tag, i) => (
                <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                  className={`tag-filter-btn ${tagFilter === tag ? 'active' : ''}`}
                  style={{ background: tagFilter === tag ? tagColors[i % tagColors.length] : tagColors[i % tagColors.length] + '20',
                    color: tagFilter === tag ? '#fff' : tagColors[i % tagColors.length] }}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">📝</p>
            <p className="empty-text">还没有记录，点击 + 添加你的第一条记录</p>
          </div>
        ) : (
          <div className="timeline">
            <div className="timeline-line" style={{ background: `linear-gradient(to bottom, ${currentTheme.accent}60, ${currentTheme.accent}08)` }} />
            <div className="timeline-items">
              {filteredRecords.map((record, index) => (
                <div key={record.id} className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                  <EventCard record={record}
                    onEdit={(r) => { setEditingRecord(r); setShowModal(true); }}
                    onDelete={handleDelete} onTogglePin={handleTogglePin}
                    onShare={(r) => setShareRecord(r)}
                    cardBg={currentTheme.card} borderColor={currentTheme.border}
                    textColor={currentTheme.text} textSecondary={currentTheme.textSecondary} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => { setEditingRecord(null); setShowModal(true); }} className="fab">+</button>

      {showModal && (
        <EventModal record={editingRecord} onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRecord(null); }}
          cardBg={currentTheme.card} borderColor={currentTheme.border}
          textColor={currentTheme.text} textSecondary={currentTheme.textSecondary} accent={currentTheme.accent} />
      )}
      {shareRecord && <ShareCard record={shareRecord} onClose={() => setShareRecord(null)} />}
      {showStats && <StatsModal records={records} onClose={() => setShowStats(false)}
        cardBg={currentTheme.card} borderColor={currentTheme.border}
        textColor={currentTheme.text} textSecondary={currentTheme.textSecondary} />}
      {showCalendar && <Calendar records={records} onClose={() => setShowCalendar(false)}
        cardBg={currentTheme.card} borderColor={currentTheme.border}
        textColor={currentTheme.text} textSecondary={currentTheme.textSecondary} />}
      {showRecall && <RandomRecall records={records} onClose={() => setShowRecall(false)}
        cardBg={currentTheme.card} borderColor={currentTheme.border}
        textColor={currentTheme.text} textSecondary={currentTheme.textSecondary} />}
    </div>
  );
}
