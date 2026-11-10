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
/* 말풍선을 말하는 캐릭터에 붙이기 (11/9): bottom = 판 아래에서 말풍선 아래까지, tailX = 꼬리 위치(말풍선 왼쪽에서) */
function labBubbleAt(bub, { bottom, tailX }) {
  bub.style.top = 'auto'; bub.style.bottom = bottom + 'px';
  if (tailX != null) { const t1 = $('.t1', bub), t2 = $('.t2', bub); t1.style.left = tailX + 'px'; t1.style.right = 'auto'; t2.style.left = (tailX - 22) + 'px'; t2.style.right = 'auto'; }
  return bub;
}
function labBubble(board, { x, y, w, name = '냥박사', staff = false, tail = 'bl', fs = 34 }) {
  const e = labEl(board, `px-bub tail-${tail}`, null,
    `<span class="px-name ${staff ? 's' : ''}">${name}</span><div class="px-bub-txt"></div><i class="t1"></i><i class="t2"></i>`,
    'div', `left:${x}px;top:${y}px;width:${w}px;font-size:${fs}px`);
  const t = $('.px-bub-txt', e);
  let skip = () => {};
  /* 글 길이에 맞춰 말풍선 폭 줄이기 (11/9): 다 쓴 글을 미리 재서 폭을 정해요, w는 가장 넓을 때 */
  const fit = h => {
    const m = document.createElement('div'); m.className = 'px-bub-txt';
    m.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;width:max-content;max-width:${w - 62}px;font-size:${fs}px;line-height:1.5;letter-spacing:-.02em`;
    m.innerHTML = h; board.appendChild(m); const mw = m.offsetWidth; m.remove();   // 확대·축소와 상관없는 실제 폭 (잰 뒤 지우기)
    e.style.width = Math.max(240, Math.min(w, mw + 62 + 4)) + 'px';
  };
  e.say = (line, type = true) => { skip(); const h = labFmt(line); fit(h); if (type) skip = labType(t, h); else { t.innerHTML = h; skip = () => {}; } };
  e.addEventListener('click', () => skip());
  return e;
}
/* 안내판 B (연구실 화면) */
function labPanel(board, { x, y, w = null, sub = '', title, center = false, fs = 36 }) {
  /* 11/10: 제목은 모든 화면 왼쪽 위 같은 자리 (A-1 두 겹 테두리 · 주아 진하게). 진행 숫자 등은 오른쪽 위 */
  const st = 'left:34px;top:30px';
  return labEl(board, 'px-panel', null, `<div>${sub ? `<small>${sub}</small>` : ''}<b>${labFmt(title)}</b></div>`, 'div', st + (w ? `;width:${w}px` : ''));
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
  labChar(b, 'staff_hello', 530, { right: -20, bottom: 22 });   // 머리·모자가 커서 냥박사의 약 0.95배로 맞춰요 (11/9)
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
    labEl(b, 'sym-cnt top-cnt', null, `이야기 <b class="lc">${i + 1}</b> / 4`, 'div', 'right:40px;top:40px');   // 진행 숫자는 오른쪽 위 (11/10)
    labChar(b, d.pose, 640, { left: 30, bottom: 8 }, 'bob');   // 이전·처음 버튼과 안 겹치게 오른쪽으로 (11/10)
    const bub = labBubble(b, { x: 680, y: 230, w: 860, fs: 42, tail: 'l' });   // 냥박사 얼굴 옆에 붙임 (11/9)
    bub.say(d.line);
    labBtn(b, d.label || '다음 ›', 'right:56px;bottom:62px;font-size:38px', 'y', () => { playSfx('next'); labGo(d.go); });
  };
});

/* ===================== S05 활동 선택 ===================== */
Router.screens.S05 = (app) => {
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  labPanel(b, { title: '연구소 미션 고르기' });
  const card = (x, cls, title, sub, pose, go, reset) => {
    const c = labEl(b, 'lab-choice ' + cls, [x, 190, 560, 620], `
      <div class="ch-img"><img src="${IMG.char(pose)}" alt=""></div>
      <b>${title}</b><small>${sub}</small>
      <span class="px-btn ${cls === 'blue' ? 'y' : 'y'}"><span>시작하기 ›</span></span>`, 'button');
    onTap(c, () => { playSfx('next'); replay(c, 'pop'); if (reset) LabFound.reset(); labGo(go); });
  };
  /* 카드 두 장: 고르는 단위가 한눈에 보이게 상자는 두고, 크기를 줄이고 모서리를 둥글게 (11/10) */
  card(210, 'blue', '알레르기 완벽 파악', '유발 물질 확인하기', 'nyang_scan', 'S06', true);
  card(830, 'coral', '나만의 알레르기 방패', '예방 약속 만들기', 'staff_guide', 'S39', false);
};

/* ===================== 장소 (S06 집 · S15 급식실 · S24 운동장) ===================== */
Object.entries(LAB.places).forEach(([place, d]) => {
  Router.screens[d.scene] = (app, p) => {
    const b = labBoard(app, LAB.bg[place]);
    const found = LabFound.get()[place], n = found.length;
    const pan = labPanel(b, { title: '숨은 알레르기 원인 4가지 찾기' });
    pan.classList.add('place-panel');
    /* 미션 3곳 (11/10): 위 칩은 빼고, 아래 배지에 번호 ①②③ — 끝낸 곳은 ✓, 지금 장소는 테두리. 제목 폭보다 살짝 좁게 고르게 */
    $('div', pan).insertAdjacentHTML('beforeend', `<span class="px-steps">${Object.entries(LAB.places).map(([k, q], j) => {
      const ok = LabFound.count(k) >= 4;
      return `<i class="pl-${k} ${k === place ? 'cur' : ''} ${ok ? 'ok' : ''}"><span class="no">${ok ? '✓' : j + 1}</span>${q.name}</i>`;
    }).join('')}</span>`);
    /* 오른쪽 위 '0 / 4'는 뺐어요 (11/10): 아래 '찾은 원인' 칸 4개가 채워지며 같은 걸 보여 줘요 */
    /* 힌트 버튼은 뺐어요 (11/10): 찾을 물건이 처음부터 노란 빛·물결·모서리로 강조돼 있어요 */
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
    /* 급식실 게시판: 오늘의 메뉴 (11/10) */
    if (d.menu) labEl(b, 'lab-menu', d.menu.r, `<h4>오늘의 급식</h4><ul>${d.menu.items.map(([m, a]) => `<li><span>${m}</span>${a ? `<em>${a}</em>` : ''}</li>`).join('')}</ul><small>${d.menu.note}</small>`);
    /* 찾은 원인 칸 */
    const tray = labEl(b, 'lab-tray', null, '', 'div', 'left:50%;bottom:16px;transform:translateX(-50%)');   // 내용에 맞춘 작은 상자 (11/10)
    d.points.forEach(pt => {
      const done = found.includes(pt.item);
      const slot = document.createElement('div');
      slot.className = 'tray-slot' + (done ? ' done' : '');
      slot.innerHTML = `<div class="ts-box">${done ? `<img src="${IMG.item(pt.item)}" alt="">` : '<span>?</span>'}</div><b>${done ? LAB.items[pt.item] : ''}</b>`;   // 이름 자리 ??? 없앰 (11/10)
      if (p.just === pt.item) replay(slot, 'pop');
      tray.appendChild(slot);
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
    labChar(b, 'nyang_scan', 600, { right: 81, bottom: 0 });   // 좌우 여백 맞춤 (11/10): 돋보기·냥박사 묶음을 가운데로
    const bub = labBubbleAt(labBubble(b, { x: 229, y: 0, w: 860, fs: 40, tail: 'br' }), { bottom: 660 });
    bub.style.left = 'auto'; bub.style.right = '360px';   // 오른쪽 끝을 냥박사 쪽에 고정   // 냥박사 머리 쪽으로 (11/9)
    bub.say(d.line);
    const lens = labEl(b, 'lab-lens pulse', [232, 300, 470, 470], `<img src="${IMG.item(d.item)}" alt="${LAB.items[d.item]}">${corners()}`, 'button');
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
    labChar(b, 'nyang_scan', 560, { left: 17, bottom: 0 }, 'no-intro flip');   // 좌우 뒤집어 스캐너가 결과 창을 비추게 (11/9)
    /* '알겠어요!' 아이: 결과 창이 열릴 때마다 여자·남자아이 번갈아 (11/9) */
    LabState.kidTurn = (LabState.kidTurn || 0) + 1;
    const kid = LabState.kidTurn % 2 ? 'girl' : 'boy';
    /* 결과 창: 폭 850, 높이는 내용에 맞추고 위아래 가운데 (11/9) */
    const win = labEl(b, 'lab-result', [614, 34, 850, 832], `
      <div class="rs-light"></div>
      <div class="rs-screen">
        <div class="rs-head"><img src="${IMG.item(d.item)}" alt=""><div><small>발견! 알레르기 원인</small><b>${LAB.items[d.item]}</b></div></div>
        <div class="rs-box rs-symbox"><span class="rs-badge">증상</span>
          <div class="rs-syms">${d.syms.map(([s, l]) => `<div><span class="sym-c"><img src="${IMG.sym(s)}" alt=""></span><b>${l}</b></div>`).join('')}</div></div>
        <div class="rs-box"><h3 class="lg">예방법</h3><ul>${d.tips.map(t => `<li>${labFmt(t)}</li>`).join('')}</ul></div>
        <button class="rs-ok" type="button" hidden><span class="px-bub tail-r rs-say"><span class="px-bub-txt">알겠어요!</span><i class="t1"></i><i class="t2"></i></span><span class="rs-kid"><img src="assets/kid/kid_${kid}_face.png" alt=""></span></button>
      </div>
      <i class="rs-dot"></i>`);
    const lis = $$('li', win);
    const ok = $('.rs-ok', win);   // 아이 얼굴 원형 배지 + '알겠어요!' (11/9)
    const timers = [];
    const showAll = () => { timers.forEach(clearTimeout); lis.forEach(li => li.classList.add('on')); if (ok.hidden) { ok.hidden = false; replay(ok, 'show'); } };
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
  labChar(w, 'staff_cheer', 360, { right: 150, bottom: 40 });   // 냥박사와 비슷하게 보이도록 약 0.95배 (11/9)
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
  labPanel(b, { sub: '알레르기 완벽 파악', title: '연구 완료!' });
  /* 상자 없이 우승컵 + 후광, 글은 꼬리 없는 말풍선 (11/10) */
  const c = labEl(b, 'lab-trophy', [620, 132, 360, 360], `<i class="tr-halo"></i><i class="tr-glow"></i><img src="${IMG.trophy}" alt="">`);
  replay(c, 'pop');
  const say = labEl(b, 'px-bub tail-n cheer-say', null, `<div class="px-bub-txt">와! 알레르기 유발물질<br><b class="lc big">12가지</b>를 모두 찾았어!</div>`, 'div', 'left:50%;top:520px;transform:translateX(-50%)');
  replay(say, 'pop');
  labChar(b, 'nyang_cheer', 520, { left: -50, bottom: 20 });
  labChar(b, 'staff_cheer', 495, { right: -60, bottom: 20 });   // 냥박사와 비슷하게 보이도록 약 0.95배 (11/9)
  setTimeout(() => playSfx('whistle'), 1000);
  labBtn(b, '다음 ›', 'left:50%;bottom:70px;transform:translateX(-50%);font-size:40px', 'y beat', () => { playSfx('next'); labGo('S36-2'); });
};

/* ===================== S36-2 증상 카드 안내 ===================== */
Router.screens['S36-2'] = (app) => {
  if (labNeed12()) return;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  labPanel(b, { sub: '알레르기 완벽 파악', title: '증상 카드 안내' });
  labChar(b, 'nyang_explain', 520, { left: -50, bottom: 20 });
  labChar(b, 'staff_guide', 495, { right: -60, bottom: 20 });   // 냥박사와 비슷하게 보이도록 약 0.95배 (11/9)
  /* 상자 없이 말풍선 두 개로 주고받기 (11/10) */
  const b1 = labBubbleAt(labBubble(b, { x: 300, y: 0, w: 760, fs: 40, tail: 'bl' }), { bottom: 540, tailX: 70 });
  const b2 = labBubbleAt(labBubble(b, { x: 0, y: 0, w: 740, fs: 36, tail: 'br', name: '수호냥', staff: true }), { bottom: 330 });
  b2.style.left = 'auto'; b2.style.right = '330px'; b2.hidden = true;
  b1.say('이제 [알레르기 증상 카드 7개]를<br>하나씩 눌러 보자!');
  setTimeout(() => { if (!b2.isConnected) return; b2.hidden = false; replay(b2, 'pop'); b2.say('증상을 모두 확인한 다음,<br>{{대처 방법}}도 함께 알아보자!'); }, LAB_REDUCED() ? 0 : 1500);
  labBtn(b, '다음 ›', 'left:50%;bottom:70px;transform:translateX(-50%);font-size:40px', 'y', () => { playSfx('next'); labGo('S36-3'); });
};

/* ===================== S36-3 증상 카드 (뒤집기) ===================== */
Router.screens['S36-3'] = (app) => {
  if (labNeed12()) return;
  const C = LAB.cards;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream' });
  /* 네모 줄이기 (11/9): 제목은 상자 없이 글씨만, 확인 수는 제목 옆 작은 글씨 */
  /* 제목은 다른 연구소 화면과 같은 상자 그대로, 확인 수는 오른쪽 위 둥근 배지 (11/9) */
  labPanel(b, { sub: '알레르기 완벽 파악', title: '알레르기 증상 카드' });
  const cnt = labEl(b, 'sym-cnt top-cnt', null, '', 'div', 'right:40px;top:40px');
  let sel = null, lockTimer;
  const cards = C.list.map((c, i) => {
    /* 2줄 배치 (11/9): 오른쪽에 4장 + 3장(가운데 맞춤), 왼쪽은 냥박사와 말풍선 */
    const CW = 214, GAP = 30, X0 = 600, row = i < 4 ? 0 : 1, col = row ? i - 4 : i;
    const e = labEl(b, 'lab-card', [X0 + col * (CW + GAP) + (row ? (CW + GAP) / 2 : 0), 190 + row * 266, CW, 246], `
      <span class="cd-front"><span class="sym-c"><img src="${IMG.sym(c.id)}" alt=""></span><b class="cd-name"><i>?</i><em>${c.label.length > 8 ? c.label.replace('·', '·<br>') : c.label}</em></b></span>`, 'button');   // 긴 이름은 · 뒤에서 줄바꿈 (두드러기· / 피부 가려움)
    e.setAttribute('aria-label', '증상 카드');
    onTap(e, () => pick(c.id));
    return e;
  });
  labChar(b, 'nyang_explain', 430, { left: 50, bottom: 6 });
  const bub = labBubbleAt(labBubble(b, { x: 36, y: 0, w: 540, fs: 34, tail: 'bl' }), { bottom: 470, tailX: 300 });   // 냥박사 머리 바로 위 (11/9)
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
    cnt.innerHTML = `<b class="lc">${seen.length}</b> / 7`;   // '확인' 글자 없이 (11/9)
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
    const pan = labPanel(b, { sub: '알레르기 완벽 파악', title: d.title });   // 연구소 공통 제목 부품 (11/9)
    if (d.type === 'severe') {   /* 위급 화면: 제목 양옆에 깜빡이는 픽셀 경광등 (11/9) */
      const SIREN = "<svg viewBox='0 0 16 13' shape-rendering='crispEdges' aria-hidden='true'><g class='rays'><rect x='2' y='1' width='1' height='1' fill='#F5C842'/><rect x='13' y='1' width='1' height='1' fill='#F5C842'/><rect x='3' y='2' width='1' height='1' fill='#F5C842'/><rect x='7' y='2' width='1' height='1' fill='#F5C842'/><rect x='8' y='2' width='1' height='1' fill='#F5C842'/><rect x='12' y='2' width='1' height='1' fill='#F5C842'/><rect x='4' y='3' width='1' height='1' fill='#F5C842'/><rect x='11' y='3' width='1' height='1' fill='#F5C842'/></g><g class='lamp'><rect x='6' y='4' width='1' height='1' fill='#1E2A5A'/><rect x='7' y='4' width='1' height='1' fill='#1E2A5A'/><rect x='8' y='4' width='1' height='1' fill='#1E2A5A'/><rect x='9' y='4' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='5' width='1' height='1' fill='#1E2A5A'/><rect x='6' y='5' width='1' height='1' fill='#E5402B'/><rect x='7' y='5' width='1' height='1' fill='#E5402B'/><rect x='8' y='5' width='1' height='1' fill='#E5402B'/><rect x='9' y='5' width='1' height='1' fill='#E5402B'/><rect x='10' y='5' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='6' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='6' width='1' height='1' fill='#E5402B'/><rect x='6' y='6' width='1' height='1' fill='#FFD9D2'/><rect x='7' y='6' width='1' height='1' fill='#E5402B'/><rect x='8' y='6' width='1' height='1' fill='#E5402B'/><rect x='9' y='6' width='1' height='1' fill='#E5402B'/><rect x='10' y='6' width='1' height='1' fill='#E5402B'/><rect x='11' y='6' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='7' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='7' width='1' height='1' fill='#E5402B'/><rect x='6' y='7' width='1' height='1' fill='#FFD9D2'/><rect x='7' y='7' width='1' height='1' fill='#E5402B'/><rect x='8' y='7' width='1' height='1' fill='#E5402B'/><rect x='9' y='7' width='1' height='1' fill='#E5402B'/><rect x='10' y='7' width='1' height='1' fill='#E5402B'/><rect x='11' y='7' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='8' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='8' width='1' height='1' fill='#E5402B'/><rect x='6' y='8' width='1' height='1' fill='#E5402B'/><rect x='7' y='8' width='1' height='1' fill='#E5402B'/><rect x='8' y='8' width='1' height='1' fill='#E5402B'/><rect x='9' y='8' width='1' height='1' fill='#E5402B'/><rect x='10' y='8' width='1' height='1' fill='#E5402B'/><rect x='11' y='8' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='9' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='9' width='1' height='1' fill='#E5402B'/><rect x='6' y='9' width='1' height='1' fill='#E5402B'/><rect x='7' y='9' width='1' height='1' fill='#E5402B'/><rect x='8' y='9' width='1' height='1' fill='#E5402B'/><rect x='9' y='9' width='1' height='1' fill='#E5402B'/><rect x='10' y='9' width='1' height='1' fill='#E5402B'/><rect x='11' y='9' width='1' height='1' fill='#1E2A5A'/><rect x='3' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='6' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='7' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='8' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='9' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='10' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='11' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='12' y='10' width='1' height='1' fill='#1E2A5A'/><rect x='3' y='11' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='11' width='1' height='1' fill='#8A93AE'/><rect x='5' y='11' width='1' height='1' fill='#8A93AE'/><rect x='6' y='11' width='1' height='1' fill='#8A93AE'/><rect x='7' y='11' width='1' height='1' fill='#8A93AE'/><rect x='8' y='11' width='1' height='1' fill='#8A93AE'/><rect x='9' y='11' width='1' height='1' fill='#8A93AE'/><rect x='10' y='11' width='1' height='1' fill='#8A93AE'/><rect x='11' y='11' width='1' height='1' fill='#8A93AE'/><rect x='12' y='11' width='1' height='1' fill='#1E2A5A'/><rect x='3' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='4' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='5' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='6' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='7' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='8' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='9' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='10' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='11' y='12' width='1' height='1' fill='#1E2A5A'/><rect x='12' y='12' width='1' height='1' fill='#1E2A5A'/></g></svg>";
      labEl(b, 'cope-siren', null, SIREN, 'div', `left:${34 + pan.offsetWidth + 22}px;top:24px`);   // 제목 바로 오른쪽 (11/10)
    }
    const steps = d.steps.map(([img, label], i) => {
      const s = labEl(b, 'cope-step', [130 + i * 470, 216, 400, 470], `<span class="num">${i + 1}</span><img src="${IMG.cope(img)}" alt=""><b>${label}</b>`);   // 둥근 카드, 제목과 버튼 사이 가운데 (위아래 94px, 11/9)
      if (i < 2) labEl(b, 'cope-arrow', null, '›', 'div', `left:${130 + i * 470 + 400 + 18}px;top:425px`);   // 카드 사이 한가운데
      return s;
    });
    /* 아래 버튼 두 개는 오른쪽에 나란히 (11/10): 왼쪽 아래 이전·처음 버튼과 겹치지 않게, 오른쪽 끝 = 카드 오른쪽 끝 */
    const back = labBtn(b, '‹ 증상 카드로', 'right:130px;bottom:56px;font-size:32px', 'w', () => { playSfx('tap'); labGo('S36-3'); });
    const right = labBtn(b, '', 'right:130px;bottom:56px;font-size:32px', 'y');
    const placeBack = () => { back.style.right = (130 + right.offsetWidth + 18) + 'px'; };
    const both = () => LabState.copeSeen.light && LabState.copeSeen.severe;
    const paintRight = () => {
      if (!both()) { right.className = 'px-btn ' + (d.type === 'light' ? 'c' : 'y'); $('span', right).innerHTML = d.otherLabel; }
      else { right.className = 'px-btn b beat'; $('span', right).innerHTML = LabState.quizDone ? '방패 만들러 가기 ›' : '기억 체크하기 ›'; }
      placeBack();
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
  /* 시안 (11/9): 두 판으로 나눠 하나씩 — 1판 가벼운 증상(카드 6장 중 3장 고르기) → 2판 위급한 증상(남은 3장 순서)
     판마다 가운데 띠 하나(S37·S38 카드와 같은 모양) + 아래 카드 줄 하나 */
  const Q = LAB.quiz;
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-quiz rounds' });
  playSfx('open');
  labPanel(b, { sub: '알레르기 완벽 파악', title: '대처 방법 기억하기' });
  const chip = labEl(b, 'sym-cnt top-cnt quiz-step', null, '', 'div', 'right:40px;top:40px');
  /* 냥박사가 왼쪽에서 판마다 안내해요 (11/9) */
  const guide = labChar(b, 'nyang_explain', 400, { left: 20, bottom: 6 });   // 보이는 몸 왼쪽 끝 = 화면 왼쪽 48px (오른쪽 여백과 같게)
  const bub = labBubbleAt(labBubble(b, { x: 48, y: 0, w: 480, fs: 30, tail: 'bl' }), { bottom: 440, tailX: 276 });
  /* 띠: [230,196,1140,360] 안에 빈칸 3개 (240×280) + 화살표 */
  /* 오른쪽 칸 x 560~1552: 띠와 카드 받침의 폭·위치를 같게 */
  const BX = 560, BY = 214, BW = 992, BH = 340, SW = 210, SH = 250, AG = 80, SX0 = (BW - (SW * 3 + AG * 2)) / 2, SY = (BH - SH) / 2 + 6;
  const ROUND = { light: { label: '가벼운 증상 대처', hint: '가벼운 증상일 땐 어떻게 할까?<br>카드를 골라 {{순서대로}} 넣어 봐!' }, severe: { label: '위급한 증상 대처', hint: '이번엔 위급한 증상!<br>남은 카드를 {{순서대로}} 넣어 봐!' } };
  const bands = {}, slots = {};
  const makeBand = t => {
    const band = labEl(b, 'quiz-band ' + t, [BX, BY, BW, BH], `<span class="qb-tag">${ROUND[t].label}</span>`);
    for (let i = 0; i < 3; i++) {
      const id = `${t}-${i}`, x = SX0 + i * (SW + AG);
      const s = document.createElement('div'); s.className = 'quiz-slot ' + t; s.dataset.id = id;
      s.style.cssText = `left:${x}px;top:${SY}px;width:${SW}px;height:${SH}px`; band.appendChild(s); slots[id] = s;
      if (i < 2) { const a = document.createElement('div'); a.className = 'cope-arrow quiz-arr ' + t; a.style.cssText = `left:${x + SW + (AG - 30) / 2}px;top:${SY + SH / 2 - 23}px`; band.appendChild(a); }
      const n = document.createElement('div'); n.className = 'qb-num ' + t; n.textContent = i + 1;
      n.style.cssText = `left:${x + SW / 2 - 26}px;top:${SY - 26}px`; band.appendChild(n);
    }
    bands[t] = band; return band;
  };
  /* 아래 카드 줄 */
  const PW = 150, PH = 206, PG = 12, HY = 604, HC = BX + BW / 2;
  const hand = labEl(b, 'quiz-hand', [BX, HY - 16, BW, PH + 32]);
  const handPos = n => Array.from({ length: n }, (_, i) => [HC - (n * PW + (n - 1) * PG) / 2 + i * (PW + PG), HY]);
  const ISCALE = { avoid: .97, tell: .98, clinic: 1.04, call119: .99, epipen: .96, ambulance: 1.1 };
  const order = Q.pieces.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const home = {};
  const setR = (e, r) => { e.style.left = r[0] + 'px'; e.style.top = r[1] + 'px'; e.style.width = r[2] + 'px'; e.style.height = r[3] + 'px'; };
  const pieces = order.map((k, i) => {
    const p = Q.pieces[k], r = [...handPos(6)[i], PW, PH]; home[p.id] = r;
    const e = labEl(b, 'quiz-piece', r, `<img src="${IMG.cope(p.img)}" alt="" draggable="false" style="scale:${ISCALE[p.img] || 1}"><b>${p.label}</b>`, 'button');
    e.dataset.id = p.id; e.setAttribute('aria-label', p.label);
    e.style.animationDelay = i * 0.08 + 's'; replay(e, 'pop');
    return e;
  });
  const ok = labBtn(b, '방패 만들러 가기 ›', 'left:auto;right:160px;top:786px;font-size:34px'   /* 위급 대처 띠 오른쪽 아래에 붙여요 */, 'y beat');
  ok.hidden = true;

  let round = 'light', placed = 0, selected = null;
  const startRound = t => {
    round = t; placed = 0;
    chip.innerHTML = `<b class="lc">${t === 'light' ? 1 : 2}</b> / 2`;
    bub.say(ROUND[t].hint);
    const band = makeBand(t); replay(band, 'pop');
    /* 남은 카드를 가운데로 다시 모아요 */
    const left = pieces.filter(e => !e.disabled);
    handPos(left.length).forEach(([x, y], i) => { home[left[i].dataset.id] = [x, y, PW, PH]; setR(left[i], home[left[i].dataset.id]); });
    const hw = left.length === 6 ? BW : Math.max(520, left.length * PW + (left.length - 1) * PG + 48); hand.style.left = (HC - hw / 2) + 'px'; hand.style.width = hw + 'px';   // 카드 줄 받침도 카드 수에 맞게
  };

  const scale = () => b.getBoundingClientRect().width / 1600;
  const slotAt = (cx, cy) => Object.values(slots).find(s => {
    if (s.classList.contains('full') || s.closest('.done') || s.closest('.away')) return false;
    const r = s.getBoundingClientRect(), pad = 30 * scale();
    return cx >= r.left - pad && cx <= r.right + pad && cy >= r.top - pad && cy <= r.bottom + pad;
  });
  const place = (e, s) => {
    const band = s.parentNode;
    band.insertBefore(e, band.querySelector('.qb-num'));   // 번호 배지는 카드 위에 보이게
    setR(e, [parseFloat(s.style.left), parseFloat(s.style.top), SW, SH]);
    e.classList.add('placed', round); e.classList.remove('sel'); e.disabled = true;
    s.classList.add('full', 'ok'); playSfx('check'); replay(e, 'pop'); placed++;
    if (placed === 3) setTimeout(round === 'light' ? nextRound : finish, 500);
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
      if (moved) tryDrop(e, slotAt(ev.clientX, ev.clientY));
      else {
        setR(e, home[e.dataset.id]);
        if (selected === e) { selected = null; e.classList.remove('sel'); }
        else { pieces.forEach(p => p.classList.remove('sel')); selected = e; e.classList.add('sel'); playSfx('tab'); }
      }
    };
    e.addEventListener('pointerup', end); e.addEventListener('pointercancel', end);
  });
  b.addEventListener('click', ev => {
    const s = ev.target.closest('.quiz-slot'); if (!s || !selected || s.classList.contains('full')) return;
    const e = selected; selected = null; tryDrop(e, s);
  });

  function nextRound() {
    playSfx('fanfare');
    Object.values(slots).forEach(s => replay(s, 'glow'));
    setTimeout(() => { bands.light.classList.add('done', 'away'); startRound('severe'); }, 900);
  }
  function finish() {
    LabState.quizDone = true; Store.set('labComplete', true);
    setTimeout(() => {
      playSfx('fanfare'); labConfetti();
      chip.classList.add('out'); hand.classList.add('out'); guide.remove(); bub.remove();
      bands.severe.classList.add('done');
      bands.light.classList.remove('away');
      requestAnimationFrame(() => requestAnimationFrame(() => { bands.light.classList.add('sum-top'); bands.severe.classList.add('sum-bot'); }));
      setTimeout(() => {
        labChar(b, 'nyang_cheer', 400, { left: 43, bottom: 6 }, 'no-intro');   // 다 맞힌 뒤: 냥박사+말풍선과 두 띠를 한 덩어리로 가운데 (좌우 여백 같게)   // 안내하던 냥박사와 같은 크기·자리 (11/9)
        labBubbleAt(labBubble(b, { x: 150, y: 0, w: 540, fs: 30, tail: 'bl' }), { bottom: 440, tailX: 190 }).say('대처 방법을 모두 기억했구나!<br>이제 {{나만의 방패}}를 만들러 가자!');
        ok.hidden = false; replay(ok, 'pop');
      }, 650);
    }, 350);
  }
  onTap(ok, () => { playSfx('next'); labGo('S39'); });
  startRound('light');
};
