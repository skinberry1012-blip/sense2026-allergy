/* =========================================================
   lab.js — 냥박사의 알레르기 연구소 (S00 ~ S38A)  · 2026-11 새 그림 버전
   화면 = 1600×900 판 위에 배경 + 캐릭터 + 물건 + 픽셀 부품(버튼 A · 말풍선 B · 안내판 B · 결과 창 B)을 코드로 얹기
   데이터: data/lab-items.js (window.LAB)
   저장: promiseCard.labFound {home,school,ground} · promiseCard.labComplete (LocalStorage)
         카드·대처·기억 체크 진행은 앱 메모리(LabState)에만
   ========================================================= */
'use strict';

const LabState = { cardsSeen: [], copeSeen: { light: false, severe: false }, quizDone: false };
const LAB_REDUCED = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLACE_OF = { home: 'S06', school: 'S15', ground: 'S24' };
const IMG = {
  char: k => `assets/char/${k}.png`, item: k => `assets/item/${k}.png`, sym: k => `assets/sym/${k}.png`,
  cope: k => `assets/cope/${k}.png`, trophy: 'assets/medal/trophy.png'
};
const CH_AR = 700 / 504;   // 캐릭터 그림 비율 (모두 같은 크기·같은 발끝)

/* ---------- 저장 ---------- */
const LabFound = {
  get() { const f = Store.get('labFound', null) || {}; return { home: f.home || [], school: f.school || [], ground: f.ground || [] }; },
  add(place, item) { const f = LabFound.get(); if (!f[place].includes(item)) f[place].push(item); Store.set('labFound', f); },
  reset() { Store.set('labFound', { home: [], school: [], ground: [] }); LabState.cardsSeen = []; LabState.copeSeen = { light: false, severe: false }; LabState.quizDone = false; },
  count(place) { return LabFound.get()[place].length; },
  total() { const f = LabFound.get(); return f.home.length + f.school.length + f.ground.length; },
  firstMissing() { return ['home', 'school', 'ground'].find(p => LabFound.count(p) < 4); }
};

/* ---------- 글자: [ ] 파랑 · {{ }} 코랄 ---------- */
const labFmt = t => String(t).replace(/\{\{(.+?)\}\}/g, '<b class="lc">$1</b>').replace(/\[([^\]]+)\]/g, '<b class="lb">$1</b>');

/* 타이핑: 태그는 통째로, 글자는 하나씩 */
function labType(el, html, speed = 38) {
  const parts = html.match(/<[^>]+>|[^<]/g) || [];
  const total = parts.filter(p => p[0] !== '<').length;
  if (LAB_REDUCED()) { el.innerHTML = html; return () => {}; }
  let shown = 0, timer;
  const paint = () => { let n = 0, out = ''; for (const p of parts) { if (p[0] === '<') out += p; else if (n++ < shown) out += p; } el.innerHTML = out; };
  const step = () => { shown++; paint(); if (shown < total) timer = setTimeout(step, speed); };
  step();
  return () => { clearTimeout(timer); shown = total; paint(); };
}

