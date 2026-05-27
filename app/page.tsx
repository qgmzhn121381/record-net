'use client';

import { useRouter } from 'next/navigation';
import { getTodayQuote } from '@/lib/quotes';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [quote] = useState(getTodayQuote);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="landing-page">
      <div className="login-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="login-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 10}px`,
              height: `${6 + Math.random() * 10}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              opacity: 0.15 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      <div className="landing-content">
        <h1 className="login-title">记录网</h1>
        <p className="login-subtitle">记录每一个值得铭记的时刻</p>

        <div className="landing-buttons">
          <button onClick={() => router.push('/auth')} className="landing-btn primary">
            <span className="landing-btn-icon">📝</span>
            进入记录网
          </button>
          <button onClick={() => router.push('/watch')} className="landing-btn secondary">
            <span className="landing-btn-icon">🎬</span>
            免费看剧
          </button>
        </div>

        <div className="landing-quote">
          <span className="quote-mark-lg">&ldquo;</span>
          <p>{quote}</p>
          <span className="quote-mark-lg-end">&rdquo;</span>
        </div>
      </div>
    </div>
  );
}
