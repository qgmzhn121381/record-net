'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ================================================================
// TYPES & CONSTANTS
// ================================================================

type GameState = 'READY' | 'COUNTDOWN' | 'PLAYING' | 'DYING' | 'GAME_OVER';

interface Player {
  x: number; y: number; vy: number;
  groundY: number; isJumping: boolean; isCrouching: boolean;
  runFrame: number; runTimer: number; isDead: boolean; deathTimer: number;
  hasShield: boolean; hasStar: boolean; hasMagnet: boolean; hasDoubleScore: boolean;
  starTimer: number; shieldTimer: number; doubleTimer: number; magnetTimer: number;
}

interface Obstacle {
  type: string; x: number; y: number; w: number; h: number;
  isAir: boolean; active: boolean; animTimer: number;
}

interface Powerup {
  type: string; x: number; y: number; w: number; h: number;
  active: boolean; bobTimer: number; spawnY: number; appeared: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; alpha: number; life: number; decay: number;
}

interface LeaderboardEntry { score: number; }

interface SkyColor { top: [number, number, number]; bottom: [number, number, number]; }

interface Cloud { x: number; y: number; w: number; speed: number; }

interface Building { x: number; w: number; h: number; windows: { rx: number; ry: number }[]; }

interface GroundLine { x: number; }

const GRAVITY = 0.8;
const JUMP_VEL = -15;
const LONG_JUMP_VEL = -18;
const MAX_FALL = 20;
const BASE_SPEED = 300;
const MAX_SPEED = 700;
const SPEED_PER_SCORE = 0.8;

const PLAYER_W = 28;
const PLAYER_STAND_H = 52;
const PLAYER_CROUCH_H = 28;
const PLAYER_CROUCH_W = 36;

const GROUND_RATIO = 0.85;

const OBSTACLE_TYPES: Record<string, { w: number; h: number; isAir: boolean }> = {
  clock: { w: 30, h: 32, isAir: false },
  calendar: { w: 34, h: 48, isAir: false },
  giftbox: { w: 38, h: 42, isAir: false },
  cake: { w: 36, h: 50, isAir: false },
  bomb: { w: 30, h: 32, isAir: false },
  bird: { w: 40, h: 24, isAir: true },
  balloon: { w: 22, h: 34, isAir: true },
  plane: { w: 36, h: 20, isAir: true },
};

const GROUND_OBS = ['clock', 'calendar', 'giftbox', 'cake', 'bomb'];
const AIR_OBS = ['bird', 'balloon', 'plane'];

const POWERUP_TYPES = ['star', 'shield', 'double', 'magnet'];
const POWERUP_WEIGHTS = [0.4, 0.25, 0.2, 0.15];
const POWERUP_DURATIONS: Record<string, number> = { star: 5, shield: 0, double: 8, magnet: 10 };

const BALLOON_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'];

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// ================================================================
// SOUND MANAGER
// ================================================================

class SoundManager {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1, sweep?: number) {
    if (this.muted) return;
    try {
      const c = this.ensure(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (sweep !== undefined) o.frequency.linearRampToValueAtTime(sweep, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
    } catch { /* audio not available */ }
  }

  private noise(dur: number, vol = 0.05) {
    if (this.muted) return;
    try {
      const c = this.ensure(), sz = c.sampleRate * dur, buf = c.createBuffer(1, sz, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf; g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      s.connect(g); g.connect(c.destination); s.start();
    } catch { /* */ }
  }

  jump() { this.tone(300, 0.15, 'sine', 0.08, 600); }
  land() { this.tone(200, 0.1, 'triangle', 0.06, 100); }
  collect() { this.tone(800, 0.06, 'sine', 0.1); this.tone(1200, 0.1, 'sine', 0.08); }
  die() { this.tone(400, 0.5, 'sawtooth', 0.07, 100); this.noise(0.3, 0.04); }
  shieldBreak() { [800, 600, 400, 200].forEach((f, i) => this.tone(f, 0.06, 'square', 0.04)); }
  milestone() { this.tone(600, 0.1, 'sine', 0.08); setTimeout(() => this.tone(800, 0.1, 'sine', 0.08), 100); setTimeout(() => this.tone(1000, 0.15, 'sine', 0.08), 200); }
  powerup() { this.tone(400, 0.1, 'sine', 0.08, 800); setTimeout(() => this.tone(800, 0.15, 'sine', 0.08, 1200), 100); }
  crush() { this.tone(500, 0.06, 'square', 0.05); this.noise(0.05, 0.03); }
  toggle() { this.muted = !this.muted; }
}

// ================================================================
// DRAWING HELPERS
// ================================================================

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, w * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.3, y - w * 0.15, w * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.6, y, w * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - w * 0.2, y + w * 0.05, w * 0.25, 0, Math.PI * 2); ctx.fill();
}

function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, _t: number) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 2;
  ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a08020'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.5, cy - r * 0.6); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - r * 0.3, cy - r * 0.4); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillStyle = '#806020'; ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5), 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCalendar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(x, y, w, 10);
  for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x, y + 10 + i * ((h - 10) / 3)); ctx.lineTo(x + w, y + 10 + i * ((h - 10) / 3)); ctx.strokeStyle = '#eee'; ctx.stroke(); }
  for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * (w / 3), y + 10); ctx.lineTo(x + i * (w / 3), y + h); ctx.stroke(); }
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(x + w / 2 - 3, y - 4, 6, 8);
}

function drawGiftbox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(x + 2, y + 10, w - 4, h - 12);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x, y + 6, w, 8);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(x + w / 2 - 3, y + 6, 6, h - 8);
  ctx.fillRect(x + 4, y + h / 2, w - 8, 5);
  ctx.beginPath(); ctx.moveTo(x + w / 2 - 8, y + 8); ctx.quadraticCurveTo(x + w / 2, y - 2, x + w / 2 + 8, y + 8);
  ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3; ctx.stroke();
}

