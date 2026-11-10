/* =========================================================
   core.js — 저장, 날짜, 챌린지 계산, 화면 이동, 팝업, 공통 도구
   ========================================================= */
'use strict';

/* ---------- 작은 도구 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLACES = ['home', 'school', 'outside'];
const MIN_RULES = 3, MAX_RULES = 5, MINE_MAX = 2, NAME_MAX = 10, CUSTOM_MAX = 30;

/* 받침 판별 → 조사 */
function hasBatchim(word) {
  const c = String(word || '').trim().slice(-1).charCodeAt(0);
  if (!(c >= 0xAC00 && c <= 0xD7A3)) return false;
  return (c - 0xAC00) % 28 !== 0;
}
const josaUi = n => (hasBatchim(n) ? '이의' : '의');   // 건강이의 / 민수의
const josaNeun = n => (hasBatchim(n) ? '이는' : '는');  // 김치원이는 / 민수는

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/* ---------- 저장 (이 기기의 LocalStorage에만) ---------- */
const PREVIEW = new URLSearchParams(location.search).has('preview'); // 선생님 설정 미리 보기(iframe)
/* 행사용 (11/10 최종): 기록을 수업용과 따로 저장해요 — 학생 개인 태블릿에서 행사용 QR을 찍어도 수업 챌린지는 그대로 */
const KEY_OF = () => PREVIEW ? 'preview.promiseCard.' : (Config.get().mode === 'event' ? 'event.promiseCard.' : 'promiseCard.');
const CFG_KEY = PREVIEW ? 'preview.appConfig' : 'appConfig';
const SCFG_KEY = PREVIEW ? 'preview.sessionConfig' : 'sessionConfig';   // QR로 들어온 행사용: 이 창을 닫을 때까지만
const Store = {
  get(k, d = null) { try { const v = localStorage.getItem(KEY_OF() + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY_OF() + k, JSON.stringify(v)); } catch (e) { toast('저장 공간에 저장하지 못했어요.'); } },
  clearAll() { try { const K = KEY_OF(); Object.keys(localStorage).filter(k => k.startsWith(K)).forEach(k => localStorage.removeItem(k)); } catch (e) {} },
  hasRecord() { return !!(Store.get('cardNo') || Store.get('challenge')); },
  /* 행사용 '앞 친구 기록' 판단: 카드를 저장하기 전에 떠난 사람(이름·약속만)도 잡아요 */
  hasAny() { try { const K = KEY_OF(); return Object.keys(localStorage).some(k => k.startsWith(K)); } catch (e) { return false; } },
  snapshot() {
    const o = {};
    try { const K = KEY_OF(); Object.keys(localStorage).filter(k => k.startsWith(K) || k === 'appConfig').forEach(k => { o[k] = localStorage.getItem(k); }); } catch (e) {}
    return o;
  },
  restore(o) { try { Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) {} }
};
const Config = {
  get() {
    let c; try { c = Object.assign({ mode: 'class', board: '', bgm: true }, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); } catch (e) { c = { mode: 'class', board: '', bgm: true }; }
    let s = null; try { s = JSON.parse(sessionStorage.getItem(SCFG_KEY) || 'null'); } catch (e) {}
    return s ? Object.assign(c, s) : c;
  },
  /* 이 기기에 계속 (수업용 QR · 선생님 설정의 [설정 완료]) — 창 단위 행사용은 끝내요 */
  set(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); sessionStorage.removeItem(SCFG_KEY); } catch (e) {} },
  /* 이 창에서만 (QR로 들어온 행사용) */
  setSession(c) { try { sessionStorage.setItem(SCFG_KEY, JSON.stringify(c)); } catch (e) {} },
  isEvent() { return Config.get().mode === 'event'; }
};
const Draft = {
  get() { try { return Object.assign({ mode: 'class', board: '', sound: 'on', bgm: 'on' }, JSON.parse(localStorage.getItem('teacherPanel.draft') || '{}')); } catch (e) { return { mode: 'class', board: '', sound: 'on', bgm: 'on' }; } },
  set(c) { try { localStorage.setItem('teacherPanel.draft', JSON.stringify(c)); } catch (e) {} }
};

