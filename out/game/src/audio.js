// Sound effects made only with WebAudio oscillators and generated noise. Unlocked by a gesture.

import { createRandom } from './random.js';

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      const rng = createRandom(0xa17d10);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = rng.next() * 2 - 1;
    } catch {
      ctx = null;
    }
  }

  function tone(freq, endFreq, duration, type = 'sine', volume = 0.25, delay = 0) {
    if (!ctx || muted) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch { /* audio is cosmetic; never break the game */ }
  }

  function noise(duration, cutoff, volume = 0.15) {
    if (!ctx || muted || !noiseBuffer) return;
    try {
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter).connect(gain).connect(master);
      src.start(now);
      src.stop(now + duration + 0.02);
    } catch { /* ignore */ }
  }

  return {
    unlock,
    toggleMute() { muted = !muted; return muted; },
    footstep(soft) { noise(soft ? 0.045 : 0.075, soft ? 700 : 1300, soft ? 0.035 : 0.075); },
    chirp() { tone(680, 1240, 0.09, 'square', 0.1); },
    thud() { tone(120, 48, 0.22, 'triangle', 0.32); noise(0.16, 500, 0.16); },
    pickup() { tone(520, 780, 0.1, 'sine', 0.16); tone(780, 1040, 0.12, 'sine', 0.12, 0.08); },
    success() { [392, 523, 659, 784].forEach((f, i) => tone(f, f * 1.01, 0.2, 'triangle', 0.14, i * 0.1)); },
    fail() { tone(320, 70, 0.65, 'sawtooth', 0.18); noise(0.3, 380, 0.12); },
    alert() { tone(880, 660, 0.16, 'square', 0.12); tone(660, 880, 0.16, 'square', 0.1, 0.18); },
  };
}