function drawCake(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  ctx.fillStyle = '#f8a5c2'; ctx.fillRect(x + 2, y + h * 0.4, w - 4, h * 0.55);
  ctx.fillStyle = '#f78fb3'; ctx.fillRect(x + 5, y + h * 0.2, w - 10, h * 0.25);
  ctx.fillStyle = '#e667a0';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + 6 + i * ((w - 12) / 4), y + h * 0.4, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#f5deb3'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y + h * 0.2); ctx.lineTo(x + w / 2, y - 2); ctx.stroke();
  const flicker = Math.sin(t * 15) * 2;
  ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.ellipse(x + w / 2, y - 6 + flicker, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffeaa7'; ctx.beginPath(); ctx.ellipse(x + w / 2, y - 4 + flicker, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
}

function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const cx = x + w / 2, cy = y + h / 2 + 2, r = Math.min(w, h) / 2 - 2;
  ctx.fillStyle = '#2d3436'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#636e72'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.quadraticCurveTo(cx + 10, cy - r - 10, cx + 6, cy - r - 16); ctx.stroke();
  const spark = Math.sin(t * 20) > 0;
  if (spark) { ctx.fillStyle = '#fdcb6e'; ctx.beginPath(); ctx.arc(cx + 6, cy - r - 16, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 6, cy - r - 16, 2, 0, Math.PI * 2); ctx.fill(); }
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const wing = Math.sin(t * 12) * 8;
  ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w * 0.2, y + h / 2 - wing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w, y + h / 2); ctx.lineTo(x + w * 0.8, y + h / 2 - wing); ctx.stroke();
  ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(x + w / 2 + 8, y + h / 2); ctx.lineTo(x + w / 2 + 14, y + h / 2 - 2); ctx.lineTo(x + w / 2 + 14, y + h / 2 + 2); ctx.fill();
}

function drawBalloon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, t: number) {
  const bob = Math.sin(t * 3) * 3;
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.35 + bob, w / 2, h * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2 - 3, y + h * 0.25 + bob, 3, 5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y + h * 0.7 + bob); ctx.quadraticCurveTo(x + w / 2 + 5, y + h * 0.85, x + w / 2, y + h); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + w / 2 - 3, y + h * 0.68 + bob); ctx.lineTo(x + w / 2 + 3, y + h * 0.68 + bob); ctx.lineTo(x + w / 2, y + h * 0.75 + bob); ctx.fill();
}

function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const bob = Math.sin(t * 4) * 3;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2 + bob);
  ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(-w / 2, -h / 2); ctx.lineTo(-w / 2 + 8, 0); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#bdc3c7'; ctx.beginPath(); ctx.moveTo(-w / 2 + 5, 0); ctx.lineTo(-w / 2 - 5, -h / 3); ctx.lineTo(-w / 2 - 5, h / 3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number, alpha: number) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f1c40f'; ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.globalAlpha = alpha * 0.4; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawShieldIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(74,144,217,0.3)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4A90D9'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.8); ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 0.4, cx + r * 0.6, cy + r * 0.2);
  ctx.quadraticCurveTo(cx, cy + r * 0.8, cx, cy + r * 0.8);
  ctx.quadraticCurveTo(cx, cy + r * 0.8, cx - r * 0.6, cy + r * 0.2);
  ctx.quadraticCurveTo(cx - r * 0.8, cy - r * 0.4, cx, cy - r * 0.8); ctx.stroke();
  ctx.restore();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number, alpha: number) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#00CED1'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.3, -r * 0.3); ctx.lineTo(-r * 0.3, -r * 0.3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawMagnet(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, swing: number) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(swing);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(-r * 0.4, -r, r * 0.35, r * 1.5);
  ctx.fillStyle = '#95a5a6'; ctx.fillRect(r * 0.05, -r, r * 0.35, r * 1.5);
  ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(-r * 0.22, cy + r * 0.5, r * 0.55, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#95a5a6'; ctx.beginPath(); ctx.arc(r * 0.22, cy + r * 0.5, r * 0.55, Math.PI, 0); ctx.fill();
  ctx.restore();
}

// ================================================================
// GAME CLASS
// ================================================================

class RunnerGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  W = 0; H = 0; groundY = 0;
  state: GameState = 'READY';
  score = 0; bestScore = 0; lastScore = 0;
  speed = BASE_SPEED;
  gameTime = 0; deathTimer = 0; countdownTimer = 0; countdownNum = 3;
  shakeX = 0; shakeY = 0; shakeTimer = 0;
  slowMo = false; slowMoTimer = 0;

  player!: Player;
  obstacles: Obstacle[] = [];
  powerups: Powerup[] = [];
  particles: Particle[] = [];
  floatTexts: { x: number; y: number; text: string; color: string; alpha: number; vy: number }[] = [];

  clouds: Cloud[] = [];
  buildings1: Building[] = [];
  buildings2: Building[] = [];
  groundLines: GroundLine[] = [];
  buildingOffset1 = 0; buildingOffset2 = 0; groundOffset = 0;

  lastObstacleX = 0; distanceSinceSpawn = 0; nextSpawnGap = 400;
  lastPowerupScore = 0; lastMilestone = 0; scoreFlash = 0;
  dustTimer = 0; balloonColorIdx = 0;

  input = { jump: false, crouch: false };
  keys: Record<string, boolean> = {};
  touchStartY = 0; touchStartTime = 0; touchActive = false;
  blocked = false;

  sound = new SoundManager();
  lastTime = 0; animId = 0;
  leaderboard: LeaderboardEntry[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bestScore = parseInt(localStorage.getItem('runner_best') || '0');
    this.lastScore = parseInt(localStorage.getItem('runner_last') || '0');
    try { this.leaderboard = JSON.parse(localStorage.getItem('runner_lb') || '[]'); } catch { this.leaderboard = []; }
    this.resize();
    this.initPlayer();
    this.initClouds();
    this.initBuildings();
    this.initGroundLines();
    this.calcSpawnGap();
    this.setupInput();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    this.W = rect.width; this.H = rect.height;
    this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundY = this.H * GROUND_RATIO;
    if (this.player) this.player.groundY = this.groundY;
    if (this.state === 'READY') this.player.x = this.W * 0.15;
  }

  // ---- INPUT ----
  setupInput() {
    const kd = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.keys['ArrowDown']) this.onJump();
      if (e.code === 'ArrowDown') this.onCrouch(true);
    };
    const ku = (e: KeyboardEvent) => { this.keys[e.code] = false; if (e.code === 'ArrowDown') this.onCrouch(false); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0]; this.touchStartY = t.clientY; this.touchStartTime = performance.now(); this.touchActive = true;
      const rect = this.canvas.getBoundingClientRect();
      if (t.clientY - rect.top < this.H * 0.5) this.onJump(); else this.onCrouch(true);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); if (!this.touchActive) return;
      const dy = e.touches[0].clientY - this.touchStartY;
      if (dy > 30) { this.onCrouch(true); this.input.jump = false; }
      else if (dy < -30) this.onJump();
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault(); this.touchActive = false; this.onCrouch(false);
    }, { passive: false });
    this.canvas.addEventListener('click', () => this.onJump());
  }

  onJump() {
    if (this.blocked) return;
    this.input.jump = true;
    if (this.state === 'READY') this.startCountdown();
    else if (this.state === 'GAME_OVER') this.restart();
  }

  onCrouch(down: boolean) {
    this.input.crouch = down;
    if (down && this.state === 'READY') this.startCountdown();
  }

  // ---- INIT ----
  initPlayer() {
    this.player = {
      x: 0, y: 0, vy: 0, groundY: this.groundY, isJumping: false, isCrouching: false,
      runFrame: 0, runTimer: 0, isDead: false, deathTimer: 0,
      hasShield: false, hasStar: false, hasMagnet: false, hasDoubleScore: false,
      starTimer: 0, shieldTimer: 0, doubleTimer: 0, magnetTimer: 0,
    };
  }

  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) this.clouds.push({ x: Math.random() * this.W, y: 20 + Math.random() * this.H * 0.35, w: 30 + Math.random() * 50, speed: 15 + Math.random() * 25 });
  }

  initBuildings() {
    this.buildings1 = []; this.buildings2 = [];
    const gen = (arr: Building[], count: number, minH: number, maxH: number) => {
      let bx = 0;
      for (let i = 0; i < count; i++) {
        const w = 30 + Math.random() * 50, h = minH + Math.random() * (maxH - minH);
        const wins: { rx: number; ry: number }[] = [];
        for (let wy = 8; wy < h - 8; wy += 12) for (let wx = 6; wx < w - 6; wx += 10) wins.push({ rx: wx, ry: wy });
        arr.push({ x: bx, w, h, windows: wins }); bx += w + 5 + Math.random() * 20;
      }
    };
    gen(this.buildings1, 20, 30, 80); gen(this.buildings2, 20, 15, 40);
  }

  initGroundLines() {
    this.groundLines = [];
    for (let x = 0; x < this.W + 50; x += 25 + Math.random() * 15) this.groundLines.push({ x });
  }

  reset() {
    this.score = 0; this.speed = BASE_SPEED; this.gameTime = 0;
    this.deathTimer = 0; this.countdownTimer = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;
    this.slowMo = false; this.slowMoTimer = 0;
    this.obstacles = []; this.powerups = []; this.particles = []; this.floatTexts = [];
    this.lastObstacleX = this.W; this.distanceSinceSpawn = 0;
    this.lastPowerupScore = 0; this.lastMilestone = 0; this.scoreFlash = 0;
    this.dustTimer = 0; this.blocked = false;
    this.player.x = this.W * 0.15; this.player.y = 0; this.player.vy = 0;
    this.player.isJumping = false; this.player.isCrouching = false;
    this.player.isDead = false; this.player.deathTimer = 0;
    this.player.runFrame = 0; this.player.runTimer = 0;
    this.player.hasShield = false; this.player.hasStar = false;
    this.player.hasMagnet = false; this.player.hasDoubleScore = false;
    this.player.starTimer = 0; this.player.shieldTimer = 0;
    this.player.doubleTimer = 0; this.player.magnetTimer = 0;
    this.input.jump = false; this.input.crouch = false;
    this.calcSpawnGap();
  }

  startCountdown() {
    this.state = 'COUNTDOWN'; this.countdownTimer = 0; this.countdownNum = 3;
  }

  restart() { this.reset(); this.startCountdown(); }

  calcSpawnGap() {
    const minG = 200 + PLAYER_W * 2;
    this.nextSpawnGap = minG + Math.random() * 200;
  }

  getSpeed() { return Math.min(BASE_SPEED + this.score * SPEED_PER_SCORE, MAX_SPEED); }

  getDifficulty() {
    const s = this.score;
    if (s < 100) return { airRate: 0, comboRate: 0, available: ['clock', 'calendar'] };
    if (s < 300) return { airRate: 0.15, comboRate: 0, available: [...GROUND_OBS.slice(0, 3)] };
    if (s < 500) return { airRate: 0.25, comboRate: 0.1, available: GROUND_OBS };
    if (s < 1000) return { airRate: 0.35, comboRate: 0.2, available: [...GROUND_OBS, ...AIR_OBS] };
    if (s < 2000) return { airRate: 0.45, comboRate: 0.3, available: [...GROUND_OBS, ...AIR_OBS] };
    return { airRate: 0.5, comboRate: 0.4, available: [...GROUND_OBS, ...AIR_OBS] };
  }

  getSkyColors(): { top: SkyColor; bottom: SkyColor; t: number } {
    const s = this.score;
    const ranges: [number, number, SkyColor, SkyColor][] = [
      [0, 500, { top: [135, 206, 235], bottom: [74, 144, 217] }, { top: [74, 144, 217], bottom: [255, 140, 66] }],
      [500, 1000, { top: [74, 144, 217], bottom: [255, 140, 66] }, { top: [255, 140, 66], bottom: [26, 26, 62] }],
      [1000, 2000, { top: [255, 140, 66], bottom: [26, 26, 62] }, { top: [26, 26, 62], bottom: [10, 10, 26] }],
    ];
    for (const [min, max, from, to] of ranges) {
      if (s >= min && s < max) return { top: from, bottom: to, t: (s - min) / (max - min) };
    }
    const last = ranges[ranges.length - 1];
    return { top: last[2], bottom: last[3], t: 1 };
  }

  getCloudColor(score: number): string {
    if (score < 500) return 'rgba(255,255,255,0.7)';
    if (score < 1000) return 'rgba(255,200,150,0.6)';
    if (score < 2000) return 'rgba(80,80,120,0.4)';
    return 'rgba(50,50,80,0.3)';
  }

  getBuildingColor(score: number, layer: number): string {
    const base = layer === 0 ? 40 : 55;
    if (score < 500) return `rgb(${base + 20},${base + 30},${base + 50})`;
    if (score < 1000) return `rgb(${base + 40},${base + 20},${base + 10})`;
    return `rgb(${base - 10},${base - 10},${base})`;
  }

  getObstacleHitbox(o: Obstacle) {
    const pad = o.type === 'bomb' ? 8 : 5;
    return { x: o.x + pad, y: o.y + pad, w: o.w - pad * 2, h: o.h - pad * 2 };
  }

  getPlayerHitbox() {
    const pw = this.player.isCrouching ? PLAYER_CROUCH_W : PLAYER_W;
    const ph = this.player.isCrouching ? PLAYER_CROUCH_H : PLAYER_STAND_H;
    return { x: this.player.x - pw / 2 + 4, y: this.groundY + this.player.y - ph + 4, w: pw - 8, h: ph - 8 };
  }

  // ---- SPAWN ----
  spawnObstacle() {
    const diff = this.getDifficulty();
    const isAir = Math.random() < diff.airRate && diff.available.some(t => OBSTACLE_TYPES[t]?.isAir);
    const pool = isAir ? diff.available.filter(t => OBSTACLE_TYPES[t]?.isAir) : diff.available.filter(t => !OBSTACLE_TYPES[t]?.isAir);
    if (pool.length === 0) return;
    const type = pool[Math.floor(Math.random() * pool.length)];
    const info = OBSTACLE_TYPES[type];
    let y: number;
    if (info.isAir) y = this.groundY - PLAYER_STAND_H - 20 - Math.random() * 30;
    else y = this.groundY - info.h;
    const o: Obstacle = { type, x: this.W + 20, y, w: info.w, h: info.h, isAir: info.isAir, active: true, animTimer: 0 };
    this.obstacles.push(o);

    if (Math.random() < diff.comboRate) {
      const comboType = Math.random();
      if (comboType < 0.3) {
        const t2 = GROUND_OBS[Math.floor(Math.random() * GROUND_OBS.length)];
        const i2 = OBSTACLE_TYPES[t2];
        this.obstacles.push({ type: t2, x: this.W + 20 + info.w + 60 + Math.random() * 40, y: this.groundY - i2.h, w: i2.w, h: i2.h, isAir: false, active: true, animTimer: 0 });
      } else if (comboType < 0.6 && isAir) {
        const t2 = GROUND_OBS[Math.floor(Math.random() * GROUND_OBS.length)];
        const i2 = OBSTACLE_TYPES[t2];
        this.obstacles.push({ type: t2, x: this.W + 20, y: this.groundY - i2.h, w: i2.w, h: i2.h, isAir: false, active: true, animTimer: 0 });
      } else {
        const t2 = AIR_OBS[Math.floor(Math.random() * AIR_OBS.length)];
        const i2 = OBSTACLE_TYPES[t2];
        this.obstacles.push({ type: t2, x: this.W + 20 + info.w + 40, y: this.groundY - PLAYER_STAND_H - 15 - Math.random() * 25, w: i2.w, h: i2.h, isAir: true, active: true, animTimer: 0 });
      }
    }
  }

  spawnPowerup() {
    if (this.powerups.length >= 2) return;
    const type = POWERUP_TYPES[this.weightedRandom(POWERUP_WEIGHTS)];
    const y = Math.random() > 0.5 ? this.groundY - PLAYER_STAND_H - 30 - Math.random() * 20 : this.groundY - 50 - Math.random() * 30;
    this.powerups.push({ type, x: this.W + 20, y, w: 25, h: 28, active: true, bobTimer: 0, spawnY: y, appeared: false });
  }

  weightedRandom(weights: number[]) {
    const r = Math.random(); let sum = 0;
    for (let i = 0; i < weights.length; i++) { sum += weights[i]; if (r < sum) return i; }
    return weights.length - 1;
  }

  // ---- PARTICLES ----
  addParticle(x: number, y: number, vx: number, vy: number, size: number, color: string, life: number) {
    this.particles.push({ x, y, vx, vy, size, color, alpha: 1, life, decay: 1 / life });
  }

  burstParticles(x: number, y: number, count: number, color: string, speed: number, size: number, life: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.5 + Math.random() * 0.5);
      this.addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, size * (0.5 + Math.random() * 0.5), color, life * (0.7 + Math.random() * 0.3));
    }
  }

  addFloatText(x: number, y: number, text: string, color: string) {
    this.floatTexts.push({ x, y, text, color, alpha: 1, vy: -80 });
  }

  // ---- UPDATE ----
  update(dt: number) {
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer += dt;
      const num = 3 - Math.floor(this.countdownTimer / 0.5);
      if (num !== this.countdownNum && num >= 0) { this.countdownNum = num; if (num > 0) this.sound.land(); }
      if (this.countdownTimer >= 2) { this.state = 'PLAYING'; this.sound.jump(); }
      this.updateClouds(dt * 0.3);
      this.player.runTimer += dt;
      if (this.player.runTimer > 0.1) { this.player.runTimer = 0; this.player.runFrame = (this.player.runFrame + 1) % 4; }
      return;
    }
    if (this.state === 'READY') {
      this.updateClouds(dt * 0.3);
      this.player.runTimer += dt;
      if (this.player.runTimer > 0.1) { this.player.runTimer = 0; this.player.runFrame = (this.player.runFrame + 1) % 4; }
      this.groundOffset += 60 * dt;
      return;
    }
    if (this.state === 'DYING') {
      this.deathTimer += dt;
      if (this.deathTimer < 0.3) { this.shakeTimer = 0.3 - this.deathTimer; this.shakeX = (Math.random() - 0.5) * 10; this.shakeY = (Math.random() - 0.5) * 10; }
      else { this.shakeX = 0; this.shakeY = 0; this.slowMo = true; this.slowMoTimer = 0.5; }
      if (this.deathTimer > 1.5) { this.state = 'GAME_OVER'; this.blocked = true; setTimeout(() => { this.blocked = false; }, 200); this.updateLeaderboard(); }
      this.updateParticles(dt);
      return;
    }
    if (this.state !== 'PLAYING') return;

    if (this.slowMo) { this.slowMoTimer -= dt; if (this.slowMoTimer <= 0) this.slowMo = false; }
    const effDt = this.slowMo ? dt * 0.3 : dt;
    this.gameTime += effDt;
    this.speed = this.getSpeed();

    this.updatePlayer(effDt);
    this.updateObstacles(effDt);
    this.updatePowerups(effDt);
    this.updateParticles(effDt);
    this.updateFloatTexts(effDt);
    this.updateClouds(effDt);
    this.updateBackground(effDt);
    this.updateGroundLines(effDt);

    const dist = this.speed * effDt;
    this.score += dist / 100 * (this.player.hasDoubleScore ? 2 : 1);

    this.distanceSinceSpawn += dist;
    const isRest = this.score > 0 && Math.floor(this.score / 600) > Math.floor((this.score - dist / 100) / 600);
    if (isRest) { this.distanceSinceSpawn = -1500; }
    if (this.distanceSinceSpawn >= this.nextSpawnGap) { this.spawnObstacle(); this.distanceSinceSpawn = 0; this.calcSpawnGap(); }

    const puDist = this.lastPowerupScore;
    if (this.score - puDist > 300 + Math.random() * 300 && this.score > 500) { this.spawnPowerup(); this.lastPowerupScore = this.score; }

    const milestone = Math.floor(this.score / 500);
    if (milestone > this.lastMilestone && milestone > 0) {
      this.lastMilestone = milestone;
      this.scoreFlash = 1;
      this.sound.milestone();
      this.addFloatText(this.W / 2, this.H / 2, `${milestone * 500}分!`, '#f1c40f');
    }
    if (this.scoreFlash > 0) this.scoreFlash -= dt * 2;

    this.dustTimer += effDt;
    if (this.dustTimer > 0.05 && !this.player.isJumping) {
      this.dustTimer = 0;
      this.addParticle(this.player.x - 5, this.groundY - 2, -30 - Math.random() * 20, -10 - Math.random() * 15, 2 + Math.random() * 2, 'rgba(180,180,180,0.5)', 0.4);
    }

    this.checkCollisions();
  }

  updatePlayer(dt: number) {
    const p = this.player;
    if (this.input.crouch && !p.isJumping) { p.isCrouching = true; }
    else { p.isCrouching = false; }

    if (this.input.jump && !p.isJumping && !p.isCrouching) {
      p.vy = this.keys['Space'] || this.keys['ArrowUp'] ? LONG_JUMP_VEL : JUMP_VEL;
      p.isJumping = true;
      this.sound.jump();
      for (let i = 0; i < 4; i++) this.addParticle(p.x, this.groundY - 5, -20 + Math.random() * 10, -20 - Math.random() * 20, 3, 'rgba(150,200,255,0.6)', 0.5);
      this.input.jump = false;
    }

    if (p.isJumping) {
      p.vy += GRAVITY; if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      p.y += p.vy;
      if (p.y >= 0) { p.y = 0; p.vy = 0; p.isJumping = false; this.sound.land(); }
    }

    p.runTimer += dt;
    if (p.runTimer > 0.08) { p.runTimer = 0; p.runFrame = (p.runFrame + 1) % 4; }

    if (p.hasStar) { p.starTimer -= dt; if (p.starTimer <= 0) { p.hasStar = false; p.starTimer = 0; } }
    if (p.hasDoubleScore) { p.doubleTimer -= dt; if (p.doubleTimer <= 0) { p.hasDoubleScore = false; p.doubleTimer = 0; } }
    if (p.hasMagnet) { p.magnetTimer -= dt; if (p.magnetTimer <= 0) { p.hasMagnet = false; p.magnetTimer = 0; } }
  }

  updateObstacles(dt: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= this.speed * dt; o.animTimer += dt;
      if (o.x + o.w < -50) { this.obstacles.splice(i, 1); }
    }
  }

  updatePowerups(dt: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.x -= this.speed * dt; pu.bobTimer += dt;
      if (!pu.appeared) { pu.appeared = true; }
      if (this.player.hasMagnet && pu.type === 'star') {
        const dx = this.player.x - pu.x, dy = (this.groundY - PLAYER_STAND_H / 2) - pu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) { pu.x += (dx / dist) * 300 * dt; pu.y += (dy / dist) * 300 * dt; }
      }
      if (pu.x + pu.w < -50) { this.powerups.splice(i, 1); }
    }
  }

  updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt;
      p.life -= dt; p.alpha = Math.max(0, p.life * p.decay);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateFloatTexts(dt: number) {
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy * dt; ft.alpha -= dt * 1.5;
      if (ft.alpha <= 0) this.floatTexts.splice(i, 1);
    }
  }

  updateClouds(dt: number) {
    const spd = this.state === 'PLAYING' ? this.speed * 0.05 : 30;
    for (const c of this.clouds) {
      c.x -= (spd + c.speed) * dt;
      if (c.x + c.w < 0) { c.x = this.W + c.w + Math.random() * 100; c.y = 20 + Math.random() * this.H * 0.35; }
    }
  }

  updateBackground(dt: number) {
    const spd = this.state === 'PLAYING' ? this.speed : 60;
    this.buildingOffset1 += spd * 0.15 * dt; this.buildingOffset2 += spd * 0.3 * dt;
  }

  updateGroundLines(dt: number) {
    const spd = this.state === 'PLAYING' ? this.speed : 60;
    this.groundOffset += spd * dt;
  }

  // ---- COLLISION ----
  checkCollisions() {
    const ph = this.getPlayerHitbox();
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i]; if (!o.active) continue;
      const hb = this.getObstacleHitbox(o);
      if (ph.x < hb.x + hb.w && ph.x + ph.w > hb.x && ph.y < hb.y + hb.h && ph.y + ph.h > hb.y) {
        if (this.player.hasStar) {
          o.active = false; this.score += 5 * (this.player.hasDoubleScore ? 2 : 1);
          this.burstParticles(o.x + o.w / 2, o.y + o.h / 2, 15, '#f1c40f', 200, 4, 0.6);
          this.addFloatText(o.x, o.y, '+5', '#f1c40f'); this.sound.crush();
        } else if (this.player.hasShield) {
          o.active = false; this.player.hasShield = false;
          this.burstParticles(this.player.x, this.groundY - PLAYER_STAND_H / 2, 12, '#4A90D9', 180, 5, 0.7);
          this.addFloatText(this.player.x, this.groundY - PLAYER_STAND_H - 10, '护盾破碎!', '#4A90D9');
          this.sound.shieldBreak();
        } else { this.playerDie(); return; }
      }
    }
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i]; if (!pu.active) continue;
      const bob = Math.sin(pu.bobTimer * 3) * 5;
      const puHb = { x: pu.x, y: pu.y + bob, w: pu.w, h: pu.h };
      if (ph.x < puHb.x + puHb.w && ph.x + ph.w > puHb.x && ph.y < puHb.y + puHb.h && ph.y + ph.h > puHb.y) {
        this.collectPowerup(pu); pu.active = false; this.powerups.splice(i, 1);
      }
    }
  }

  collectPowerup(pu: Powerup) {
    this.sound.powerup();
    this.burstParticles(pu.x + pu.w / 2, pu.y + pu.h / 2, 10, '#fff', 150, 3, 0.5);
    switch (pu.type) {
      case 'star': this.player.hasStar = true; this.player.starTimer = POWERUP_DURATIONS.star; this.addFloatText(pu.x, pu.y, '无敌!', '#f1c40f'); break;
      case 'shield': this.player.hasShield = true; this.addFloatText(pu.x, pu.y, '护盾!', '#4A90D9'); break;
      case 'double': this.player.hasDoubleScore = true; this.player.doubleTimer = POWERUP_DURATIONS.double; this.addFloatText(pu.x, pu.y, '双倍!', '#00CED1'); break;
      case 'magnet': this.player.hasMagnet = true; this.player.magnetTimer = POWERUP_DURATIONS.magnet; this.addFloatText(pu.x, pu.y, '磁铁!', '#e74c3c'); break;
    }
  }

  playerDie() {
    this.state = 'DYING'; this.deathTimer = 0; this.player.isDead = true;
    this.sound.die();
    const s = Math.floor(this.score); this.lastScore = s;
    localStorage.setItem('runner_last', String(s));
    if (s > this.bestScore) { this.bestScore = s; localStorage.setItem('runner_best', String(s)); }
    this.burstParticles(this.player.x, this.groundY - PLAYER_STAND_H / 2, 20, '#e74c3c', 200, 5, 0.8);
  }

  updateLeaderboard() {
    const s = this.lastScore;
    this.leaderboard.push({ score: s });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 5);
    localStorage.setItem('runner_lb', JSON.stringify(this.leaderboard));
  }

  // ---- RENDER ----
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    this.drawSky();
    this.drawClouds();
    this.drawBuildings();
    this.drawGround();
    this.drawObstacles();
    this.drawPowerups();
    this.drawParticles();
    this.drawFloatTexts();
    this.drawPlayer();
    ctx.restore();
    this.drawHUD();
    if (this.state === 'READY') this.drawReadyUI();
    if (this.state === 'COUNTDOWN') this.drawCountdown();
    if (this.state === 'GAME_OVER') this.drawGameOver();
    if (this.scoreFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.scoreFlash * 0.15})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  drawSky() {
    const ctx = this.ctx, sc = this.getSkyColors();
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, lerpColor(sc.top.top, sc.bottom.top, sc.t));
    grad.addColorStop(1, lerpColor(sc.top.bottom, sc.bottom.bottom, sc.t));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    if (this.score < 500) {
      ctx.fillStyle = 'rgba(255,255,200,0.3)'; ctx.beginPath(); ctx.arc(this.W * 0.8, this.H * 0.12, 30, 0, Math.PI * 2); ctx.fill();
    }
    if (this.score > 1500) {
      for (let i = 0; i < 20; i++) {
        const sx = (i * 137.5 + 50) % this.W, sy = (i * 97.3 + 20) % (this.H * 0.5);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(this.gameTime * 2 + i) * 0.2})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawClouds() {
    const color = this.getCloudColor(this.score);
    for (const c of this.clouds) drawCloud(this.ctx, c.x, c.y, c.w, color);
  }

  drawBuildings() {
    const ctx = this.ctx;
    const totalW1 = this.buildings1.reduce((s, b) => s + b.w + 25, 0);
    const totalW2 = this.buildings2.reduce((s, b) => s + b.w + 20, 0);
    const c1 = this.getBuildingColor(this.score, 0), c2 = this.getBuildingColor(this.score, 1);
    for (let pass = 0; pass < 2; pass++) {
      const arr = pass === 0 ? this.buildings1 : this.buildings2;
      const off = pass === 0 ? this.buildingOffset1 : this.buildingOffset2;
      const total = pass === 0 ? totalW1 : totalW2;
      const color = pass === 0 ? c1 : c2;
      const gap = pass === 0 ? 25 : 20;
      const speed = pass === 0 ? 0.15 : 0.3;
      const drawOff = off % total;
      for (let rep = -1; rep <= 1; rep++) {
        let bx = -drawOff + rep * total;
        for (const b of arr) {
          if (bx + b.w > -10 && bx < this.W + 10) {
            ctx.fillStyle = color; ctx.fillRect(bx, this.groundY - b.h, b.w, b.h);
            if (pass === 0 && this.score < 1500) {
              ctx.fillStyle = 'rgba(255,255,200,0.2)';
              for (const w of b.windows) ctx.fillRect(bx + w.rx, this.groundY - b.h + w.ry, 4, 4);
            }
          }
          bx += b.w + gap;
        }
      }
    }
  }

  drawGround() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2d3436'; ctx.fillRect(0, this.groundY, this.W, this.H - this.groundY);
    ctx.fillStyle = '#27ae60'; ctx.fillRect(0, this.groundY, this.W, 6);
    ctx.fillStyle = '#219a52';
    for (let x = 0; x < this.W; x += 8) {
      const h = 3 + Math.sin(x * 0.5) * 2;
      ctx.fillRect(x, this.groundY - h, 3, h + 6);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    const lineSpacing = 25;
    const totalLineW = lineSpacing * 40;
    const drawOff = this.groundOffset % totalLineW;
    for (let rep = -1; rep <= 1; rep++) {
      for (let i = 0; i < 40; i++) {
        const lx = -drawOff + rep * totalLineW + i * lineSpacing;
        if (lx > -50 && lx < this.W + 50) { ctx.beginPath(); ctx.moveTo(lx, this.groundY + 15); ctx.lineTo(lx + 12, this.groundY + 15); ctx.stroke(); }
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, this.groundY, this.W, 2);
  }

  drawPlayer() {
    const ctx = this.ctx, p = this.player;
    const px = p.x, py = this.groundY + p.y;
    const w = p.isCrouching ? PLAYER_CROUCH_W : PLAYER_W;
    const h = p.isCrouching ? PLAYER_CROUCH_H : PLAYER_STAND_H;

    if (p.hasStar) {
      ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(this.gameTime * 8) * 0.15;
      ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py - h / 2, h * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    if (p.isDead) { ctx.globalAlpha = 0.5; ctx.translate(px, py); ctx.rotate(Math.PI / 2); ctx.translate(-px, -py + 10); }

    if (p.isCrouching) {
      this.drawCrouchingPlayer(ctx, px, py, w, h);
    } else if (p.isJumping) {
      this.drawJumpingPlayer(ctx, px, py, h);
    } else {
      this.drawRunningPlayer(ctx, px, py, h, p.runFrame);
    }
    ctx.restore();
  }

  drawRunningPlayer(ctx: CanvasRenderingContext2D, px: number, py: number, h: number, frame: number) {
    const t = (frame / 4) * Math.PI * 2;
    const legSwing = Math.sin(t) * 10, armSwing = Math.sin(t) * 12;
    const headR = 8, bodyTop = py - h + 12, bodyH = 20;
    ctx.fillStyle = '#333'; ctx.fillRect(px - 3, py - 8, 6, 8);
    ctx.fillStyle = '#333'; ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - 2, py - bodyH - 8); ctx.lineTo(px - 2 + legSwing * 0.8, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 2, py - bodyH - 8); ctx.lineTo(px + 2 - legSwing * 0.8, py); ctx.stroke();
    ctx.fillStyle = '#4A90D9'; ctx.fillRect(px - 8, bodyTop, 16, bodyH);
    ctx.fillStyle = '#3A7BC8'; ctx.fillRect(px - 6, bodyTop + 2, 12, bodyH - 4);
    ctx.strokeStyle = '#FFDAB9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px - 8, bodyTop + 5); ctx.lineTo(px - 8 - armSwing * 0.6, bodyTop + 5 + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 8, bodyTop + 5); ctx.lineTo(px + 8 + armSwing * 0.6, bodyTop + 5 + 12); ctx.stroke();
    ctx.fillStyle = '#FFDAB9'; ctx.beginPath(); ctx.arc(px, bodyTop - headR + 2, headR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(px + 2, bodyTop - headR, 2, 2); ctx.fillRect(px + 5, bodyTop - headR, 2, 2);
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(px - 6, bodyTop - headR * 2 + 2); ctx.lineTo(px + 6, bodyTop - headR * 2 + 2); ctx.lineTo(px, bodyTop - headR * 2 - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 1, bodyTop - headR * 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px - 2, bodyTop - headR * 2 + 1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  drawJumpingPlayer(ctx: CanvasRenderingContext2D, px: number, py: number, h: number) {
    const headR = 8, bodyTop = py - h + 12, bodyH = 20;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - 3, py - 6); ctx.lineTo(px - 8, py - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 3, py - 6); ctx.lineTo(px + 8, py - 2); ctx.stroke();
    ctx.fillStyle = '#4A90D9'; ctx.fillRect(px - 8, bodyTop, 16, bodyH);
    ctx.strokeStyle = '#FFDAB9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px - 8, bodyTop + 5); ctx.lineTo(px - 14, bodyTop - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 8, bodyTop + 5); ctx.lineTo(px + 14, bodyTop - 5); ctx.stroke();
    ctx.fillStyle = '#FFDAB9'; ctx.beginPath(); ctx.arc(px, bodyTop - headR + 2, headR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(px + 2, bodyTop - headR, 2, 2); ctx.fillRect(px + 5, bodyTop - headR, 2, 2);
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(px - 6, bodyTop - headR * 2 + 2); ctx.lineTo(px + 6, bodyTop - headR * 2 + 2); ctx.lineTo(px, bodyTop - headR * 2 - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 1, bodyTop - headR * 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px - 2, bodyTop - headR * 2 + 1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  drawCrouchingPlayer(ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number) {
    ctx.fillStyle = '#333'; ctx.fillRect(px - w / 2 + 4, py - 6, 8, 6); ctx.fillRect(px + w / 2 - 12, py - 6, 8, 6);
    ctx.fillStyle = '#4A90D9'; ctx.fillRect(px - w / 2 + 2, py - h + 4, w - 4, h - 8);
    ctx.fillStyle = '#FFDAB9'; ctx.beginPath(); ctx.arc(px + w / 2 - 8, py - h + 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(px + w / 2 - 6, py - h, 1.5, 1.5); ctx.fillRect(px + w / 2 - 4, py - h, 1.5, 1.5);
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(px + w / 2 - 12, py - h - 3); ctx.lineTo(px + w / 2 - 4, py - h - 3); ctx.lineTo(px + w / 2 - 8, py - h - 10); ctx.closePath(); ctx.fill();
  }

  drawObstacles() {
    const ctx = this.ctx, t = this.gameTime;
    for (const o of this.obstacles) {
      if (!o.active || o.x + o.w < -10 || o.x > this.W + 10) continue;
      switch (o.type) {
        case 'clock': drawClock(ctx, o.x, o.y, o.w, o.h, t); break;
        case 'calendar': drawCalendar(ctx, o.x, o.y, o.w, o.h); break;
        case 'giftbox': drawGiftbox(ctx, o.x, o.y, o.w, o.h); break;
        case 'cake': drawCake(ctx, o.x, o.y, o.w, o.h, t); break;
        case 'bomb': drawBomb(ctx, o.x, o.y, o.w, o.h, t); break;
        case 'bird': drawBird(ctx, o.x, o.y, o.w, o.h, t); break;
        case 'balloon': drawBalloon(ctx, o.x, o.y, o.w, o.h, BALLOON_COLORS[this.balloonColorIdx++ % BALLOON_COLORS.length], t); break;
        case 'plane': drawPlane(ctx, o.x, o.y, o.w, o.h, t); break;
      }
    }
  }

  drawPowerups() {
    const ctx = this.ctx, t = this.gameTime;
    for (const pu of this.powerups) {
      if (!pu.active || pu.x + pu.w < -10 || pu.x > this.W + 10) continue;
      const bob = Math.sin(pu.bobTimer * 3) * 5;
      const cx = pu.x + pu.w / 2, cy = pu.y + pu.h / 2 + bob;
      const glow = 0.7 + Math.sin(t * 4) * 0.3;
      ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      switch (pu.type) {
        case 'star': drawStar(ctx, cx, cy, 12, t * 3, glow); break;
        case 'shield': drawShieldIcon(ctx, cx, cy, 13, glow); break;
        case 'double': drawDiamond(ctx, cx, cy, 12, Math.sin(t * 2) * 0.3, glow); break;
        case 'magnet': drawMagnet(ctx, cx, cy, 12, Math.sin(t * 4) * 0.2); break;
      }
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  drawFloatTexts() {
    const ctx = this.ctx;
    for (const ft of this.floatTexts) {
      ctx.save(); ctx.globalAlpha = ft.alpha; ctx.fillStyle = ft.color;
      ctx.font = 'bold 18px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  drawHUD() {
    if (this.state !== 'PLAYING' && this.state !== 'DYING' && this.state !== 'GAME_OVER') return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, this.W, 50);
    const score = Math.floor(this.score);
    ctx.font = 'bold 22px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillStyle = this.player.hasDoubleScore ? '#00CED1' : '#fff';
    ctx.fillText(`${score}`, 16, 32);
    if (this.player.hasDoubleScore) { ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = '#00CED1'; ctx.fillText('x2', 16 + ctx.measureText(String(score)).width + 5, 32); }

    ctx.font = '13px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#94a3b8';
    ctx.fillText(`最高: ${this.bestScore}`, this.W - 16, 22);
    const spdMul = (this.speed / BASE_SPEED).toFixed(1);
    ctx.fillText(`速度 x${spdMul}`, this.W - 16, 40);

    let iconX = 16;
    ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'left';
    if (this.player.hasStar) {
      ctx.fillStyle = '#f1c40f'; ctx.fillText(`无敌 ${this.player.starTimer.toFixed(1)}s`, iconX, 46);
      iconX += 70;
    }
    if (this.player.hasDoubleScore) {
      ctx.fillStyle = '#00CED1'; ctx.fillText(`x2 ${this.player.doubleTimer.toFixed(1)}s`, iconX, 46);
      iconX += 60;
    }
    if (this.player.hasMagnet) {
      ctx.fillStyle = '#e74c3c'; ctx.fillText(`磁铁 ${this.player.magnetTimer.toFixed(1)}s`, iconX, 46);
      iconX += 70;
    }
    if (this.player.hasShield) {
      ctx.fillStyle = '#4A90D9'; ctx.fillText('护盾', iconX, 46);
    }

    ctx.textAlign = 'right'; ctx.fillStyle = this.sound.muted ? '#555' : '#fff';
    ctx.font = '16px sans-serif'; ctx.fillText(this.sound.muted ? '🔇' : '🔊', this.W - 16, 46);
  }

  drawReadyUI() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('时光跑酷', this.W / 2, this.H * 0.25);
    ctx.font = '16px "Noto Sans SC", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('奔跑吧，时光不等人！', this.W / 2, this.H * 0.32);

    const pulse = 1 + Math.sin(performance.now() / 500) * 0.05;
    ctx.save(); ctx.translate(this.W / 2, this.H * 0.48); ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(102,126,234,0.3)'; ctx.beginPath();
    ctx.roundRect(-100, -25, 200, 50, 12); ctx.fill();
    ctx.strokeStyle = '#667eea'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '18px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('点击或按空格开始', 0, 7);
    ctx.restore();

    ctx.font = '13px "Noto Sans SC", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('空格/↑/点击上方: 跳跃  |  ↓/点击下方: 下蹲', this.W / 2, this.H * 0.58);

    ctx.font = '14px Inter, sans-serif'; ctx.fillStyle = '#f59e0b';
    ctx.fillText(`最高分: ${this.bestScore}`, this.W / 2, this.H * 0.65);
    if (this.lastScore > 0) { ctx.fillStyle = '#94a3b8'; ctx.fillText(`上次得分: ${this.lastScore}`, this.W / 2, this.H * 0.70); }
  }

  drawCountdown() {
    const ctx = this.ctx;
    const elapsed = this.countdownTimer % 0.5;
    const scale = 1 + (1 - elapsed / 0.5) * 0.5;
    const alpha = elapsed / 0.5;
    ctx.save(); ctx.textAlign = 'center';
    ctx.font = `bold 72px Inter, sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.translate(this.W / 2, this.H * 0.45); ctx.scale(scale, scale);
    const text = this.countdownNum > 0 ? String(this.countdownNum) : 'GO!';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';

    ctx.font = 'bold 36px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('GAME OVER', this.W / 2, this.H * 0.18);

    const cardY = this.H * 0.24;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath();
    ctx.roundRect(this.W / 2 - 130, cardY, 260, 130, 12); ctx.fill();

    ctx.font = '14px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('得分', this.W / 2, cardY + 25);
    ctx.font = 'bold 36px Inter, sans-serif'; ctx.fillStyle = '#f59e0b';
    ctx.fillText(String(Math.floor(this.score)), this.W / 2, cardY + 62);

    ctx.font = '13px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#94a3b8';
    ctx.fillText(`距离: ${Math.floor(this.score * 100)}米`, this.W / 2, cardY + 85);
    ctx.fillText(`最高: ${this.bestScore}`, this.W / 2, cardY + 105);

    if (Math.floor(this.score) >= this.bestScore && this.bestScore > 0) {
      const flash = Math.sin(performance.now() / 200) * 0.3 + 0.7;
      ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
      ctx.fillStyle = `rgba(241,196,15,${flash})`;
      ctx.fillText('新纪录! 🎉', this.W / 2, cardY + 128);
    }

    const btnY = cardY + 150;
    ctx.fillStyle = 'rgba(102,126,234,0.4)'; ctx.beginPath();
    ctx.roundRect(this.W / 2 - 80, btnY, 160, 42, 10); ctx.fill();
    ctx.strokeStyle = '#667eea'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '16px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('再来一局', this.W / 2, btnY + 27);

    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath();
    ctx.roundRect(this.W / 2 - 80, btnY + 52, 160, 42, 10); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.fillText('返回首页', this.W / 2, btnY + 79);

    if (this.leaderboard.length > 0) {
      const lbY = btnY + 115;
      ctx.font = '14px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#94a3b8';
      ctx.fillText('排行榜', this.W / 2, lbY);
      ctx.font = '14px Inter, sans-serif';
      this.leaderboard.forEach((e, i) => {
        const isLast = e.score === Math.floor(this.score) && i === this.leaderboard.findIndex(l => l.score === e.score);
        ctx.fillStyle = isLast ? '#f59e0b' : '#cbd5e1';
        ctx.fillText(`${i + 1}. ${e.score}`, this.W / 2, lbY + 22 + i * 22);
      });
    }

    // Store button positions for click handling
    this._gameOverButtons = {
      restart: { x: this.W / 2 - 80, y: btnY, w: 160, h: 42 },
      back: { x: this.W / 2 - 80, y: btnY + 52, w: 160, h: 42 },
    };
  }

  _gameOverButtons?: { restart: { x: number; y: number; w: number; h: number }; back: { x: number; y: number; w: number; h: number } };

  // ---- MAIN LOOP ----
  loop = (time: number) => {
    if (!this.lastTime) this.lastTime = time;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  }

  start() { this.animId = requestAnimationFrame(this.loop); }
  stop() { cancelAnimationFrame(this.animId); }

  getGameOverButton(clientX: number, clientY: number): 'restart' | 'back' | null {
    if (!this._gameOverButtons || this.state !== 'GAME_OVER') return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (this.W / rect.width);
    const y = (clientY - rect.top) * (this.H / rect.height);
    const r = this._gameOverButtons.restart;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return 'restart';
    const b = this._gameOverButtons.back;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'back';
    return null;
  }
}

// ================================================================
// REACT COMPONENT
// ================================================================

export default function RunnerGamePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<RunnerGame | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new RunnerGame(canvasRef.current);
    gameRef.current = game;
    game.start();

    // Handle game-over button clicks
    const handleClick = (e: MouseEvent) => {
      if (game.state !== 'GAME_OVER') return;
      const btn = game.getGameOverButton(e.clientX, e.clientY);
      if (btn === 'restart') game.restart();
      else if (btn === 'back') router.push('/games');
    };
    const handleTouchEnd2 = (e: TouchEvent) => {
      if (game.state !== 'GAME_OVER') return;
      const t = e.changedTouches[0];
      const btn = game.getGameOverButton(t.clientX, t.clientY);
      if (btn === 'restart') { e.preventDefault(); game.restart(); }
      else if (btn === 'back') { e.preventDefault(); router.push('/games'); }
    };
    canvasRef.current.addEventListener('click', handleClick);
    canvasRef.current.addEventListener('touchend', handleTouchEnd2);

    return () => { game.stop(); canvasRef.current?.removeEventListener('click', handleClick); canvasRef.current?.removeEventListener('touchend', handleTouchEnd2); };
  }, [router]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a', overflow: 'hidden' }}>
      <button onClick={() => router.push('/games')}
        style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', zIndex: 10, padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-noto-sans), Noto Sans SC, sans-serif' }}>
        ← 返回
      </button>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
    </div>
  );
}
