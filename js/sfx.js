/* =========================================================
   sfx.js — 8비트 효과음 + 시작 화면 대기 음악 (파일 없이 코드로 만든 소리, Web Audio API)
   팀 결정(2026-11-07): 효과음 모두 8비트(B) · 새 소리 found·stamp·whistle·flip·hint · 스캔 중 소리는 빼기
                         대기 음악 B "두근두근 탐사" · 입장 소리 1번 "띠리링!"
   사용: playSfx('check');  Bgm.start();  Bgm.stop();  playStart();   끄기: setSound(false)
   ========================================================= */
'use strict';

const Sfx = {
  ctx: null, out: null,
  on: (() => { try { const v = localStorage.getItem('appSound'); if (v) return v !== 'off'; } catch (e) {} return true; })()
};

function setSound(on) {
  Sfx.on = on;
  try { localStorage.setItem('appSound', on ? 'on' : 'off'); } catch (e) {}
  if (!on) Bgm.stop();
}

function sfxCtx() {
  if (!Sfx.ctx) {
    Sfx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    Sfx.out = Sfx.ctx.createGain(); Sfx.out.gain.value = 0.9; Sfx.out.connect(Sfx.ctx.destination);
  }
  if (Sfx.ctx.state === 'suspended') Sfx.ctx.resume();
  return Sfx.ctx;
}

function tone(type, f1, f2, start, dur, vol) {
  const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(f1, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(Sfx.out); o.start(t); o.stop(t + dur + 0.03);
}
function noise(start, dur, vol, freq, kind) {
  const c = Sfx.ctx, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + start;
  s.buffer = buf; f.type = kind || 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(Sfx.out); s.start(t); s.stop(t + dur);
}
function vib(f, start, dur, vol, rate, depth) {
  const c = Sfx.ctx, o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain(), t = c.currentTime + start;
  o.type = 'square'; o.frequency.value = f; l.frequency.value = rate; lg.gain.value = depth;
  l.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setValueAtTime(vol, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(Sfx.out); o.start(t); l.start(t); o.stop(t + dur + 0.02); l.stop(t + dur + 0.02);
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

const SFX = (() => {
  const v = 0.25, q = 0.09;
  return {
    tap:     () => tone('square', 880, 0, 0, 0.04, q),
    next:    () => { tone('square', 660, 0, 0, 0.05, q); tone('square', 990, 0, 0.055, 0.07, q); },
    tab:     () => { tone('triangle', 440, 880, 0, 0.08, v); tone('square', 1320, 0, 0.07, 0.03, q * 0.7); },
    check:   () => { tone('square', 1046, 0, 0, 0.06, q); tone('square', 1568, 0, 0.065, 0.12, q); },
    uncheck: () => tone('triangle', 330, 220, 0, 0.14, v),
    open:    () => { tone('square', 523, 0, 0, 0.04, q * 0.8); tone('square', 784, 0, 0.045, 0.06, q * 0.8); },
    full:    () => { tone('triangle', 220, 0, 0, 0.08, v); tone('triangle', 220, 0, 0.12, 0.1, v); },
    save:    () => [784, 1046, 1318].forEach((f, i) => tone('square', f, 0, i * 0.06, i === 2 ? 0.16 : 0.06, q)),
    star:    () => { [1318, 1568, 2093].forEach((f, i) => tone('square', f, 0, i * 0.05, 0.07, q)); tone('triangle', 2093, 0, 0.16, 0.25, v * 0.6); },
    fanfare: () => { [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1046, .3, .12], [784, .44, .08], [1046, .54, .4]].forEach(([f, s, d]) => tone('square', f, 0, s, d, q));
                     [[131, 0, .3], [196, .3, .6]].forEach(([f, s, d]) => tone('triangle', f, 0, s, d, v * 0.8)); },
    delete:  () => tone('square', 600, 150, 0, 0.25, q * 0.8),
    scan:    () => { tone('square', 1568, 0, 0, 0.05, q * 0.8); tone('square', 2093, 0, 0.07, 0.06, q * 0.8); tone('square', 2093, 0, 0.16, 0.04, q * 0.3); },
    found:   () => { tone('square', 784, 1568, 0, 0.1, q); tone('square', 2093, 0, 0.12, 0.06, q * 0.8); tone('square', 2637, 0, 0.19, 0.12, q * 0.8); tone('triangle', 3136, 0, 0.3, 0.2, v * 0.4); },
    stamp:   () => { noise(0, 0.12, 0.5, 700); tone('triangle', 196, 98, 0, 0.12, v); tone('square', 1568, 0, 0.14, 0.08, q * 0.6); },
    whistle: () => { vib(2600, 0, 0.07, q * 0.9, 0, 0); vib(2700, 0.11, 0.32, q * 0.9, 28, 110); },
    flip:    () => { noise(0, 0.06, 0.25, 3000, 'highpass'); tone('triangle', 660, 990, 0.02, 0.08, v); },
    hint:    () => { tone('triangle', 988, 0, 0, 0.12, v); tone('triangle', 1318, 0, 0.13, 0.22, v); },
    start:   () => { [72, 76, 79, 84, 88, 91].forEach((m, i) => tone('square', hz(m), 0, i * 0.05, 0.06, q));    // 입장 "띠리링!"
                     [84, 88, 91].forEach(m => tone('triangle', hz(m), 0, 0.32, 0.5, v * 0.5));
                     tone('square', hz(83), 0, 0.32, 0.06, q * 0.7); tone('square', hz(88), 0, 0.38, 0.25, q * 0.7); }
  };
})();

function playSfx(name) {
  if (!Sfx.on) return;
  try { sfxCtx(); (SFX[name] || SFX.tap)(); } catch (e) { /* 소리 실패는 무시 */ }
}
const playStart = () => playSfx('start');

/* ---------- 시작 화면 대기 음악 B "두근두근 탐사" (6초 반복) ---------- */
const Bgm = {
  gain: null, timer: null,
  playing() { return !!this.gain; },
  start() {
    if (!Sfx.on || this.gain) return;
    try {
      const c = sfxCtx(), g = c.createGain(); g.gain.value = 0.55; g.connect(Sfx.out); this.gain = g;
      const st = 0.19, len = 32 * st;
      const note = (type, f, t, dur, vol) => {
        const o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vol, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(e).connect(g); o.start(t); o.stop(t + dur + 0.03);
      };
      const build = t0 => {
        [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]].forEach((ch, ci) => {
          const b = t0 + ci * 8 * st;
          for (let i = 0; i < 8; i++) note('square', hz(ch[0] - 12), b + i * st, st * 0.5, 0.028);
          [[0, 2], [3, 1], [6, 2]].forEach(([p, k]) => note('triangle', hz(ch[k] + 12), b + p * st, st * 2.5, 0.16));
        });
        note('square', hz(93), t0 + 28 * st, 0.05, 0.03); note('square', hz(98), t0 + 29 * st, 0.08, 0.03);
      };
      let t = c.currentTime + 0.05;
      const sched = () => { if (this.gain !== g) return; build(t); t += len; this.timer = setTimeout(sched, Math.max(50, (t - c.currentTime - 0.4) * 1000)); };
      sched();
    } catch (e) { this.gain = null; }
  },
  stop() {
    clearTimeout(this.timer); this.timer = null;
    if (this.gain) { const g = this.gain; try { g.gain.setTargetAtTime(0, Sfx.ctx.currentTime, 0.08); } catch (e) {} setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 700); }
    this.gain = null;
  }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) Bgm.stop(); });