/* ---------- 날짜 (한국 시간 기준) ---------- */
const DateK = {
  override: null, // 테스트용: 주소에 ?today=2026-11-05
  today() {
    if (DateK.override) return DateK.override;
    if (TestMode.on) { const c = Store.get('challenge', null); if (c) return TestMode.day(c); }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); },
  str(dt) { return dt.toISOString().slice(0, 10); },
  add(s, n) { const d = DateK.parse(s); d.setUTCDate(d.getUTCDate() + n); return DateK.str(d); },
  dow(s) { return DateK.parse(s).getUTCDay(); },
  isSchoolDay(s) { const w = DateK.dow(s); return w !== 0 && w !== 6 && !(window.HOLIDAYS || []).includes(s); },
  md(s) { const [, m, d] = s.split('-').map(Number); return `${m}/${d}`; },
  wd(s) { return '일월화수목금토'[DateK.dow(s)]; },
  label(s) { return `${DateK.md(s)} ${DateK.wd(s)}요일`; },
  short(s) { return `${DateK.md(s)}(${DateK.wd(s)})`; },
  nextSchoolDays(from, n = 5) { const out = []; let d = from; while (out.length < n) { d = DateK.add(d, 1); if (DateK.isSchoolDay(d)) out.push(d); } return out; }
};

/* ---------- 점검 모드 (주소 뒤 ?test): 5일 챌린지를 하루에 5회로 넘겨 보기 ----------
   약속 카드를 만든 뒤에는 '오늘'이 챌린지 1일째부터 시작하고, [다음 날로]를 누를 때마다 하루씩 넘어가요.
   학생 화면(?test 없음)은 실제 날짜 그대로예요. */
const TestMode = {
  on: false,
  first(c) { return c.mode === 'free' ? c.start : c.days[0]; },
  len(c) { return c.mode === 'free' ? c.weeks * 7 : c.days.length; },
  idx(c) { const s = Store.get('testDay', null); return (s && c && s.first === TestMode.first(c)) ? s.idx : 0; },
  day(c) { const i = TestMode.idx(c); if (c.mode === 'free') return DateK.add(c.start, i); return i < c.days.length ? c.days[i] : DateK.add(c.days[c.days.length - 1], 1); },
  next() { const c = Store.get('challenge', null); if (!c) return; Store.set('testDay', { first: TestMode.first(c), idx: Math.min(TestMode.idx(c) + 1, TestMode.len(c)) }); }
};

/* ---------- 고른 수칙 (집 → 학교 → 밖, 각 장소 안에서는 고른 순서) ---------- */
function selectedRules() {
  const rules = Store.get('rules', { home: [], school: [], outside: [] });
  const custom = Store.get('custom', { home: [], school: [], outside: [] });
  const out = [];
  PLACES.forEach(p => {
    const data = window.RULES_DATA[p];
    (rules[p] || []).forEach(id => { const r = data.rules.find(x => x.id === id); if (r) out.push({ id: r.id, text: r.text, place: p, mine: false, type: r.type || 'daily' }); });
    (custom[p] || []).filter(c => c.checked).forEach(c => out.push({ id: c.id, text: c.text, place: p, mine: true, type: 'daily' }));
  });
  (custom.mine || []).filter(c => c.checked).forEach(c => out.push({ id: c.id, text: c.text, place: 'mine', mine: true, type: 'daily' }));   // 나만의 약속 (11/10)
  return out;
}
const needCount = n => Math.max(1, n - 1);   // 하나까지는 못 지켜도 별 (3개→2 · 7개→6, 팀 점검 11/8)

/* ---------- 챌린지 계산 ---------- */
/* ---------- 챌린지 다이어리 (11/10) ----------
   선생님 설정(Config.diary)에서 횟수 1~10 · 진행 방식 · 성공 메달 기준을 정하고, 시작할 때 그 값을 챌린지에 복사해 둬요.
   row(이어서) = 시작 다음 날부터 학교 가는 날 count번 / free(자유롭게) = 오늘부터 weeks주 안에 아무 날 count번(하루 한 번)
   log[날짜][수칙 id] = 'O' | 'X' — 하루에 하나라도 체크하면 그날은 '한 날', 지킨 수가 needCount 이상이면 별 */
