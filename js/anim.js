/* =========================================================
   anim.js — 냥박사·수호냥 움직임 (2026-11-08)
   그림 여러 장을 번갈아 보여 주는 방식 (픽셀 아트 게임처럼)
   - 연구소 화면(S00~S38A)의 labChar() 그림에 자동으로 붙어요.
   - 화면이 바뀌어 그림이 사라지면 저절로 멈춰요.
   - 기기 설정에서 '동작 줄이기'를 켜면 움직이지 않아요.
   움직임 순서·빠르기는 아래 ANIM 표에서 고쳐요. [그림 이름, 보여 줄 시간(ms)]
   ========================================================= */
'use strict';

const ANIM = {
  /* 늘 하는 움직임: 숨쉬기 + 가끔 눈 깜빡 */
  nyang_idle:    { loop: [['nyang_idle', 700], ['nyang_idle_b', 700], ['nyang_idle', 700], ['nyang_idle_b', 700], ['nyang_idle', 500], ['nyang_idle_blink', 140], ['nyang_idle', 360], ['nyang_idle_b', 700]] },
  staff_base:    { loop: [['staff_base', 700], ['staff_base_b', 700], ['staff_base', 700], ['staff_base_b', 700], ['staff_base', 500], ['staff_base_blink', 140], ['staff_base', 360], ['staff_base_b', 700]] },

  /* 시작 화면: 손 흔들기 */
  nyang_welcome: { loop: [['nyang_welcome', 1500], ['nyang_wave_1', 200], ['nyang_welcome', 160], ['nyang_wave_2', 220], ['nyang_welcome', 160], ['nyang_wave_1', 200], ['nyang_welcome', 160], ['nyang_wave_2', 220]] },
  staff_hello:   { loop: [['staff_hello', 1700], ['staff_wave_1', 260], ['staff_hello', 220], ['staff_wave_1', 260], ['staff_hello', 220], ['staff_wave_1', 260]] },

  /* 스캔: 들어 올리기(처음 한 번) → 스캐너 불빛 깜빡 */
  nyang_scan:    { intro: [['nyang_idle', 260], ['nyang_scan_ready', 260]],
                   loop: [['nyang_scan', 1500], ['nyang_scan_nolight', 110], ['nyang_scan', 150], ['nyang_scan_nolight', 110]] },

  /* 기뻐할 때: 냥박사 폴짝 · 수호냥 깡충 */
  nyang_cheer:   { loop: [['nyang_cheer', 1400], ['nyang_cheer_b', 180], ['nyang_cheer', 500], ['nyang_cheer_b', 180]] },
  staff_cheer:   { loop: [['staff_cheer', 1300], ['staff_jump_1', 160], ['staff_jump_2', 320], ['staff_jump_1', 140], ['staff_cheer', 300], ['staff_jump_1', 160], ['staff_jump_2', 320], ['staff_jump_1', 140]] }
};

const Anim = {
  src: k => `assets/char/${k}.png`,
  cache: {},
  reduced: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  /* 그림을 미리 불러 두기 (바꿔 끼울 때 깜빡이지 않게) */
  preload(keys) {
    return Promise.all(keys.map(k => this.cache[k] || (this.cache[k] = new Promise(res => {
      const im = new Image(); im.onload = im.onerror = () => res(); im.src = this.src(k);
    }))));
  },

  /* img 하나에 움직임 붙이기. 표에 없는 그림은 숨쉬기만 (CSS) */
  attach(img, key, holder) {
    const a = ANIM[key];
    if (holder && !holder.classList.contains('bob')) holder.classList.add('breathe');
    if (!a || this.reduced()) return;
    if (holder) holder.classList.remove('breathe');   // 그림으로 숨쉬기를 하면 CSS 숨쉬기는 빼요
    const intro = (holder && holder.classList.contains('no-intro')) ? [] : (a.intro || []);
    if (intro.length) img.src = this.src(intro[0][0]);  // 처음 동작이 있으면 그 그림부터
    const keys = [...new Set([...intro, ...a.loop].map(([k]) => k))];
    this.preload(keys).then(() => {
      const steps = [...intro, ...a.loop];
      let i = 0;
      const tick = () => {
        if (!img.isConnected) return;                 // 화면이 바뀌면 멈춤
        const [k, ms] = steps[i];
        img.src = this.src(k);
        i = i + 1 < steps.length ? i + 1 : intro.length;   // 처음 동작은 한 번만, 나머지는 반복
        setTimeout(tick, ms);
      };
      tick();
    });
  }
};
window.Anim = Anim;
