'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const EMOJIS = ['😊', '😢', '🥰', '😤', '😌', '🤩', '😴', '🎉'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGame() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => { setBest(parseInt(localStorage.getItem('memory_best') || '999')); }, []);

  const initGame = () => {
    const pairs = [...EMOJIS, ...EMOJIS];
    const shuffled = shuffle(pairs).map((emoji, i) => ({
      id: i, emoji, flipped: false, matched: false,
    }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setWon(false);
    setTimer(0);
    setRunning(true);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const flipCard = (id: number) => {
    if (flipped.length >= 2) return;
    if (cards[id].flipped || cards[id].matched) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          const updated = [...newCards];
          updated[a].matched = true;
          updated[b].matched = true;
          setCards(updated);
          setFlipped([]);

          if (updated.every((c) => c.matched)) {
            setRunning(false);
            setWon(true);
            const score = timer;
            if (score < (best || 999)) {
              setBest(score);
              localStorage.setItem('memory_best', String(score));
            }
          }
        }, 300);
      } else {
        setTimeout(() => {
          const updated = [...newCards];
          updated[a].flipped = false;
          updated[b].flipped = false;
          setCards(updated);
          setFlipped([]);
        }, 800);
      }
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => router.push('/games')}
        style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', zIndex: 10 }}>
        ← 返回
      </button>
      <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>🃏 记忆翻牌</h2>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
        <span style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>步数: {moves}</span>
        <span style={{ color: '#60a5fa', fontFamily: 'Inter, sans-serif' }}>时间: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
        {best && best < 999 && <span style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>最佳: {best}s</span>}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
        padding: '12px', background: '#1a1a2e', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.15)', maxWidth: '90vw',
      }}>
        {cards.map((card) => (
          <button key={card.id} onClick={() => flipCard(card.id)}
            style={{
              width: 'min(65px, 18vw)', height: 'min(65px, 18vw)',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: card.flipped || card.matched
                ? (card.matched ? 'rgba(34,197,94,0.2)' : 'rgba(102,126,234,0.2)')
                : 'rgba(255,255,255,0.05)',
              cursor: card.matched ? 'default' : 'pointer',
              fontSize: card.flipped || card.matched ? '1.8rem' : '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              color: 'rgba(255,255,255,0.3)',
            }}>
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>

      {won && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ color: '#22c55e', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
            🎉 恭喜通关！用时 {timer} 秒，{moves} 步
          </p>
          <button onClick={initGame} className="modal-save">再来一局</button>
        </div>
      )}
    </div>
  );
}