const DY_DEF = { count: 5, mode: 'row', weeks: 2, min: 3, promise: '', praiseMin: '', praiseDone: '', photo: true, tsign: 't' };
const DyCfg = () => Object.assign({}, DY_DEF, Config.get().diary || {});
const Challenge = {
  get() { return Store.get('challenge', null); },
  plan(cfg = DyCfg(), from = DateK.today()) {
    const n = Math.max(1, Math.min(10, cfg.count | 0)), c = { v: 2, mode: cfg.mode === 'free' ? 'free' : 'row', count: n, min: Math.max(1, Math.min(n, cfg.min | 0)),
      weeks: Math.max(1, Math.min(4, cfg.weeks | 0)), promise: cfg.promise || '', praiseMin: cfg.praiseMin || '', praiseDone: cfg.praiseDone || '', tsign: cfg.tsign || 't', log: {}, stars: [], cele: {} };
    if (c.mode === 'row') c.days = DateK.nextSchoolDays(from, n);
    else { c.start = from; c.end = DateK.add(from, c.weeks * 7 - 1); c.days = []; }
    return c;
  },
  create(cfg) { const c = Challenge.plan(cfg); Store.set('challenge', c); return c; },
  touched(c, d) { return !!d && Object.keys(c.log[d] || {}).length > 0; },
  oCount(c, d) { return Object.values(c.log[d] || {}).filter(v => v === 'O').length; },
  isStar(c, d, rules = selectedRules()) { return Challenge.touched(c, d) && Challenge.oCount(c, d) >= needCount(rules.length); },
  /* 칸 n개의 날짜 (자유롭게는 체크한 날만 차례로 채우고 나머지는 null) */
  slots(c) {
    if (c.mode !== 'free') return c.days.slice();
    const done = Object.keys(c.log).filter(d => Challenge.touched(c, d)).sort();
    return Array.from({ length: c.count }, (_, i) => done[i] || null);
  },
  todayIdx(c) {
    const t = DateK.today(), sl = Challenge.slots(c);
    if (c.mode !== 'free') return sl.indexOf(t);
    const i = sl.indexOf(t); if (i >= 0) return i;
    const used = sl.filter(Boolean).length;
    return (t >= c.start && t <= c.end && used < c.count) ? used : -1;
  },
  starCount(c) { const rules = selectedRules(); return Challenge.slots(c).filter(d => Challenge.isStar(c, d, rules)).length; },
  status(c = Challenge.get()) {
    if (!c) return 'none';
    if (!c.v) return 'ended';   // 예전 5일 챌린지 기록
    const t = DateK.today(), stars = Challenge.starCount(c);
    if (stars >= c.count) return 'ended';
    if (c.mode !== 'free') {
      if (t > c.days[c.days.length - 1]) return 'ended';
      if (t < c.days[0]) return 'before';
      return c.days.includes(t) ? 'active' : 'rest';
    }
    if (t > c.end) return 'ended';
    return Challenge.todayIdx(c) >= 0 ? 'active' : 'ended';
  },
  nextCheckDay(c) { const t = DateK.today(); return c.mode === 'free' ? null : (c.days.find(d => d > t) || null); },
  /* 예전 화면·선생님 미리 보기와 맞추는 이름 */
  dayComplete(c, d) { return Challenge.touched(c, d); },
  dayState(c, d) { if (Challenge.touched(c, d)) return Challenge.isStar(c, d) ? 'star' : 'nostar'; const t = DateK.today(); return d < t ? 'miss' : d === t ? 'today' : 'future'; },
  recompute(c) { Store.set('challenge', c); return c; }
};

/* ---------- 화면 이동 + 뒤로 가기 ---------- */
const Router = {
  screens: {},
  current: null,
  go(name, params = {}, opt = {}) {
    const state = { s: name, p: params };
    if (opt.replace) history.replaceState(state, '', location.pathname + location.search);
    else { history.pushState(state, '', location.pathname + location.search); NavBtns.depth++; }
    Router.render(state);
  },
  guard: null, // 화면을 떠나기 전에 확인할 함수 (true를 돌려주면 뒤로 가기를 막음)
  render(state) {
    Modal.close(true);
    Router.guard = null;
    Router.current = state;
    const fn = Router.screens[state.s] || Router.screens.S00;
    const app = $('#app');
    app.className = 'screen screen-' + state.s;
    app.innerHTML = '';
    window.scrollTo(0, 0);
    Stage.fit();
    fn(app, state.p || {});
    SoundBtn.update(state.s);
    if (typeof NavBtns !== 'undefined') NavBtns.update(state.s);
    Orient.check();
    if (TestMode.on && typeof TestBar !== 'undefined') TestBar.update();
  }
};
window.addEventListener('popstate', e => {
  if (Modal.isOpen()) {             // 팝업이 열려 있으면 뒤로 가기 = 취소
    Modal.back();
    history.pushState(Router.current, '', location.pathname + location.search);
    return;
  }
  if (Router.guard && Router.guard(e.state)) {   // 저장 안 한 변경 등: 화면이 직접 처리
    history.pushState(Router.current, '', location.pathname + location.search);
    return;
  }
  if (e.state && e.state.s) { NavBtns.depth = Math.max(0, NavBtns.depth - 1); Router.render(e.state); }
});

