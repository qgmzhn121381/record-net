'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const CELL = 16;
const COLS = 25;
const ROWS = 18;
const W = COLS * CELL;
const H = ROWS * CELL;

type Pos = { x: number; y: number };

export default function SnakeGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const snakeRef = useRef<Pos[]>([{ x: 12, y: 9 }]);
  const dirRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 18, y: 9 });
  const runningRef = useRef(false);
  const scoreRef = useRef(0);
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => { setBest(parseInt(localStorage.getItem('snake_best') || '0')); }, []);

  const spawnFood = useCallback(() => {
    let pos: Pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snakeRef.current.some((s) => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 12, y: 9 }];
    dirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    runningRef.current = true;
    spawnFood();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastDir = { ...dirRef.current };

    const gameLoop = () => {
      if (!runningRef.current) return;
      lastDir = { ...dirRef.current };

      const head = { ...snakeRef.current[0] };
      head.x += lastDir.x;
      head.y += lastDir.y;

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        runningRef.current = false;
        setGameOver(true);
        if (scoreRef.current > best) {
          setBest(scoreRef.current);
          localStorage.setItem('snake_best', String(scoreRef.current));
        }
        return;
      }

      // Self collision
      if (snakeRef.current.some((s) => s.x === head.x && s.y === head.y)) {
        runningRef.current = false;
        setGameOver(true);
        if (scoreRef.current > best) {
          setBest(scoreRef.current);
          localStorage.setItem('snake_best', String(scoreRef.current));
        }
        return;
      }

      snakeRef.current.unshift(head);

      // Food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
        spawnFood();
      } else {
        snakeRef.current.pop();
      }

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }

      // Snake
      snakeRef.current.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#667eea' : '#764ba2';
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });

      // Food
      ctx.font = `${CELL - 2}px serif`;
      ctx.fillText('🍎', foodRef.current.x * CELL + 1, foodRef.current.y * CELL + CELL - 2);

      setTimeout(gameLoop, Math.max(60, 150 - scoreRef.current));
    };

    gameLoop();
  }, [best, spawnFood]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return;
      const map: Record<string, Pos> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      };
      const d = map[e.key];
      if (d && (d.x !== -dirRef.current.x || d.y !== -dirRef.current.y)) {
        e.preventDefault();
        dirRef.current = d;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => router.push('/games')}
        style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', zIndex: 10 }}>
        ← 返回
      </button>
      <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>🐍 贪吃蛇</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>分数: {score}</span>
        <span style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>最高: {best}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={W} height={H}
          onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            if (Math.abs(dx) > Math.abs(dy)) dirRef.current = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
            else dirRef.current = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
          }}
          style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', maxWidth: '90vw' }} />

        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: '16px' }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>游戏结束</p>
            <p style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>得分: {score}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={startGame} className="modal-save" style={{ fontSize: '0.85rem' }}>再来一局</button>
              <button onClick={() => router.push('/games')} className="modal-cancel" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.1)', border: 'none' }}>返回</button>
            </div>
          </div>
        )}
        {!started && !gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '16px' }}>
            <p style={{ color: '#fff', marginBottom: '1rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>方向键或滑动控制</p>
            <button onClick={startGame} className="modal-save">开始游戏</button>
          </div>
        )}
      </div>
    </div>
  );
}