/* ---------- 판(1600×900) 만들기: 화면 크기에 맞춰 확대·축소 ---------- */
function labBoard(app, bg, { dim = '', cls = '' } = {}) {
  app.classList.add('screen-lab');
  app.innerHTML = `
  <div class="lab ${cls}">
    <div class="lab-back" style="background-image:url(${bg})"></div>
    <div class="lab-board">
      <img class="lab-bgimg" src="${bg}" alt="" aria-hidden="true" draggable="false">
      ${dim ? `<div class="lab-dim ${dim}"></div>` : ''}
    </div>
  </div>`;
  const root = $('.lab', app), board = $('.lab-board', app);
  const fit = () => {
    const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
    const k = Math.min(w / 1600, h / 900);
    board.style.transform = `translate(${(w - 1600 * k) / 2}px, ${(h - 900 * k) / 2}px) scale(${k})`;
  };
  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(root); else window.addEventListener('resize', fit);
  return board;
}
function px(r) { return r ? `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px` : ''; }
function labEl(board, cls, r, html = '', tag = 'div', style = '') {
  const e = document.createElement(tag);
  e.className = cls; e.style.cssText = px(r) + ';' + style;
  if (tag === 'button') e.type = 'button';
  e.innerHTML = html; board.appendChild(e); return e;
}
/* 캐릭터: h = 그림 높이, pos = {left|right, bottom} */
function labChar(board, key, h, pos, cls = '') {
  const w = Math.round(h * CH_AR);
  const st = Object.entries(pos).map(([k, v]) => `${k}:${v}px`).join(';');
  const el = labEl(board, 'lab-char ' + cls, null, `<img src="${IMG.char(key)}" alt="" draggable="false">`, 'div', `${st};width:${w}px;height:${h}px`);
  if (window.Anim) Anim.attach($('img', el), key, el);   // 움직임 (js/anim.js)
  return el;
}
/* 버튼 A (픽셀 블록) */
function labBtn(board, label, style, cls = 'y', fn) {
  const b = labEl(board, 'px-btn ' + cls, null, `<span>${label}</span>`, 'button', style);
  if (fn) onTap(b, fn);
  return b;
}
/* 말풍선 B (픽셀 + 이름표) : tail = bl | br | l | r */
function labBubble(board, { x, y, w, name = '냥박사', staff = false, tail = 'bl', fs = 34 }) {
  const e = labEl(board, `px-bub tail-${tail}`, null,
    `<span class="px-name ${staff ? 's' : ''}">${name}</span><div class="px-bub-txt"></div><i class="t1"></i><i class="t2"></i>`,
    'div', `left:${x}px;top:${y}px;width:${w}px;font-size:${fs}px`);
  const t = $('.px-bub-txt', e);
  let skip = () => {};
  e.say = (line, type = true) => { skip(); const h = labFmt(line); if (type) skip = labType(t, h); else { t.innerHTML = h; skip = () => {}; } };
  e.addEventListener('click', () => skip());
  return e;
}
/* 안내판 B (연구실 화면) */
function labPanel(board, { x, y, w = null, sub = '', title, center = false, fs = 36 }) {
  const st = center ? `left:50%;top:${y}px;transform:translateX(-50%)` : `left:${x}px;top:${y}px`;
  return labEl(board, 'px-panel', null, `<div>${sub ? `<small>${sub}</small>` : ''}<b style="font-size:${fs}px">${labFmt(title)}</b></div>`, 'div', st + (w ? `;width:${w}px` : ''));
}
/* 모서리 표시 (스캔할 곳) */
const corners = () => '<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i>';