/* ---------- 이전 · 처음으로 버튼 (모든 학생 화면 왼쪽 아래, 팀 점검 11/8) ---------- */
const NavBtns = {
  el: null,
  home() { return (typeof Config !== 'undefined' && Config.isEvent()) ? 'S39' : 'S00'; },
  update(screen) {
    if (!NavBtns.el) {
      const w = document.createElement('div'); w.id = 'navBtns';
      w.innerHTML = '<button type="button" id="navBack" aria-label="이전 화면"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg><span>이전</span></button><button type="button" id="navHome" aria-label="처음 화면"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5h4v5"/></svg><span>처음</span></button>';
      $('#stage').appendChild(w); NavBtns.el = w;
      $('#navBack', w).addEventListener('click', () => {
        if (typeof playSfx === 'function') playSfx('tap');
        if (history.state && history.length > 1 && NavBtns.depth > 0) history.back(); else Router.go(NavBtns.home(), {}, { replace: true });
      });
      $('#navHome', w).addEventListener('click', () => {
        if (typeof playSfx === 'function') playSfx('tap');
        const ev = Config.isEvent();   // 행사용 (11/10): 함께 쓰는 태블릿이라 처음으로 가면 기록을 지워요 — 다시 하고 싶을 때도 이 버튼
        const m = Modal.open(`<div class="pop-head">처음 화면으로 갈까요?</div><p class="pop-body">${ev ? '처음으로 가면 <b class="red">내 기록(서명 포함)이 지워져요.</b>' : '지금까지 한 연구와 약속 카드 기록은 그대로 남아 있어요.'}</p>
          <div class="pop-btns"><button class="btn white" data-autofocus id="nhNo">아니요</button><button class="btn pink" id="nhYes">처음 화면으로</button></div>`);
        $('#nhNo', m).addEventListener('click', () => Modal.close());
        $('#nhYes', m).addEventListener('click', () => { Modal.close(); if (ev) { Store.clearAll(); NavBtns.depth = 0; Router.go(NavBtns.home(), {}, { replace: true }); } else Router.go(NavBtns.home()); });
      });
    }
    const hide = PREVIEW || screen === 'T49' || screen === 'T50' || screen === 'S44' || screen === NavBtns.home();   // S44는 왼쪽에 자체 이동 버튼
    NavBtns.el.hidden = hide;
    NavBtns.el.classList.remove('cele-hide');
  },
  depth: 0
};
/* ---------- 소리 켜기/끄기 버튼 (학생 화면 오른쪽 위, 선생님 설정 제외 · 첫 화면에도 있음: 대기 음악) ---------- */
const SPK_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="#1E2A5A" stroke-width="2.5"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>';
const SPK_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="#1E2A5A" stroke-width="2.5"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const SoundBtn = {
  el: null,
  update(screen) {
    if (screen !== 'S00') Bgm.stop();
    if (!SoundBtn.el) {
      const b = document.createElement('button');
      b.id = 'soundBtn'; b.type = 'button';
      b.addEventListener('click', () => { setSound(!Sfx.on); SoundBtn.paint(); if (Sfx.on) playSfx('tap'); });
      $('#stage').appendChild(b); SoundBtn.el = b;
    }
    const hide = true;   // 학생 화면 소리 아이콘 모두 빼기 (11/9) — 소리는 선생님 설정에서
    SoundBtn.el.hidden = hide; SoundBtn.paint();
  },
  paint() { if (!SoundBtn.el) return; SoundBtn.el.innerHTML = Sfx.on ? SPK_ON : SPK_OFF; SoundBtn.el.classList.toggle('mute', !Sfx.on); SoundBtn.el.setAttribute('aria-label', Sfx.on ? '소리 끄기' : '소리 켜기'); }
};

/* 움직임 한 번 다시 재생 (nod, hop, pop, shake) */
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

