let audioCtx: AudioContext | null = null;
let isPlaying = false;
let masterGain: GainNode | null = null;
let intervals: ReturnType<typeof setInterval>[] = [];

function createAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playChord(ctx: AudioContext, frequencies: number[], time: number, duration: number) {
  const now = ctx.currentTime + time;
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.015, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.01, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
  });
}

const chordProgressions: number[][] = [
  [261.63, 329.63, 392.00],  // C major
  [293.66, 369.99, 440.00],  // D minor
  [329.63, 415.30, 493.88],  // E minor
  [349.23, 440.00, 523.25],  // F major
  [392.00, 493.88, 587.33],  // G major
  [220.00, 277.18, 329.63],  // A minor
  [246.94, 311.13, 369.99],  // B dim
  [261.63, 329.63, 392.00],  // C major
];

function startMusic() {
  const ctx = createAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
  masterGain.connect(ctx.destination);

  let chordIndex = 0;
  const beatDuration = 4;

  function playNextChord() {
    if (!isPlaying || !masterGain) return;
    const chord = chordProgressions[chordIndex % chordProgressions.length];
    playChord(ctx, chord, 0, beatDuration);

    // Add subtle high harmonics
    const highFreq = chord[0] * 2;
    const osc = ctx.createOscillator();
    const hGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(highFreq, ctx.currentTime);
    hGain.gain.setValueAtTime(0, ctx.currentTime);
    hGain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 1);
    hGain.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDuration);
    osc.connect(hGain);
    hGain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + beatDuration);

    chordIndex++;
  }

  playNextChord();
  const interval = setInterval(playNextChord, beatDuration * 1000);
  intervals.push(interval);
  isPlaying = true;
}

export function toggleMusic(): boolean {
  if (isPlaying) {
    stopMusic();
    return false;
  } else {
    startMusic();
    return true;
  }
}

export function stopMusic() {
  isPlaying = false;
  intervals.forEach(clearInterval);
  intervals = [];
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(0, audioCtx?.currentTime ?? 0 + 0.5);
  }
}

export function getIsPlaying(): boolean {
  return isPlaying;
}
