'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Grid = number[][];

function createEmpty(): Grid { return Array.from({ length: 4 }, () => Array(4).fill(0)); }

function addRandom(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (grid[r][c] === 0) return true;
    if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
    if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
  }
  return false;
}

function slide(row: number[]): { row: number[]; score: number } {
  let arr = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr[i + 1] = 0; }
  }
  arr = arr.filter((v) => v !== 0);
  while (arr.length < 4) arr.push(0);
  return { row: arr, score };
}

function move(grid: Grid, dir: string): { grid: Grid; score: number; moved: boolean } {
  let newGrid = grid.map((r) => [...r]);
  let totalScore = 0;
  const old = JSON.stringify(grid);

  if (dir === 'left') {
    for (let r = 0; r < 4; r++) { const s = slide(newGrid[r]); newGrid[r] = s.row; totalScore += s.score; }
  } else if (dir === 'right') {
    for (let r = 0; r < 4; r++) { const s = slide(newGrid[r].reverse()); newGrid[r] = s.row.reverse(); totalScore += s.score; }
  } else if (dir === 'up') {
    for (let c = 0; c < 4; c++) {
      let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
      const s = slide(col); col = s.row; totalScore += s.score;
      for (let r = 0; r < 4; r++) newGrid[r][c] = col[r];
    }
  } else {
    for (let c = 0; c < 4; c++) {
      let col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
      const s = slide(col); col = s.row; totalScore += s.score;
      for (let r = 0; r < 4; r++) newGrid[3 - r][c] = col[r];
    }
  }

  const moved = JSON.stringify(newGrid) !== old;
  return { grid: newGrid, score: totalScore, moved };
}

const COLORS: Record<number, string> = {
  0: '#2d3748', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
  16: '#f59563', 32: '#f67c5f', 64: '#f65e3b',
  128: '#edcf72', 256: '#edcc61', 512: '#edc850',
  1024: '#edc53f', 2048: '#edc22e',
};

export default function Game2048() {
  const router = useRouter();
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(createEmpty())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => { setBest(parseInt(localStorage.getItem('2048_best') || '0')); }, []);

  const doMove = (dir: string) => {
    if (over) return;
    const result = move(grid, dir);
    if (result.moved) {
      const newGrid = addRandom(result.grid);
      setGrid(newGrid);
      const newScore = score + result.score;
      setScore(newScore);
      if (newScore > best) { setBest(newScore); localStorage.setItem('2048_best', String(newScore)); }
      if (newGrid.some((r) => r.some((v) => v === 2048)) && !won) setWon(true);
      if (!canMove(newGrid)) setOver(true);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const reset = () => {
    setGrid(addRandom(addRandom(createEmpty())));
    setScore(0); setWon(false); setOver(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => router.push('/games')}
        style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', zIndex: 10 }}>
        ← 返回
      </button>
      <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>🔢 2048</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>分数: {score}</span>
        <span style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>最高: {best}</span>
      </div>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px',
          background: '#1a1a2e', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', maxWidth: '90vw' }}>
        {grid.flat().map((val, i) => (
          <div key={i} style={{
            width: 'min(70px, 18vw)', height: 'min(70px, 18vw)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px', fontSize: val > 512 ? '1.2rem' : '1.5rem', fontWeight: 700,
            background: COLORS[val] || '#3c3a32',
            color: val <= 4 ? '#776e65' : '#f9f6f2',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.1s',
          }}>
            {val > 0 ? val : ''}
          </div>
        ))}
      </div>
      {(over || won) && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          {won && !over && <p style={{ color: '#22c55e', marginBottom: '0.5rem', fontWeight: 700 }}>🎉 恭喜达到2048！</p>}
          {over && <p style={{ color: '#f87171', marginBottom: '0.5rem', fontWeight: 700 }}>游戏结束</p>}
          <button onClick={reset} className="modal-save">再来一局</button>
        </div>
      )}
      <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.8rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
        方向键或滑动控制
      </p>
    </div>
  );
}
