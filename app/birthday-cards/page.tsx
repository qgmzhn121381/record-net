'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDaysUntilBirthday, getNextBirthday } from '@/lib/lunar';

interface BirthdayCard {
  id: string;
  userId: string;
  name: string;
  birthday: string;
  birthdayType: string;
  relationship: string;
  remind30: boolean;
  remind15: boolean;
  remind7: boolean;
  remind0: boolean;
  notes?: string | null;
  createdAt: string;
}

interface GiftRecord {
  id: string;
  cardId: string;
  year: number;
  direction: string;
  giftName: string;
  notes?: string | null;
}

interface Anniversary {
  id: string;
  cardId: string;
  title: string;
  anniversaryDate: string;
  repeatYearly: boolean;
  notes?: string | null;
}

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
}

export default function BirthdayCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [cards, setCards] = useState<BirthdayCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [gifts, setGifts] = useState<Record<string, GiftRecord[]>>({});
  const [anniversaries, setAnniversaries] = useState<Record<string, Anniversary[]>>({});

  // Add form state
  const [newName, setNewName] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newBirthdayType, setNewBirthdayType] = useState('solar');
  const [newRelationship, setNewRelationship] = useState('朋友');
  const [newRemind30, setNewRemind30] = useState(false);
  const [newRemind15, setNewRemind15] = useState(false);
  const [newRemind7, setNewRemind7] = useState(true);
  const [newRemind0, setNewRemind0] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  // Gift form
  const [giftYear, setGiftYear] = useState(new Date().getFullYear());
  const [giftDirection, setGiftDirection] = useState('我送TA');
  const [giftName, setGiftName] = useState('');
  const [giftNotes, setGiftNotes] = useState('');
  const [showGiftForm, setShowGiftForm] = useState<string | null>(null);

  // Anniversary form
  const [annTitle, setAnnTitle] = useState('');
  const [annDate, setAnnDate] = useState('');
  const [annRepeat, setAnnRepeat] = useState(true);
  const [annNotes, setAnnNotes] = useState('');
  const [showAnnForm, setShowAnnForm] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/'); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/birthday-cards?userId=${user.id}`);
    const data = await res.json();
    if (data.cards) setCards(data.cards);
  }, [user]);

  useEffect(() => { if (user) fetchCards(); }, [user, fetchCards]);

  const fetchGifts = async (cardId: string) => {
    const res = await fetch(`/api/gift-records?cardId=${cardId}`);
    const data = await res.json();
    if (data.gifts) setGifts((prev) => ({ ...prev, [cardId]: data.gifts }));
  };

  const fetchAnniversaries = async (cardId: string) => {
    const res = await fetch(`/api/anniversaries?cardId=${cardId}`);
    const data = await res.json();
    if (data.anniversaries) setAnniversaries((prev) => ({ ...prev, [cardId]: data.anniversaries }));
  };

  const toggleExpand = (cardId: string) => {
    if (expandedCard === cardId) { setExpandedCard(null); return; }
    setExpandedCard(cardId);
    if (!gifts[cardId]) fetchGifts(cardId);
    if (!anniversaries[cardId]) fetchAnniversaries(cardId);
  };

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName || !newBirthday) return;
    await fetch('/api/birthday-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id, name: newName, birthday: newBirthday,
        birthdayType: newBirthdayType, relationship: newRelationship,
        remind30: newRemind30, remind15: newRemind15, remind7: newRemind7, remind0: newRemind0,
        notes: newNotes || null,
      }),
    });
    setNewName(''); setNewBirthday(''); setNewNotes('');
    setShowAddForm(false);
    fetchCards();
  };

  const deleteCard = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/birthday-cards/${id}`, { method: 'DELETE' });
    fetchCards();
  };

  const addGift = async (cardId: string) => {
    if (!giftName) return;
    await fetch('/api/gift-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, year: giftYear, direction: giftDirection, giftName, notes: giftNotes || null }),
    });
    setGiftName(''); setGiftNotes(''); setShowGiftForm(null);
    fetchGifts(cardId);
  };

  const deleteGift = async (giftId: string, cardId: string) => {
    await fetch(`/api/gift-records/${giftId}`, { method: 'DELETE' });
    fetchGifts(cardId);
  };

  const addAnniversary = async (cardId: string) => {
    if (!annTitle || !annDate) return;
    await fetch('/api/anniversaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, title: annTitle, anniversaryDate: annDate, repeatYearly: annRepeat, notes: annNotes || null }),
    });
    setAnnTitle(''); setAnnDate(''); setAnnNotes(''); setShowAnnForm(null);
    fetchAnniversaries(cardId);
  };

  const deleteAnniversary = async (annId: string, cardId: string) => {
    await fetch(`/api/anniversaries/${annId}`, { method: 'DELETE' });
    fetchAnniversaries(cardId);
  };

  const getDaysUntilNext = (card: BirthdayCard) => getDaysUntilBirthday(card.birthday, card.birthdayType);
  const getNextBday = (card: BirthdayCard) => getNextBirthday(card.birthday, card.birthdayType);

  const sortedCards = [...cards].sort((a, b) => getDaysUntilNext(a) - getDaysUntilNext(b));
  const nearestCard = sortedCards[0];

  if (!user) return null;

  return (
    <div className="birthday-page">
      <div className="birthday-container">
        <div className="birthday-header">
          <button onClick={() => router.push('/dashboard')} className="admin-back">← 返回</button>
          <h1>重要的人</h1>
          <button onClick={() => setShowAddForm(!showAddForm)} className="admin-back" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none' }}>
            + 添加
          </button>
        </div>

        {/* Nearest countdown */}
        {nearestCard && (
          <div className="birthday-countdown">
            <div className="birthday-countdown-emoji">🎂</div>
            <div className="birthday-countdown-name">{nearestCard.name}</div>
            <div className="birthday-countdown-days">
              <span className="birthday-countdown-num">{getDaysUntilNext(nearestCard)}</span>
              <span className="birthday-countdown-label">天后生日</span>
            </div>
            <div className="birthday-countdown-date" style={{ fontFamily: 'Inter, sans-serif' }}>
              {getNextBday(nearestCard).toLocaleDateString('zh-CN')}
            </div>
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="birthday-add-form" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <form onSubmit={addCard} className="modal-form">
              <div className="modal-field">
                <label style={{ color: '#94a3b8' }}>姓名 *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required
                  className="modal-input" style={{ background: '#33415540', borderColor: '#334155', color: '#f8fafc' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="modal-field" style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8' }}>生日 *</label>
                  <input type="date" value={newBirthday} onChange={(e) => setNewBirthday(e.target.value)} required
                    className="modal-input" style={{ background: '#33415540', borderColor: '#334155', color: '#f8fafc' }} />
                </div>
                <div className="modal-field" style={{ width: '100px' }}>
                  <label style={{ color: '#94a3b8' }}>类型</label>
                  <select value={newBirthdayType} onChange={(e) => setNewBirthdayType(e.target.value)}
                    className="modal-input" style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}>
                    <option value="solar">公历</option>
                    <option value="lunar">农历</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label style={{ color: '#94a3b8' }}>关系</label>
                <select value={newRelationship} onChange={(e) => setNewRelationship(e.target.value)}
                  className="modal-input" style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}>
                  {['家人', '朋友', '恋人', '同事', '其他'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label style={{ color: '#94a3b8' }}>提醒设置</label>
                <div className="modal-notifications">
                  {[
                    { label: '提前1个月', checked: newRemind30, onChange: setNewRemind30 },
                    { label: '提前半个月', checked: newRemind15, onChange: setNewRemind15 },
                    { label: '提前1周', checked: newRemind7, onChange: setNewRemind7 },
                    { label: '当天', checked: newRemind0, onChange: setNewRemind0 },
                  ].map((item) => (
                    <label key={item.label} className="modal-checkbox" style={{ color: '#f8fafc' }}>
                      <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-field">
                <label style={{ color: '#94a3b8' }}>备注</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2}
                  className="modal-input modal-textarea" style={{ background: '#33415540', borderColor: '#334155', color: '#f8fafc' }} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="modal-cancel" style={{ color: '#94a3b8', background: '#33415540' }}>取消</button>
                <button type="submit" className="modal-save">保存</button>
              </div>
            </form>
          </div>
        )}

        {/* Cards list */}
        <div className="birthday-cards-list">
          {sortedCards.map((card) => {
            const days = getDaysUntilNext(card);
            const nextDate = getNextBday(card);
            const isExpanded = expandedCard === card.id;
            const relColors: Record<string, string> = { '家人': '#ff6b8a', '朋友': '#4ecdc4', '恋人': '#fd79a8', '同事': '#ffd93d', '其他': '#95a5a6' };

            return (
              <div key={card.id} className="birthday-card-item" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <div className="birthday-card-main" onClick={() => toggleExpand(card.id)}>
                  <div className="birthday-card-info">
                    <div className="birthday-card-name">{card.name}</div>
                    <div className="birthday-card-meta">
                      <span className="birthday-card-rel" style={{ background: (relColors[card.relationship] || '#95a5a6') + '30', color: relColors[card.relationship] || '#95a5a6' }}>
                        {card.relationship}
                      </span>
                      <span className="birthday-card-type">{card.birthdayType === 'lunar' ? '农历' : '公历'}</span>
                    </div>
                    <div className="birthday-card-date">{nextDate.toLocaleDateString('zh-CN')}</div>
                  </div>
                  <div className="birthday-card-countdown">
                    <span className="birthday-card-days" style={{ color: days <= 7 ? '#f87171' : '#f59e0b' }}>{days}</span>
                    <span className="birthday-card-days-label">天</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="birthday-card-delete">✕</button>
                </div>

                {isExpanded && (
                  <div className="birthday-card-expanded">
                    {/* Gift records */}
                    <div className="birthday-section">
                      <h4>送礼记录</h4>
                      {(gifts[card.id] || []).map((g) => (
                        <div key={g.id} className="birthday-record">
                          <span>{g.year}年 {g.direction} {g.giftName}</span>
                          <button onClick={() => deleteGift(g.id, card.id)} className="birthday-record-delete">删除</button>
                        </div>
                      ))}
                      {showGiftForm === card.id ? (
                        <div className="birthday-inline-form">
                          <input type="number" value={giftYear} onChange={(e) => setGiftYear(Number(e.target.value))} className="birthday-input-sm" placeholder="年份" />
                          <select value={giftDirection} onChange={(e) => setGiftDirection(e.target.value)} className="birthday-input-sm">
                            <option>我送TA</option><option>TA送我</option>
                          </select>
                          <input type="text" value={giftName} onChange={(e) => setGiftName(e.target.value)} className="birthday-input" placeholder="礼物名称" />
                          <button onClick={() => addGift(card.id)} className="birthday-add-btn">添加</button>
                          <button onClick={() => setShowGiftForm(null)} className="birthday-add-btn" style={{ background: '#64748b' }}>取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowGiftForm(card.id)} className="birthday-add-link">+ 添加送礼记录</button>
                      )}
                    </div>

                    {/* Anniversaries */}
                    <div className="birthday-section">
                      <h4>纪念日</h4>
                      {(anniversaries[card.id] || []).map((a) => {
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        const annDate = new Date(a.anniversaryDate);
                        let nextAnn = new Date(today.getFullYear(), annDate.getMonth(), annDate.getDate());
                        if (nextAnn < today) nextAnn = new Date(today.getFullYear() + 1, annDate.getMonth(), annDate.getDate());
                        const daysUntil = Math.ceil((nextAnn.getTime() - today.getTime()) / 86400000);

                        return (
                          <div key={a.id} className="birthday-record">
                            <span>{a.title} - {a.anniversaryDate} {a.repeatYearly ? '(每年)' : ''} 还有{daysUntil}天</span>
                            <button onClick={() => deleteAnniversary(a.id, card.id)} className="birthday-record-delete">删除</button>
                          </div>
                        );
                      })}
                      {showAnnForm === card.id ? (
                        <div className="birthday-inline-form">
                          <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="birthday-input" placeholder="纪念日名称" />
                          <input type="date" value={annDate} onChange={(e) => setAnnDate(e.target.value)} className="birthday-input-sm" />
                          <label className="modal-checkbox" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            <input type="checkbox" checked={annRepeat} onChange={(e) => setAnnRepeat(e.target.checked)} />
                            <span>每年重复</span>
                          </label>
                          <button onClick={() => addAnniversary(card.id)} className="birthday-add-btn">添加</button>
                          <button onClick={() => setShowAnnForm(null)} className="birthday-add-btn" style={{ background: '#64748b' }}>取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAnnForm(card.id)} className="birthday-add-link">+ 添加纪念日</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {cards.length === 0 && (
            <div className="admin-empty">还没有添加重要的人，点击上方 + 添加</div>
          )}
        </div>
      </div>
    </div>
  );
}