function labConfetti() {
  if (LAB_REDUCED()) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.style.pointerEvents = 'none';
  const cols = ['#E0663F', '#F5C842', '#2F4DA8', '#2F7A4F', '#BFE0FA'];
  for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * .6 + 's'; s.style.transform = `rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
  $('#layer').appendChild(box); setTimeout(() => box.remove(), 3200);
}
const labGo = (to, p = {}, o = {}) => Router.go(to, p, o);

/* ===================== S00 첫 화면 ===================== */
Router.screens.S00 = (app) => {
  const b = labBoard(app, LAB.bg.entrance, { cls: 'lab-s00' });
  labEl(b, 'lab-sign', [378, 222, 842, 172], `<div><span class="px-tag">냥박사의</span><b><em>알레르기</em> 연구소</b></div>`);
  labChar(b, 'nyang_welcome', 560, { left: -40, bottom: 22 });
  labChar(b, 'staff_hello', 470, { right: -10, bottom: 22 });   // 수호냥은 냥박사보다 조금 작게
  const go = labBtn(b, '입장하기 ›', 'left:50%;bottom:64px;transform:translateX(-50%);font-size:52px;padding:20px 64px 16px', 'y shine beat');
  /* 대기 음악: 첫 터치에 작게 시작 → [입장하기] 누르면 멈춤 (선생님 설정 '대기 음악 끄기'면 안 나옴) */
  const cfg = Config.get();
  const startBgm = () => { if (cfg.bgm !== false && Sfx.on) Bgm.start(); };
  b.addEventListener('pointerdown', e => { if (!e.target.closest('.px-btn')) startBgm(); }, { once: true });
  onTap(go, () => {
    Bgm.stop(); playSfx('start');
    replay(go, 'pop');
    setTimeout(() => labGo('S01'), LAB_REDUCED() ? 0 : 420);
  });
};

/* ===================== S01~S04 이야기 ===================== */
Object.entries(LAB.story).forEach(([key, d], i) => {
  Router.screens[key] = (app) => {
    Bgm.stop();
    const b = labBoard(app, LAB.bg.lab, { dim: 'soft-r' });
    labEl(b, 'px-chip', null, `이야기 ${i + 1} / 4`, 'div', 'left:28px;top:26px');
    labChar(b, d.pose, 640, { left: -90, bottom: 8 }, 'bob');
    const bub = labBubble(b, { x: 700, y: 150, w: 820, fs: 42, tail: 'bl' });
    bub.say(d.line);
    labBtn(b, d.label || '다음 ›', 'right:56px;bottom:62px;font-size:38px', 'y', () => { playSfx('next'); labGo(d.go); });
  };
});

/* ===================== S05 활동 선택 ===================== */
Router.screens.S05 = (app) => {
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  labPanel(b, { y: 34, title: '무엇부터 시작할까요?', center: true, fs: 40 });
  const card = (x, cls, title, sub, pose, go, reset) => {
    const c = labEl(b, 'lab-choice ' + cls, [x, 150, 680, 680], `
      <div class="ch-img"><img src="${IMG.char(pose)}" alt=""></div>
      <b>${title}</b><small>${sub}</small>
      <span class="px-btn ${cls === 'blue' ? 'y' : 'y'}"><span>시작하기 ›</span></span>`, 'button');
    onTap(c, () => { playSfx('next'); replay(c, 'pop'); if (reset) LabFound.reset(); labGo(go); });
  };
  card(90, 'blue', '알레르기 완벽 파악', '유발 물질 확인하기', 'nyang_scan', 'S06', true);
  card(830, 'coral', '나만의 알레르기 방패', '예방 약속 만들기', 'staff_guide', 'S39', false);
};

/* ===================== 장소 (S06 집 · S15 급식실 · S24 운동장) ===================== */
Object.entries(LAB.places).forEach(([place, d]) => {
  Router.screens[d.scene] = (app, p) => {
    const b = labBoard(app, LAB.bg[place]);
    const found = LabFound.get()[place], n = found.length;
    const pan = labPanel(b, { x: 28, y: 24, sub: `연구 과제 ${d.no} · ${d.name}`, title: '숨은 알레르기 원인 4가지 찾기', fs: 34 });
    /* 장소 미션 3가지 표시 (집 3-1 · 급식실 3-2 · 운동장 3-3) */
    const PICON = { home: '🏠', school: '🍴', ground: '⚽' };
    $('div', pan).insertAdjacentHTML('beforeend', `<span class="px-steps">${Object.entries(LAB.places).map(([k, q]) =>
      `<i class="${k === place ? 'cur' : ''} ${LabFound.count(k) >= 4 ? 'ok' : ''}">${PICON[k]} ${q.name} 3-${q.no}${LabFound.count(k) >= 4 ? ' ✓' : ''}</i>`).join('')}</span>`);
    labEl(b, 'px-chip big', null, `찾은 원인 <b class="lc">${n}</b> / 4`, 'div', 'right:190px;top:26px');
    const hint = labEl(b, 'px-icon y', null, '<svg viewBox="0 0 24 24" fill="none" stroke="#1E2A5A" stroke-width="2.5"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z"/></svg>', 'button', 'right:104px;top:26px');
    hint.setAttribute('aria-label', '힌트');
    /* 스캔할 곳 */
    const spots = d.points.map((pt, i) => {
      const done = found.includes(pt.item);
      const inner = pt.mite
        ? `<span class="mites">${Array.from({ length: 16 }, (_, k) => `<i style="left:${8 + (k * 37) % 84}%;top:${12 + (k * 53) % 76}%;animation-delay:${(k % 5) * .18}s"></i>`).join('')}<em></em><em></em><em></em></span>`
        : `<img src="${IMG.item(pt.img || pt.item)}" alt="">`;
      const s = labEl(b, 'lab-spot' + (done ? ' done' : ' pulse') + (pt.mite ? ' mite' : ''), pt.r,
        `${inner}${corners()}${done ? '<span class="stamp">발견</span>' : ''}`, 'button');
      s.setAttribute('aria-label', done ? `${LAB.items[pt.item]} 다시 보기` : '스캔하기');
      s.style.animationDelay = (i * 0.2) + 's';
      onTap(s, () => { playSfx('scan'); labGo(pt.go); });
      if (p.just === pt.item) { replay($('.stamp', s), 'stamp-in'); setTimeout(() => playSfx('stamp'), 120); }
      return s;
    });
    /* 꾸밈 그림 (꽃밭 앞 풀 덤불 등) — 스캔할 곳보다 앞, 누르면 뒤의 물건이 눌림 */
    ((LAB.deco || {})[place] || []).forEach(([src, x, y, w, h]) => labEl(b, 'lab-deco', [x, y, w, h], `<img src="${src}" alt="" draggable="false">`));
    /* 찾은 원인 칸 */
    const tray = labEl(b, 'lab-tray', [300, 742, 1000, 140]);
    d.points.forEach(pt => {
      const done = found.includes(pt.item);
      const slot = document.createElement('div');
      slot.className = 'tray-slot' + (done ? ' done' : '');
      slot.innerHTML = `<div class="ts-box">${done ? `<img src="${IMG.item(pt.item)}" alt="">` : '<span>?</span>'}</div><b>${done ? LAB.items[pt.item] : '???'}</b>`;
      if (p.just === pt.item) replay(slot, 'pop');
      tray.appendChild(slot);
    });
    onTap(hint, () => {
      const i = d.points.findIndex(pt => !found.includes(pt.item));
      if (i < 0) return;
      playSfx('hint'); spots.forEach(s => s.classList.remove('glow')); replay(spots[i], 'glow');
      setTimeout(() => spots[i].classList.remove('glow'), 3000);
    });
    if (n >= 4) {
      setTimeout(() => { if (Router.current && Router.current.s === d.scene) labDone(app, d.done); }, p.just ? 900 : 300);
      labBtn(b, LAB.done[d.done].label, 'left:28px;top:160px;font-size:28px', 'y', () => { playSfx('tap'); labDone(app, d.done); });
    }
  };
});

/* ===================== 관찰 (S07 …) ===================== */
Object.entries(LAB.observe).forEach(([key, d]) => {
  Router.screens[key] = (app) => {
    const b = labBoard(app, LAB.bg[d.place], { dim: 'navy' });
    playSfx('scan');
    labChar(b, 'nyang_scan', 600, { right: -70, bottom: 0 });
    const bub = labBubble(b, { x: 90, y: 54, w: 820, fs: 40, tail: 'br' });
    bub.say(d.line);
    const lens = labEl(b, 'lab-lens pulse', [250, 300, 470, 470], `<img src="${IMG.item(d.item)}" alt="${LAB.items[d.item]}">${corners()}`, 'button');
    lens.setAttribute('aria-label', LAB.items[d.item] + ' 눌러 보기');
    let busy = false;
    onTap(lens, () => {
      if (busy) return; busy = true;
      playSfx('found'); lens.classList.add('flash');
      setTimeout(() => labGo(d.next), LAB_REDUCED() ? 0 : 520);
    });
  };
});

/* ===================== 스캔 결과 창 = 증상과 예방법 (S08 …) ===================== */
Object.entries(LAB.info).forEach(([key, d]) => {
  Router.screens[key] = (app) => {
    const b = labBoard(app, LAB.bg[d.place], { dim: 'navy' });
    playSfx('open');
    labChar(b, 'nyang_scan', 560, { left: -120, bottom: 0 }, 'no-intro');
    const win = labEl(b, 'lab-result', [600, 26, 950, 848], `
      <div class="rs-light"></div>
      <div class="rs-screen">
        <div class="rs-head"><img src="${IMG.item(d.item)}" alt=""><div><small>발견! 알레르기 원인</small><b>${LAB.items[d.item]}</b></div></div>
        <div class="rs-box"><h3 class="lc">이런 증상이 나타날 수 있어요</h3>
          <div class="rs-syms">${d.syms.map(([s, l]) => `<div><span class="sym-c"><img src="${IMG.sym(s)}" alt=""></span><b>${l}</b></div>`).join('')}</div></div>
        <div class="rs-box"><h3 class="lg">예방법</h3><ul>${d.tips.map(t => `<li>${labFmt(t)}</li>`).join('')}</ul></div>
      </div>
      <i class="rs-dot"></i>`);
    const lis = $$('li', win);
    const ok = labBtn(b, '알겠어요! ✓', 'right:88px;bottom:96px;font-size:34px', 'y');
    ok.hidden = true;
    const timers = [];
    const showAll = () => { timers.forEach(clearTimeout); lis.forEach(li => li.classList.add('on')); ok.hidden = false; };
    if (LAB_REDUCED()) showAll();
    else {
      lis.forEach((li, i) => timers.push(setTimeout(() => { li.classList.add('on'); playSfx('tap'); }, 700 + i * 600)));
      timers.push(setTimeout(showAll, 700 + lis.length * 600 + 200));
    }
    win.addEventListener('click', showAll);
    onTap(ok, () => { playSfx('check'); LabFound.add(d.place, d.item); labGo(PLACE_OF[d.place], { just: d.item }, { replace: true }); });
  };
});

/* ===================== 장소 완료 (S14A · S23A · S33) : 판 위에 뜨는 창 ===================== */
function labDone(app, key) {
  const d = LAB.done[key], name = LAB.places[d.place].name;
  const b = $('.lab-board', app); if (!b || $('.lab-pop', b)) return;
  playSfx('fanfare'); labConfetti();
  const w = labEl(b, 'lab-pop', null, `
    <div class="pop-card">
      <span class="pop-ribbon">장소별 연구 - ${name} - 완료!</span>
      <img class="pop-trophy" src="${IMG.trophy}" alt="">
      <p>${name}에서 알레르기 유발물질<br><b class="lc">4가지</b>를 모두 찾았어!</p>
    </div>`);
  replay($('.pop-card', w), 'pop');
  labChar(w, 'nyang_cheer', 380, { left: 150, bottom: 40 });
  labChar(w, 'staff_cheer', 380, { right: 150, bottom: 40 });
  setTimeout(() => playSfx('whistle'), 900);
  labBtn(w, d.label, 'left:50%;bottom:70px;transform:translateX(-50%);font-size:36px', 'y beat', () => {
    playSfx('next');
    if (d.next === 'S36-1' && LabFound.total() < 12) return labGo(PLACE_OF[LabFound.firstMissing()]);
    labGo(d.next);
  });
}

/* ===================== S36-1 연구 완료 축하 ===================== */
function labNeed12() { if (LabFound.total() >= 12) return false; labGo(PLACE_OF[LabFound.firstMissing()], {}, { replace: true }); return true; }
Router.screens['S36-1'] = (app) => {
  if (labNeed12()) return;
  Store.set('labComplete', true);
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  playSfx('fanfare'); labConfetti();
  labPanel(b, { y: 30, title: '냥박사의 알레르기 연구소', center: true, fs: 34 });
  const c = labEl(b, 'lab-cheer', [450, 150, 700, 470], `<img src="${IMG.trophy}" alt=""><p>와! 알레르기 유발물질<br><b class="lc big">12가지</b>를 모두 찾았어!</p>`);
  replay(c, 'pop');
  labChar(b, 'nyang_cheer', 520, { left: -50, bottom: 20 });
  labChar(b, 'staff_cheer', 520, { right: -70, bottom: 20 });
  setTimeout(() => playSfx('whistle'), 1000);
  labBtn(b, '다음 ›', 'left:50%;bottom:70px;transform:translateX(-50%);font-size:40px', 'y beat', () => { playSfx('next'); labGo('S36-2'); });
};

/* ===================== S36-2 증상 카드 안내 ===================== */
Router.screens['S36-2'] = (app) => {
  if (labNeed12()) return;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  labPanel(b, { y: 30, title: '냥박사의 알레르기 연구소', center: true, fs: 34 });
  labEl(b, 'lab-cheer guide', [440, 170, 720, 440], `<p>이제 [알레르기 증상 카드 7개]를<br>하나씩 눌러 보자!</p><small>증상을 모두 확인한 다음,<br>{{대처 방법}}도 함께 알아보자!</small>`.replace(/\[([^\]]+)\]/g, '<b class="lb">$1</b>').replace(/\{\{(.+?)\}\}/g, '<b class="lc">$1</b>'));
  labChar(b, 'nyang_explain', 520, { left: -50, bottom: 20 });
  labChar(b, 'staff_guide', 520, { right: -70, bottom: 20 });
  labBtn(b, '알겠어요! ›', 'left:50%;bottom:90px;transform:translateX(-50%);font-size:40px', 'y', () => { playSfx('next'); labGo('S36-3'); });
};

/* ===================== S36-3 증상 카드 (뒤집기) ===================== */
Router.screens['S36-3'] = (app) => {
  if (labNeed12()) return;
  const C = LAB.cards;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  labEl(b, 'cope-band sky', null, '알레르기 증상 카드', 'div', 'left:50%;top:34px;transform:translateX(-50%)');   // 대처 방법 화면과 같은 띠 모양 (11/9)
  const cnt = labEl(b, 'px-chip big', null, '', 'div', 'right:104px;top:30px');
  let sel = null, lockTimer;
  const cards = C.list.map((c, i) => {
    /* 2줄 배치 (11/9): 오른쪽에 4장 + 3장(가운데 맞춤), 왼쪽은 냥박사와 말풍선 */
    const CW = 214, GAP = 30, X0 = 600, row = i < 4 ? 0 : 1, col = row ? i - 4 : i;
    const e = labEl(b, 'lab-card', [X0 + col * (CW + GAP) + (row ? (CW + GAP) / 2 : 0), 162 + row * 266, CW, 246], `
      <span class="cd-front"><span class="sym-c"><img src="${IMG.sym(c.id)}" alt=""></span><b class="cd-name"><i>?</i><em>${c.label}</em></b></span>`, 'button');
    e.setAttribute('aria-label', '증상 카드');
    onTap(e, () => pick(c.id));
    return e;
  });
  labChar(b, 'nyang_explain', 430, { left: -20, bottom: 6 });
  const bub = labBubble(b, { x: 40, y: 170, w: 520, fs: 34, tail: 'bl' });   // 2줄 배치: 왼쪽 위 (11/9)
  bub.classList.add('bal');
  const lineFor = n => n >= 7 ? C.lines[7] : n >= 2 ? C.lines[2] : C.lines[n];
  const bl = labBtn(b, '<i class="lk">🔒</i> 가벼운 증상 대처 방법 ›', 'left:640px;bottom:58px;font-size:28px', 'y');
  const bs = labBtn(b, '<i class="lk">🔒</i> 위급한 증상 대처 방법 ›', 'left:1080px;bottom:58px;font-size:28px', 'c');
  bl.dataset.type = 'light'; bs.dataset.type = 'severe';
  [[bl, 'S37'], [bs, 'S38']].forEach(([btn, go]) => onTap(btn, () => {
    if (LabState.cardsSeen.length < 7) { playSfx('full'); replay(btn, 'shake'); clearTimeout(lockTimer); bub.say(C.lines.lock, false); lockTimer = setTimeout(() => bub.say(lineFor(LabState.cardsSeen.length), false), 2000); return; }
    playSfx('tap'); labGo(go);
  }));
  const paint = (fresh) => {
    const seen = LabState.cardsSeen, all = seen.length >= 7;
    cnt.innerHTML = `확인 <b class="lc">${seen.length}</b> / 7`;
    cards.forEach((e, i) => { const id = C.list[i].id; e.classList.toggle('seen', seen.includes(id)); e.classList.toggle('sel', sel === id); });
    [bl, bs].forEach(x => { x.classList.toggle('off', !all); x.classList.toggle('did', LabState.copeSeen[x.dataset.type]); x.setAttribute('aria-disabled', String(!all)); });
    if (fresh && all) [bl, bs].forEach((x, i) => setTimeout(() => replay(x, 'pop'), 300 + i * 150));
  };
  function pick(id) {
    const first = !LabState.cardsSeen.includes(id);
    sel = id; playSfx(first ? 'flip' : 'tap');
    if (first) LabState.cardsSeen.push(id);
    const n = LabState.cardsSeen.length;
    if (first && n === 7) { setTimeout(() => { sel = null; playSfx('check'); bub.say(C.lines[7], false); paint(true); }, 400); }
    else bub.say(lineFor(n), false);
    paint(false);
  }
  bub.say(lineFor(LabState.cardsSeen.length)); paint(false);
  if (!LabState.cardsSeen.length) cards.forEach((e, i) => { e.style.animationDelay = i * 0.08 + 's'; replay(e, 'pop'); });
};

/* ===================== S37 · S38 대처 방법 (수호냥 없음) ===================== */
['S37', 'S38'].forEach(key => {
  Router.screens[key] = (app) => {
    if (labNeed12()) return;
    if (LabState.cardsSeen.length < 7) return labGo('S36-3', {}, { replace: true });
    const d = LAB.cope[key];
    const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-cope ' + d.type });
    LabState.copeSeen[d.type] = true;
    labEl(b, 'cope-band', null, labFmt(d.title), 'div', 'left:50%;top:34px;transform:translateX(-50%)');
    const steps = d.steps.map(([img, label], i) => {
      const s = labEl(b, 'cope-step', [110 + i * 480, 150, 420, 520], `<span class="num">${i + 1}</span><img src="${IMG.cope(img)}" alt=""><b>${label}</b>`);
      if (i < 2) labEl(b, 'cope-arrow', null, '›', 'div', `left:${110 + i * 480 + 420 + 13}px;top:384px`);   // 카드 사이 한가운데
      return s;
    });
    const back = labBtn(b, '‹ 증상 카드로', 'left:110px;bottom:56px;font-size:32px', 'w', () => { playSfx('tap'); labGo('S36-3'); });
    const right = labBtn(b, '', 'right:110px;bottom:56px;font-size:32px', 'y');
    const both = () => LabState.copeSeen.light && LabState.copeSeen.severe;
    const paintRight = () => {
      if (!both()) { right.className = 'px-btn ' + (d.type === 'light' ? 'c' : 'y'); $('span', right).innerHTML = d.otherLabel; }
      else { right.className = 'px-btn b beat'; $('span', right).innerHTML = LabState.quizDone ? '방패 만들러 가기 ›' : '기억 체크하기 ›'; }
    };
    let shown = false;
    [back, right].forEach(x => x.classList.add('hide'));
    const reveal = () => { if (shown) return; shown = true; paintRight(); [back, right].forEach(x => x.classList.remove('hide')); if (both()) { playSfx('check'); replay(right, 'pop'); } };
    if (LAB_REDUCED()) reveal();
    else { steps.forEach((s, i) => setTimeout(() => { replay(s, 'glow'); playSfx('tap'); }, 500 + i * 700)); setTimeout(reveal, 500 + steps.length * 700); }
    b.addEventListener('click', e => { if (!e.target.closest('.px-btn')) reveal(); });
    onTap(right, () => {
      playSfx('tap');
      if (!both()) return labGo(d.other);
      if (!LabState.quizDone) return labGo('S38A');
      Store.set('labComplete', true); labGo('S39');
    });
  };
});

/* ===================== S38A 기억 체크 (끌어 놓기 + 누르고-누르기) ===================== */
Router.screens.S38A = (app) => {
  if (labNeed12()) return;
  if (!(LabState.copeSeen.light && LabState.copeSeen.severe)) return labGo('S36-3', {}, { replace: true });
  const Q = LAB.quiz;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-quiz' });
  playSfx('open');
  labPanel(b, { y: 20, title: '기억 체크!', center: true, fs: 38 });
  const title = labEl(b, 'quiz-sub', null, '그림을 알맞은 자리에 끼워 보세요!', 'div', 'left:0;right:0;top:132px');
  /* 섞은 자리 */
  const PW = 210, PH = 236, PY = 192, xs = Q.pieces.map((_, i) => 70 + i * (PW + 28));
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
  xs.forEach(x => labEl(b, 'quiz-tray', [x, PY, PW, PH]));
  /* 빈 칸 */
  const slots = {}, SW = 190, SH = 200, SY = 566;
  [['light', '가벼운 증상 대처', 70], ['severe', '위급한 증상 대처', 830]].forEach(([t, label, gx]) => {
    labEl(b, 'quiz-group ' + t, [gx, SY - 78, 700, SH + 104], `<span>${label}</span>`);
    for (let i = 0; i < 3; i++) {
      const id = `${t}-${i}`, x = gx + 26 + i * (SW + 34);
      slots[id] = labEl(b, 'quiz-slot', [x, SY, SW, SH], `<em>${i + 1}</em>`); slots[id].dataset.id = id;
      if (i < 2) labEl(b, 'quiz-arrow', null, '›', 'div', `left:${x + SW + 6}px;top:${SY + 70}px`);
    }
  });
  const home = {}; let placed = 0, selected = null;
  const pieces = Q.pieces.map((p, i) => {
    const r = [xs[i], PY, PW, PH]; home[p.id] = r;
    const e = labEl(b, 'quiz-piece', r, `<img src="${IMG.cope(p.img)}" alt="" draggable="false"><b>${p.label}</b>`, 'button');
    e.dataset.id = p.id; e.setAttribute('aria-label', p.label);
    e.style.animationDelay = i * 0.08 + 's'; replay(e, 'pop');
    return e;
  });
  const ok = labBtn(b, '방패 만들러 가기 ›', 'left:50%;bottom:22px;transform:translateX(-50%);font-size:34px', 'b beat');
  ok.hidden = true;

  const scale = () => b.getBoundingClientRect().width / 1600;
  const toBoard = (cx, cy) => { const r = b.getBoundingClientRect(), k = r.width / 1600; return [(cx - r.left) / k, (cy - r.top) / k]; };
  const slotAt = (x, y) => Object.values(slots).find(s => {
    if (s.classList.contains('full')) return false;
    const l = parseFloat(s.style.left), t = parseFloat(s.style.top), w = parseFloat(s.style.width), h = parseFloat(s.style.height);
    return x >= l - 30 && x <= l + w + 30 && y >= t - 40 && y <= t + h + 40;
  });
  const setR = (e, r) => { e.style.left = r[0] + 'px'; e.style.top = r[1] + 'px'; e.style.width = r[2] + 'px'; e.style.height = r[3] + 'px'; };
  const place = (e, s) => {
    setR(e, [parseFloat(s.style.left), parseFloat(s.style.top), parseFloat(s.style.width), parseFloat(s.style.height)]);
    e.classList.add('placed'); e.classList.remove('sel'); e.disabled = true;
    s.classList.add('full', 'ok'); playSfx('check'); replay(e, 'pop'); placed++;
    if (placed === 6) finish();
  };
  const wrong = (e, s) => { if (s) replay(s, 'shake'); playSfx('uncheck'); setR(e, home[e.dataset.id]); e.classList.remove('sel'); };
  const tryDrop = (e, s) => { if (!s) return wrong(e, null); if (s.dataset.id === e.dataset.id) place(e, s); else wrong(e, s); };

  pieces.forEach(e => {
    let start = null, moved = false;
    e.addEventListener('pointerdown', ev => {
      if (e.disabled) return;
      ev.preventDefault(); e.setPointerCapture(ev.pointerId);
      start = { x: ev.clientX, y: ev.clientY, l: parseFloat(e.style.left), t: parseFloat(e.style.top), k: scale() }; moved = false;
      e.classList.add('drag');
    });
    e.addEventListener('pointermove', ev => {
      if (!start) return;
      const dx = (ev.clientX - start.x) / start.k, dy = (ev.clientY - start.y) / start.k;
      if (Math.abs(dx) + Math.abs(dy) > 12) moved = true;
      e.style.left = start.l + dx + 'px'; e.style.top = start.t + dy + 'px';
    });
    const end = ev => {
      if (!start) return;
      e.classList.remove('drag'); start = null;
      if (moved) { const [x, y] = toBoard(ev.clientX, ev.clientY); tryDrop(e, slotAt(x, y)); }
      else {
        setR(e, home[e.dataset.id]);
        if (selected === e) { selected = null; e.classList.remove('sel'); }
        else { pieces.forEach(p => p.classList.remove('sel')); selected = e; e.classList.add('sel'); playSfx('tab'); }
      }
    };
    e.addEventListener('pointerup', end); e.addEventListener('pointercancel', end);
  });
  Object.values(slots).forEach(s => s.addEventListener('click', () => {
    if (!selected || s.classList.contains('full')) return;
    const e = selected; selected = null; tryDrop(e, s);
  }));
  function finish() {
    LabState.quizDone = true; Store.set('labComplete', true);
    setTimeout(() => {
      playSfx('fanfare'); labConfetti();
      title.textContent = Q.doneText; replay(title, 'pop');
      Object.values(slots).forEach(s => replay(s, 'glow'));
      ok.hidden = false; replay(ok, 'pop');
    }, 350);
  }
  onTap(ok, () => { playSfx('next'); labGo('S39'); });
};
