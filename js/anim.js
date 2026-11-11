/* =========================================================
   anim.js — 냥박사·수호냥 움직임 (2026-11-08)
   그림 여러 장을 번갈아 보여 주는 방식 (픽셀 아트 게임처럼)
   - 연구소 화면(S00~S38A)의 labChar() 그림에 자동으로 붙어요.
   - 약속 카드 이후 화면(S39~S48·팝업)은 <img data-anim="그림 이름">만 붙이면 저절로 움직여요.
     여백을 잘라 낸 그림(_m.png, 같은 묶음은 같은 크기)을 써요. (2026-11-09)
   - 화면이 바뀌어 그림이 사라지면 저절로 멈춰요.
   - 기기 설정에서 '동작 줄이기'를 켜면 움직이지 않아요.
   움직임 순서·빠르기는 아래 ANIM 표에서 고쳐요. [그림 이름, 보여 줄 시간(ms)]
   ========================================================= */
'use strict';

const ANIM = {
  /* 늘 하는 움직임: 숨쉬기 + 가끔 눈 깜빡 */
  nyang_idle:    { loop: [['nyang_idle', 700], ['nyang_idle_b', 700], ['nyang_idle', 700], ['nyang_idle_b', 700], ['nyang_idle', 500], ['nyang_idle_blink', 140], ['nyang_idle', 360], ['nyang_idle_b', 700]] },
  /* 약속 카드 이후 화면(S39~S47): 가리키기 숨쉬기 + 눈 깜빡 · 하트 들어 올리기 (11/9) */
  staff_guide:   { loop: [['staff_guide', 700], ['staff_guide_b', 700], ['staff_guide', 700], ['staff_guide_b', 700], ['staff_guide', 500], ['staff_guide_blink', 140], ['staff_guide', 360], ['staff_guide_b', 700]] },
  staff_heart:   { loop: [['staff_heart', 1100], ['staff_heart_b', 500], ['staff_heart', 260], ['staff_heart_b', 500]] },
  staff_base:    { loop: [['staff_base', 700], ['staff_base_b', 700], ['staff_base', 700], ['staff_base_b', 700], ['staff_base', 500], ['staff_base_blink', 140], ['staff_base', 360], ['staff_base_b', 700]] },

  /* 시작 화면: 손 흔들기 */
  nyang_welcome: { loop: [['nyang_welcome', 1500], ['nyang_wave_1', 200], ['nyang_welcome', 160], ['nyang_wave_2', 220], ['nyang_welcome', 160], ['nyang_wave_1', 200], ['nyang_welcome', 160], ['nyang_wave_2', 220]] },
  staff_hello:   { loop: [['staff_hello', 1700], ['staff_wave_1', 260], ['staff_hello', 220], ['staff_wave_1', 260], ['staff_hello', 220], ['staff_wave_1', 260]] },

  /* 스캔: 들어 올리기(처음 한 번) → 스캐너 불빛 깜빡 */
  nyang_scan:    { intro: [['nyang_idle', 260], ['nyang_scan_ready', 260]],
                   loop: [['nyang_scan', 1500], ['nyang_scan_nolight', 110], ['nyang_scan', 150], ['nyang_scan_nolight', 110]] },

  /* 이야기 화면(S01~S04 등): 인사 · 긁기 · 갸웃 · 설명 (그림요청서 v7 B1~B4, 11/9) */
  nyang_hello:   { loop: [['nyang_hello', 1300], ['nyang_hello_wave', 240], ['nyang_hello', 200], ['nyang_hello_wave', 240], ['nyang_hello', 200], ['nyang_hello_wave', 240]] },
  nyang_symptom: { loop: [['nyang_symptom', 900], ['nyang_symptom_b', 200], ['nyang_symptom', 200], ['nyang_symptom_b', 200], ['nyang_symptom', 200], ['nyang_symptom_b', 200]] },
  nyang_worry:   { loop: [['nyang_worry', 1500], ['nyang_worry_b', 1300]] },
  nyang_explain: { loop: [['nyang_explain', 1000], ['nyang_explain_b', 450], ['nyang_explain', 400], ['nyang_explain_b', 450]] },

  /* 기뻐할 때: 냥박사 폴짝 · 수호냥 깡충 */
  nyang_cheer:   { loop: [['nyang_cheer', 1400], ['nyang_cheer_b', 180], ['nyang_cheer', 500], ['nyang_cheer_b', 180]] },
  staff_cheer:   { loop: [['staff_cheer', 1300], ['staff_jump_1', 160], ['staff_jump_2', 320], ['staff_jump_1', 140], ['staff_cheer', 300], ['staff_jump_1', 160], ['staff_jump_2', 320], ['staff_jump_1', 140]] }
};

const Anim = {
  src: (k, sfx = '') => `assets/char/${k}${sfx}.png`,
  cache: {},
  reduced: () => false /* 11/11: Windows '애니메이션 효과'가 꺼져 있어도 태블릿과 똑같이 움직여요 */,

  /* 그림을 미리 불러 두기 (바꿔 끼울 때 깜빡이지 않게) */
  preload(keys, sfx = '') {
    return Promise.all(keys.map(k => this.cache[k + sfx] || (this.cache[k + sfx] = new Promise(res => {
      const im = new Image(); im.onload = im.onerror = () => res(); im.src = this.src(k, sfx);
    }))));
  },

  /* img 하나에 움직임 붙이기. 표에 없는 그림은 숨쉬기만 (CSS) */
  attach(img, key, holder, sfx = '') {
    const a = ANIM[key];
    if (holder && !holder.classList.contains('bob')) holder.classList.add('breathe');
    if (!a || this.reduced()) return;
    if (holder) holder.classList.remove('breathe');   // 그림으로 숨쉬기를 하면 CSS 숨쉬기는 빼요
    const intro = (holder && holder.classList.contains('no-intro')) ? [] : (a.intro || []);
    if (intro.length) img.src = this.src(intro[0][0], sfx);  // 처음 동작이 있으면 그 그림부터
    const keys = [...new Set([...intro, ...a.loop].map(([k]) => k))];
    this.preload(keys, sfx).then(() => {
      const steps = [...intro, ...a.loop];
      let i = 0;
      const tick = () => {
        if (!img.isConnected) return;                 // 화면이 바뀌면 멈춤
        const [k, ms] = steps[i];
        img.src = this.src(k, sfx);
        i = i + 1 < steps.length ? i + 1 : intro.length;   // 처음 동작은 한 번만, 나머지는 반복
        setTimeout(tick, ms);
      };
      tick();
    });
  }
};
window.Anim = Anim;

/* <img data-anim="staff_guide"> 가 화면에 나타나면 움직임 붙이기 (S39~ 화면·팝업 공통) */
(function () {
  const hook = el => {
    if (el.nodeType !== 1) return;
    const imgs = el.matches('img[data-anim]') ? [el] : [...el.querySelectorAll('img[data-anim]')];
    imgs.forEach(img => { if (img.dataset.animOn) return; img.dataset.animOn = '1'; Anim.attach(img, img.dataset.anim, null, '_m'); });
  };
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(hook))).observe(document.documentElement, { childList: true, subtree: true });
})();