/* ---------- 팝업 ---------- */
const Modal = {
  el: null, onBack: null,
  open(html, { onBack = null, cls = '', sfx = 'open' } = {}) {
    Modal.close(true);
    if (sfx) playSfx(sfx);
    const wrap = document.createElement('div');
    wrap.className = 'modal-dim ' + cls;
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    $('#layer').appendChild(wrap);
    document.body.classList.add('no-scroll');
    Modal.el = wrap; Modal.onBack = onBack;
    const first = wrap.querySelector('[data-autofocus]'); if (first) setTimeout(() => first.focus(), 30);
    return wrap;
  },
  isOpen() { return !!Modal.el; },
  back() { const fn = Modal.onBack; Modal.close(); if (fn) fn(); },
  close(silent) { if (Modal.el) { Modal.el.remove(); Modal.el = null; Modal.onBack = null; document.body.classList.remove('no-scroll'); } }
};

/* ---------- 알림(토스트) ---------- */
let toastTimer;
function toast(msg, ms = 1800) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; $('#layer').appendChild(t); }
  t.innerHTML = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- 연타 방지 버튼 ---------- */
function onTap(el, fn) {
  if (!el) return;
  let busy = false;
  el.addEventListener('click', async e => {
    if (busy || el.disabled) return;
    busy = true;
    try { await fn(e); } finally { setTimeout(() => (busy = false), 350); }
  });
}

/* ---------- 숨은 5번 터치 (선생님 설정) ---------- */
function secretTap(el, onUnlock) {
  if (!el) return;
  let times = [];
  el.addEventListener('click', () => {
    const now = Date.now();
    if (times.length && now - times[times.length - 1] > 1000) times = [];
    times.push(now); times = times.filter(t => now - t <= 3000);
    if (times.length >= 5) { times = []; onUnlock(); }
  });
}

/* ---------- 태블릿: 1600×900 화면을 기기에 맞춰 확대·축소 ---------- */
const Stage = {
  W: 1600, H: 900,
  fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const tablet = (w >= h && w >= 480) || w >= 900;   // 11/10: 폭 700 미만 가로 휴대폰(갤럭시 S9+ 658, 아이폰 SE 667)도 판을 줄여 보여 줘요 — 카드 꾸미기·다이어리가 세로 휴대폰 배치로 깨지던 문제
    document.body.classList.toggle('tablet', tablet);
    document.body.classList.toggle('phone', !tablet);
    const st = document.getElementById('stage');
    if (!st) return;
    if (tablet) { const s = Math.min(w / Stage.W, h / Stage.H); st.style.setProperty('--s', s); }
    else st.style.removeProperty('--s');
  }
};
window.addEventListener('resize', () => Stage.fit());

/* ---------- 화면 방향 안내 ---------- */
const Orient = {
  check() {
    const o = $('#orient');
    if (!o) return;
    const teacher = Router.current && /^T/.test(Router.current.s);
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const short = Math.min(screen.width, screen.height);
    const tablet = short >= 600;
    const portrait = window.innerHeight > window.innerWidth;
    const lab = true;   // 11/10: 방패 만들기·이름 쓰기·약속 고르기·다이어리도 연구소 판(1600×900)이라 학생 화면은 모두 가로
    let msg = '';
    if (coarse && !teacher) {
      if (tablet && portrait) msg = '태블릿을 <b>가로로</b> 돌려 주세요';
      if (!tablet && lab && portrait) msg = '휴대폰을 <b>가로로</b> 돌려서 봐요';
    }
    o.querySelector('p').innerHTML = msg;
    o.classList.toggle('show', !!msg);
  }
};
window.addEventListener('resize', () => Orient.check());
window.addEventListener('orientationchange', () => setTimeout(Orient.check, 200));

/* ---------- 이미지 저장 (S44 카드, S48-2 메달 이미지 공통) ---------- */
async function saveCanvasPNG(canvas, filename) {
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('이미지를 만들지 못했어요.');
  const file = new File([blob], filename, { type: 'image/png' });
  if (isIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: filename }); // 취소하면 AbortError
    return true;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/* ---------- 이미지 미리 불러오기 ---------- */
const imgCache = {};
function loadImg(src) {
  if (imgCache[src]) return imgCache[src];
  imgCache[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  return imgCache[src];
}

/* ---------- 클립보드 ---------- */
async function copyText(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    if (fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('길게 눌러 복사해 주세요'); return false;
  }
}

/* ---------- 홈 화면 앱 설치 이벤트 (안드로이드 Chrome) ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
