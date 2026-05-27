'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function RunnerGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef({
    player: { x: 80, y: 0, vy: 0, jumping: false },
    obstacles: [] as { x: number; y: number; type: number; w: number; h: number }[],
    clouds: [] as { x: number; y: number; w: number }[],
    ground: 0,
    speed: 4,
    score: 0,
    running: false,
    animFrame: 0,
  });

  useEffect(() => {
    const hs = parseInt(localStorage.getItem('runner_high') || '0');
    setHighScore(hs);
  }, []);

  const jump = () => {
    const s = stateRef.current;
    if (!s.player.jumping && s.running) {
      s.player.vy = -12;
      s.player.jumping = true;
    }
  };

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.player = { x: 80, y: 0, vy: 0, jumping: false };
    s.obstacles = [];
    s.clouds = Array.from({ length: 3 }, () => ({ x: Math.random() * 600, y: 30 + Math.random() * 60, w: 40 + Math.random() * 30 }));
    s.speed = 4;
    s.score = 0;
    s.running = true;
    setScore(0);
    setGameOver(false);
    setStarted(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    s.ground = h - 60;

    const obstacles = ['🕐', '📅', '💣', '🐦'];
    let frame = 0;

    const spawnObstacle = () => {
      const type = Math.floor(Math.random() * 4);
      const sizes = [
        { w: 30, h: 30, yOff: -30 },
        { w: 35, h: 35, yOff: -35 },
        { w: 30, h: 35, yOff: -35 },
        { w: 30, h: 25, yOff: -80 },
      ];
      s.obstacles.push({
        x: w + 20,
        y: s.ground + sizes[type].yOff,
        type,
        w: sizes[type].w,
        h: sizes[type].h,
      });
    };

    const gameLoop = () => {
      if (!s.running) return;
      frame++;

      ctx.clearRect(0, 0, w, h);

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#16213e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (const cloud of s.clouds) {
        cloud.x -= s.speed * 0.3;
        if (cloud.x + cloud.w < 0) { cloud.x = w + 20; cloud.y = 30 + Math.random() * 60; }
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.w, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(0, s.ground, w, h - s.ground);
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(0, s.ground, w, 2);

      // Player physics
      s.player.vy += 0.6;
      s.player.y += s.player.vy;
      if (s.player.y >= 0) { s.player.y = 0; s.player.vy = 0; s.player.jumping = false; }

      // Draw player
      const px = s.player.x;
      const py = s.ground + s.player.y - 35;
      ctx.font = '32px serif';
      ctx.fillText('🏃', px, py + 28);

      // Obstacles
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const o = s.obstacles[i];
        o.x -= s.speed;
        ctx.font = '28px serif';
        ctx.fillText(obstacles[o.type], o.x, s.ground + o.y + 28);

        // Collision
        if (px + 20 > o.x && px < o.x + o.w && py + 30 > s.ground + o.y) {
          s.running = false;
          setGameOver(true);
          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem('runner_high', String(s.score));
          }
          return;
        }

        if (o.x < -40) s.obstacles.splice(i, 1);
      }

      // Spawn
      if (frame % Math.max(50, 90 - Math.floor(s.speed)) === 0) spawnObstacle();

      // Score & speed
      s.score++;
      s.speed = 4 + s.score / 500;
      setScore(s.score);

      s.animFrame = requestAnimationFrame(gameLoop);
    };

    s.animFrame = requestAnimationFrame(gameLoop);

    const handleKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    const handleTouch = () => jump();
    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('click', jump);

    return () => {
      cancelAnimationFrame(s.animFrame);
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', jump);
    };
  }, [highScore]);

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => router.push('/games')}
        style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', zIndex: 10 }}>
        ← 返回
      </button>
      <h2 style={{ color: '#fff', marginBottom: '1rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
        🏃 时光跑酷
      </h2>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={400} height={250}
          style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: '#1a1a2e', maxWidth: '90vw' }} />
        {started && !gameOver && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', color: '#f59e0b', fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 700 }}>
            {score}
          </div>
        )}
        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: '16px' }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>游戏结束</p>
            <p style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>得分: {score}</p>
            <p style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', marginBottom: '1rem' }}>最高: {highScore}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={startGame} className="modal-save" style={{ fontSize: '0.85rem' }}>再来一局</button>
              <button onClick={() => router.push('/games')} className="modal-cancel" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.1)', border: 'none' }}>返回</button>
            </div>
          </div>
        )}
        {!started && !gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px' }}>
            <p style={{ color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>按空格键或点击屏幕跳跃</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'Inter, sans-serif' }}>最高分: {highScore}</p>
            <button onClick={startGame} className="modal-save">开始游戏</button>
          </div>
        )}
      </div>
    </div>
  );
}
