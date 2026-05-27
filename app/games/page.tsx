'use client';

import { useRouter } from 'next/navigation';

const games = [
  { id: 'runner', name: '时光跑酷', emoji: '🏃', desc: '跑过时光，避开障碍' },
  { id: '2048', name: '2048', emoji: '🔢', desc: '合并数字，挑战极限' },
  { id: 'snake', name: '贪吃蛇', emoji: '🐍', desc: '经典贪吃蛇' },
  { id: 'memory', name: '记忆翻牌', emoji: '🃏', desc: '考验记忆力' },
];

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="login-page" style={{ minHeight: '100vh' }}>
      <div className="login-particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="login-particle"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 8}px`, height: `${6 + Math.random() * 8}px`,
              animationDelay: `${Math.random() * 8}s`, animationDuration: `${6 + Math.random() * 8}s`,
              opacity: 0.12 + Math.random() * 0.15, }} />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '600px', padding: '1rem' }}>
        <button onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' }}>
          ← 返回首页
        </button>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
          🎮 小游戏乐园
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
          放松一下吧
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {games.map((game) => (
            <button key={game.id} onClick={() => router.push(`/games/${game.id}`)}
              className="game-card"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s', color: '#fff' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{game.emoji}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem',
                fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>{game.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>{game.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
