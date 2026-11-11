/* =========================================================
   diary.js — 챌린지 다이어리 (S46 · 11/10, 시안 diary_sian을 앱으로)
   - 연구소와 같은 1600×900 판 안에 섀도 DOM을 하나 만들고, 시안 모양(css/diary.css)을 그대로 써요.
   - 꾸미기(표지 · 스티커 · 내 사진)는 시작 전이든 후든 언제든 할 수 있어요.
   - 매일 체크: 다이어리 오른쪽 '오늘 실천한 약속' 칸을 누르면 바로 저장, 지킨 수가 기준 이상이면 그날 별.
   - 성공 메달(min일) · 완성 메달(count일): 축하 창(어둡게 흐림 + 후광 + 색종이)을 한 번 보여 주고 다이어리에 걸어요.
   - 메달 고르기는 없어요. 메달 리본의 별 = 별 받은 날 수.
   저장: challenge(core.js Challenge) · diaryLook {art, placed[], photo, pic}
   ========================================================= */
'use strict';

const DY_IMG = k => `assets/diary/${k}.png`;
const DY_PLACE = { home: ['집', 0], school: ['학교', 1], outside: ['밖', 2], mine: ['나', 3] };
const DY_SAMPLE = { min: '목표를 이뤘어요! 매일 약속을 지키는 모습이 정말 멋져요.', done: '끝까지 해냈어요! 약속을 지키는 멋진 방패 대원이에요.' };
const DY_STK = [
  ...['staff_hello', 'staff_heart', 'staff_thumb', 'nyang_hello', 'nyang_cheer', 'nyang_explain'].map(k => ['img', k, 140, 'c']),
  ...[['stk_mask', 120], ['stk_soap', 110], ['stk_shield', 96], ['stk_rainbow', 120], ['stk_star', 100], ['stk_heart', 96], ['stk_dino', 104], ['stk_ball', 96], ['stk_rocket', 96], ['stk_ribbon', 110], ['stk_unicorn', 100], ['stk_crown', 110]].map(([k, w]) => ['img', k, w, 's']),
  ['word', '할 수 있어!', '', 'w'], ['word', '건강 최고', 'g', 'w'], ['word', '오늘도 지켰다', 'b', 'w']
];
const DY_STK_TAB = { c: '캐릭터', s: '스티커', w: '문구' };   // 11/11: '글자' → '문구'
const DY_COVERS = [['mint', '민트'], ['navy', '남색 체크'], ['pink', '분홍 체크']];
const DY_BUDDY = ['staff_hello', 'staff_heart', 'staff_guide', 'staff_thumb'];
const DyLook = {
  get() { return Object.assign({ art: 'mint', placed: [], photo: 'staff_hello', pic: null }, Store.get('diaryLook', null) || {}); },
  set(v) { Store.set('diaryLook', v); }
};
const dyEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DY_STAR_DEF = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="star" viewBox="-0.5 -1 16 16" shape-rendering="crispEdges"><rect x="7" y="0" width="1" height="1" fill="#252E52"/><rect x="6" y="1" width="1" height="1" fill="#252E52"/><rect x="7" y="1" width="1" height="1"/><rect x="8" y="1" width="1" height="1" fill="#252E52"/><rect x="6" y="2" width="1" height="1" fill="#252E52"/><rect x="7" y="2" width="1" height="1"/><rect x="8" y="2" width="1" height="1" fill="#252E52"/><rect x="5" y="3" width="1" height="1" fill="#252E52"/><rect x="6" y="3" width="1" height="1"/><rect x="7" y="3" width="1" height="1" fill="#fff" fill-opacity=".85"/><rect x="8" y="3" width="1" height="1"/><rect x="9" y="3" width="1" height="1" fill="#252E52"/><rect x="0" y="4" width="5" height="1" fill="#252E52"/><rect x="5" y="4" width="1" height="1"/><rect x="6" y="4" width="1" height="1" fill="#fff" fill-opacity=".85"/><rect x="7" y="4" width="3" height="1"/><rect x="10" y="4" width="5" height="1" fill="#252E52"/><rect x="0" y="5" width="1" height="1" fill="#252E52"/><rect x="1" y="5" width="4" height="1"/><rect x="5" y="5" width="1" height="1" fill="#fff" fill-opacity=".85"/><rect x="6" y="5" width="8" height="1"/><rect x="14" y="5" width="1" height="1" fill="#252E52"/><rect x="1" y="6" width="1" height="1" fill="#252E52"/><rect x="2" y="6" width="11" height="1"/><rect x="13" y="6" width="1" height="1" fill="#252E52"/><rect x="2" y="7" width="1" height="1" fill="#252E52"/><rect x="3" y="7" width="9" height="1"/><rect x="12" y="7" width="1" height="1" fill="#252E52"/><rect x="3" y="8" width="1" height="1" fill="#252E52"/><rect x="4" y="8" width="7" height="1"/><rect x="11" y="8" width="1" height="1" fill="#252E52"/><rect x="3" y="9" width="1" height="1" fill="#252E52"/><rect x="4" y="9" width="7" height="1"/><rect x="11" y="9" width="1" height="1" fill="#252E52"/><rect x="2" y="10" width="1" height="1" fill="#252E52"/><rect x="3" y="10" width="4" height="1"/><rect x="7" y="10" width="1" height="1" fill="#252E52"/><rect x="8" y="10" width="4" height="1"/><rect x="12" y="10" width="1" height="1" fill="#252E52"/><rect x="2" y="11" width="1" height="1" fill="#252E52"/><rect x="3" y="11" width="3" height="1"/><rect x="6" y="11" width="1" height="1" fill="#252E52"/><rect x="8" y="11" width="1" height="1" fill="#252E52"/><rect x="9" y="11" width="3" height="1"/><rect x="12" y="11" width="1" height="1" fill="#252E52"/><rect x="1" y="12" width="1" height="1" fill="#252E52"/><rect x="2" y="12" width="2" height="1"/><rect x="4" y="12" width="1" height="1" fill="#252E52"/><rect x="10" y="12" width="1" height="1" fill="#252E52"/><rect x="11" y="12" width="2" height="1"/><rect x="13" y="12" width="1" height="1" fill="#252E52"/><rect x="1" y="13" width="3" height="1" fill="#252E52"/><rect x="11" y="13" width="3" height="1" fill="#252E52"/></symbol></defs></svg>';

/* ---------- 계산 ---------- */
function dyModel(c, cfg = DyCfg()) {
  const rules = selectedRules(), n = c.count, need = needCount(rules.length);
  const slots = Challenge.slots(c), ti = Challenge.todayIdx(c);
  const star = d => Challenge.isStar(c, d, rules);
  const got = slots.filter(star).length;
  /* 메달: 별 min개 → 성공(파랑), n개 → 완성(산호) · 받은 날 = 그 개수가 된 날 */
  let k = 0, at = null, cnt = 0;
  slots.forEach(d => { if (star(d)) { cnt++; if (cnt === c.min || cnt === n) at = d; } });
  if (got >= n) k = n; else if (got >= c.min && c.min < n) k = c.min;
  let range, sub;
  if (c.mode === 'free') { range = `${DateK.md(c.start)} ~ ${DateK.md(c.end)}`; sub = `${c.weeks}주 안에 아무 날 ${n}번`; }
  else { const a = c.days[0], b = c.days[n - 1]; range = `${DateK.short(a)} ~ ${DateK.short(b)}`; sub = `학교 가는 날 ${n}번`; }
  return { c, rules, n, need, slots, ti, star, got, medal: k ? { k, gold: k === n, at } : null, range, sub, cfg };
}

/* 메달: 원래 수호냥 메달 그림 + 리본 띠 안에 별 (별 받은 날 = 노랑, 남은 날 = 흰색) */
function dyBadge(got, n, gold) {
  const sw = Math.min(36, 196 / n), x0 = 150 - sw * n / 2, cy = 394 * 0.905;
  let stars = ''; for (let i = 0; i < n; i++) stars += `<use href="#star" x="${x0 + i * sw}" y="${cy - sw / 2}" width="${sw}" height="${sw}" fill="${i < got ? '#F5C842' : '#FFFFFF'}" ${i < got ? '' : 'opacity=".7"'}/>`;
  return `<svg class="badge" viewBox="0 0 300 394"><image href="${DY_IMG('medal_' + (gold ? 'coral' : 'blue'))}" x="0" y="0" width="300" height="394" style="image-rendering:pixelated"/>${stars}</svg>`;
}
/* 약속 카드와 같은 발바닥 도장 '약속 확인' */
function dyPawSeal(cls) {
  const r = 40, word = [...'약속 확인'], span = 1.5 * 180 / Math.PI;
  const txt = word.map((ch, i) => `<text transform="rotate(${-span / 2 + span * i / (word.length - 1)}) translate(0,${-r * 0.5})" text-anchor="middle" dominant-baseline="middle" font-size="${r * 0.3}" font-family="Jua,sans-serif" fill="#C9573A" stroke="#C9573A" stroke-width="${r * 0.036}">${ch}</text>`).join('');
  const s = r * 0.62, x = -r * 0.31, y = -r * 0.12, paw = `<ellipse cx="${x + s * .5}" cy="${y + s * .66}" rx="${s * .25}" ry="${s * .21}"/>` + [[.2, .37], [.4, .2], [.6, .2], [.8, .37]].map(([a, b]) => `<circle cx="${x + s * a}" cy="${y + s * b}" r="${s * .11}"/>`).join('');
  return `<svg class="${cls}" viewBox="-50 -50 100 100"><g transform="rotate(-9)" opacity=".92"><circle r="${r * 0.9}" fill="none" stroke="#C9573A" stroke-width="${r * 0.17}"/><circle r="${r * 0.7}" fill="none" stroke="#C9573A" stroke-width="${r * 0.05}"/>${txt}<g fill="#C9573A">${paw}</g></g></svg>`;
}

/* ---------- 다이어리 한 권 (시안 diary() 그대로) ---------- */
function dyDiary(m, look, { print = false } = {}) {
  const { c, rules, n, slots, ti, star, got } = m;
  const EVX = Config.isEvent();   // 행사용 (11/11): 태블릿에서 체크하지 않아 '오늘'·별 범례·메달 막대 없음
  const name = Store.get('name', '') || '나';
  const PR = (c.promise || '').trim();
  /* 선생님 약속 30자 (11/11): 한 줄에 안 들어가면(17자 넘음) 메모지 안에서 두 줄로, 아래 안내 줄은 빼요 */
  const two = [...PR].length > 17;
  const note = PR ? `<div class="tnote ${m.medal ? 'hasb' : ''}${two ? ' two' : ''}" style="left:34px;top:412px"><h5>선생님 약속</h5><p>${dyEsc(PR)}</p>${two ? '' : `<small>${n}일 모두 성공하면 받아요</small>`}</div>`
    : `<div class="tnote ${m.medal ? 'hasb' : ''}" style="left:34px;top:412px"><h5>선생님 응원</h5><p>선생님이 매일 응원할게요!</p><small>${Config.isEvent() ? `${n}번 모두 지키면 완성!` : `${n}일 모두 성공하면 완성 메달을 받아요`}</small></div>`;   // 행사용은 메달이 없어요 (11/11)
  const ph = look.photo === 'cam' && look.pic ? `<img src="${look.pic}" alt="내 사진" style="width:100%;height:100%;object-fit:cover">` : `<img src="${DY_IMG(look.photo === 'cam' ? 'staff_hello' : look.photo)}" alt="">`;
  const md = m.medal;
  const L = `<div class="d-title">${n}일 챌린지 다이어리</div>
    <div class="pframe"><img class="pf" src="${DY_IMG('photo_frame')}" alt=""><div class="pwin">${ph}</div><p>나</p></div>
    <div class="me"><b>${dyEsc(name)}</b><dl><div><dt>기간</dt><dd>${m.range}</dd></div><div><dt>방식</dt><dd>${m.sub}</dd></div><div><dt>약속</dt><dd>${rules.length}개</dd></div></dl></div>
    ${note}
    ${md && !print ? `<div class="award"><div class="aw-t"><small>${md.at ? DateK.md(md.at) + ' ' : ''}받은 메달</small><b>${md.gold ? `${n}일 챌린지 완성!` : `${md.k}일 챌린지 성공!`}</b></div><div class="pocket on">${dyBadge(got, n, md.gold)}</div></div>` : ''}`;
  const rp = r => `<span class="rpl p${DY_PLACE[r.place][1]}">${DY_PLACE[r.place][0]}</span>`;
  const logOf = d => (d && c.log[d]) || {};
  const day = (d, i) => {
    const done = !print && !!d && Challenge.touched(c, d) && i !== ti, ok = done && star(d), isT = i === ti && !print && !EVX;   // 인쇄 양식은 별 칸을 비워 둬요
    const lab = c.mode === 'free' ? `<b>${i + 1}번째</b>${d ? `<small>${DateK.md(d)}</small>` : ''}` : `<b>${DateK.md(d)}</b><small>${DateK.wd(d)}</small>`;
    const tdone = !print && isT && Challenge.touched(c, d), tok = tdone && star(d);
    const fill = done ? (ok ? '#F5C842' : '#9EA3AB') : tdone ? (tok ? '#F5C842' : '#9EA3AB') : '#FFFFFF';
    return `<div class="day ${isT ? 'today' : ''} ${done || tdone ? 'done' : ''}">${isT ? '<span class="tdy">오늘</span>' : ''}<span class="sc ${done || tdone ? ((ok || tok) ? '' : 'nost') : 'empty'}"><svg viewBox="-0.5 -1 16 16"><use href="#star" fill="${fill}"/></svg></span><span class="dbadge">${lab}</span></div>`;
  };
  const prog = () => {
    const cells = Array.from({ length: n }, (_, i) => {
      const mk = (i === c.min - 1 && c.min < n) ? ['blue', `${c.min}일 성공`] : i === n - 1 ? ['coral', `${n}일 완성`] : null;
      return `<i class="${i < got ? 'on' : ''}">${mk ? `<em class="mk ${got >= i + 1 ? 'got' : ''}"><img src="${DY_IMG('medal_' + mk[0])}" alt=""><small>${mk[1]}</small></em>` : ''}</i>`;
    }).join('');
    return `<div class="prog" style="top:98px"><span class="pl">별 <b>${got}</b> / ${n}</span><span class="bar">${cells}</span></div>`;
  };
  const todayD = ti >= 0 ? (slots[ti] || DateK.today()) : null;
  const many = rules.length > 4 ? ' many' : '';
  const signTop = 290 + 50 + Math.min(rules.length, 7) * (rules.length > 4 ? 64 : 86) + 92;
  const Rt = `<div class="r-head"><h4>매일 체크</h4></div>
    ${print ? `<div class="psign" style="top:${signTop}px">${c.tsign === 'n' ? `<span class="nyang">확인했어요<em>냥박사</em><b class="pspot">${dyPawSeal('pseal')}</b></span>` : `<span>확인했어요<i></i><b class="pspot">${dyPawSeal('pseal ghost')}</b></span>`}</div>`
      : EVX ? '' : `<div class="slegend" style="top:344px"><span><svg viewBox="-0.5 -1 16 16" width="30" height="30"><use href="#star" fill="#F5C842"/></svg> 별 받음</span><span><svg viewBox="-0.5 -1 16 16" width="30" height="30"><use href="#star" fill="#9EA3AB"/></svg> 했지만 별 없음</span></div>`}
    <div class="dayrow" ${print ? 'style="top:104px"' : ''}>${slots.map(day).join('')}</div>
    ${print || EVX ? '' : prog()}
    <div class="tlist${many}" ${print ? 'style="top:290px"' : ''}><h5>${print ? `실천한 날에 체크해요<span class="pdates">${slots.map(d => `<b>${c.mode === 'free' || !d ? '__' : DateK.md(d).split('/')[1]}</b>`).join('')}</span>` : `${ti >= 0 ? '오늘 실천한 약속' : '실천한 약속'}<span class="hrule">${m.need}개 이상 지키면 별 하나</span>`}</h5>
      ${rules.map(r => {
        const v = todayD ? logOf(todayD)[r.id] : '';
        return `<div class="ti"><span>${rp(r)}</span><span class="tt">${dyEsc(r.text)}</span>${print ? `<span class="pboxes">${slots.map(() => '<i class="cb pb"></i>').join('')}</span>` : `<button type="button" class="cb ${v === 'O' ? 'on' : ''} ${ti < 0 ? 'off' : ''}" data-rule="${r.id}" aria-label="${dyEsc(r.text)} 지켰어요" aria-pressed="${v === 'O'}"></button>`}</div>`;
      }).join('')}</div>`;
  const k = 1196 / 1440, pw = 630 * k, ph2 = 873 * k, sc = ph2 / 860, off = (pw - 560 * sc) / 2;
  const pg = (left, html, dy = 0) => `<div class="dpage art" style="left:${left}px;top:${(78 - 24) * k}px;width:${pw}px;height:${ph2}px"><div class="pg" style="left:${off}px;top:${dy}px;transform:scale(${sc})">${html}</div></div>`;
  return `<div class="diary art" style="left:${print ? 0 : 402}px;top:${print ? 0 : 46}px;width:1196px;height:${975 * k}px">
    <img class="dart" src="${DY_IMG('diary_' + look.art + (print ? '_ink' : ''))}" alt="" style="left:${-48 * k}px;top:${-24 * k}px;width:${1536 * k}px">
    ${pg((93 - 48) * k, L, 34)}${pg((775 - 48) * k, Rt)}</div>`;
}
const dyFixNote = h => h;   // 선생님 쪽지는 왼쪽 쪽 그대로

/* ---------- 스티커 ---------- */
function dyStk(s, i) {
  const [t, v, w] = DY_STK[s.k] || DY_STK[0];
  const inner = t === 'img' ? `<img src="${DY_IMG(v)}" alt="">` : `<span class="word ${w}">${v}</span>`;
  return `<div class="stk" data-i="${i}" style="left:${s.x}px;top:${s.y}px;${t === 'img' ? `width:${s.w || w}px;` : ''}transform:rotate(${s.r || 0}deg)">${inner}<button class="x" aria-label="스티커 떼기">×</button></div>`;
}

/* ---------- 효과음 (카운트다운 · 찰칵) ---------- */
let dyAc = null;
const dyAudio = () => (dyAc = dyAc || new (window.AudioContext || window.webkitAudioContext)());
function dyBeep(f, d, v = .15) { if (!Sfx.on) return; try { const a = dyAudio(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; o.type = 'square'; g.gain.setValueAtTime(v, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d); } catch (e) {} }
function dyShutter() { if (!Sfx.on) return; try { const a = dyAudio(), n = a.sampleRate * .12, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); const s = a.createBufferSource(), g = a.createGain(); g.gain.value = .5; s.buffer = b; s.connect(g); g.connect(a.destination); s.start(); } catch (e) {} }
function dyConfetti(cv, count, big) {
  if (LAB_REDUCED()) return;
  const c = cv.getContext('2d'), cols = ['#E0663F', '#F5C842', '#7FA6E8', '#2F8F5B', '#FFFFFF', '#C9A4F0'];
  const P = Array.from({ length: count }, () => ({ x: big ? Math.random() * 1600 : 800 + (Math.random() - .5) * 500, y: big ? -Math.random() * 600 : 380, vx: big ? (Math.random() - .5) * 3 : (Math.random() - .5) * 16, vy: big ? 2 + Math.random() * 3 : -8 - Math.random() * 10,
    s: 8 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.random() * cols.length | 0] }));
  let t = 0; (function f() { if (!cv.isConnected) return; t++; c.clearRect(0, 0, 1600, 900); P.forEach(p => { p.vy += big ? .04 : .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); });
    if (t < (big ? 420 : 160)) requestAnimationFrame(f); else c.clearRect(0, 0, 1600, 900); })();
}

/* ===================== S46 챌린지 다이어리 ===================== */
Router.screens.S46 = (app, p = {}) => {
  if (!selectedRules().length) return Router.go('S39', {}, { replace: true });
  const b = labBoard(app, LAB.bg.ground, { cls: 'lab-diary' });
  const host = document.createElement('div'); host.className = 'dy-host'; b.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<link rel="stylesheet" href="./css/diary.css">${DY_STAR_DEF}<div class="dyb"></div>`;
  const W = root.querySelector('.dyb');
  let look = DyLook.get(), sideTab = 'stk', stkTab = 's';
  /* 행사용 다이어리 (11/11): 꾸미기 → 인쇄·이미지 저장(·게시판) → 다음 친구에게 넘기기.
     태블릿에서 날마다 체크·메달·설치 안내는 없음. 체크는 집에서 인쇄한 종이에 */
  const EV = Config.isEvent();
  const cfg = DyCfg();   // 11/11: 행사용도 선생님 설정(횟수·진행 방식·사진 찍기 등)을 그대로 따라요
  let evSaved = false, evPrinted = false;
  /* 결과 게시판 (11/10): 챌린지가 끝나면(완성 또는 기간 끝) [게시판에 올리기] — 한 사람당 마지막 결과 한 장 */
  const BOARD = Config.get().board || '';
  let sentReady = false;   // 이 화면에서 이미지를 저장했나 (저장해야 패들렛에서 고를 수 있어요)
  const live = () => { if (EV) return null; const c = Challenge.get(); return c && c.v ? c : null; };
  const model = () => dyModel(live() || Challenge.plan(cfg));
  const q = s => root.querySelector(s);

  const boardBtn = () => `<button class="pbtn${sentReady ? ' ready' : ''}" id="toBoard" ${sentReady ? '' : 'disabled aria-disabled="true"'}>게시판에 올리기 ›</button>`;
  const classBtns = (c, ended, m) => (!c ? '<button class="pbtn y" id="go">챌린지 시작하기 ›</button>' : ended ? '<button class="pbtn y" id="again">새로 도전하기 ›</button>' : '')
    + `<div class="brow"><button class="pbtn${c && !ended ? ' y' : ''}" id="saveImg">이미지 저장</button><button class="pbtn" id="print">인쇄하기</button></div>`
    + (c && BOARD && (ended || (m.medal && m.medal.gold)) ? boardBtn() : '');
  /* 행사용 (11/11): [인쇄하기 노랑 | 이미지 저장] (게시판이 있으면 저장 뒤 [게시판에 올리기]) → [다음 친구에게 넘기기] */
  const evBtns = () => `<div class="brow"><button class="pbtn y" id="print">인쇄하기</button><button class="pbtn" id="saveImg">이미지 저장</button></div>`
    + (BOARD ? boardBtn() : '') + '<button class="pbtn" id="pass">다음 친구에게 넘기기 ›</button>';
  function paint() {
    const c = live(), m = model(), st = c ? Challenge.status(c) : 'none';
    const tday = DateK.today();
    let bub = '';
    if (c) {
      if (m.medal && m.medal.gold) bub = `<b class="hi">${m.n}일 챌린지 완성!</b><br>메달${(c.promise || '').trim() ? '과 약속이' : '이'} 걸렸어요`;
      else if (st === 'ended') bub = `<b class="hi">기간이 끝났어요</b><br>별 ${m.got}개를 모았어요.<br>지킨 날도 소중해요!`;
      else if (st === 'before') bub = `<b class="hi">${DateK.short(c.days[0])}</b>부터<br>매일 체크를 시작해요`;
      else if (st === 'rest') { const nx = Challenge.nextCheckDay(c); bub = `오늘은 쉬는 날이에요<br>다음 체크는 <b class="hi">${nx ? DateK.short(nx) : ''}</b>`; }
      else bub = `오늘은 <b class="hi">${DateK.short(tday)}</b><br>${m.ti + 1}번째 체크 날이에요`;
    }
    const ended = st === 'ended';
    W.innerHTML = `<div class="b-bg dim"></div>
      <div class="b-title lt a1"><div><b>${c ? '챌린지 다이어리' : '다이어리 꾸미기'}</b></div></div>
      <div class="side">
        ${bub ? `<div class="sbub">${bub}</div>` : ''}
        <div class="tabs"><button data-side="cover" class="${sideTab === 'cover' ? 'on' : ''}">표지</button><button data-side="stk" class="${sideTab === 'stk' ? 'on' : ''}">스티커</button>${cfg.photo !== false ? '<button data-side="photo">내 사진</button>' : ''}</div>
        <div class="drawer" id="drawer"></div>
        <div class="btns">${EV ? evBtns() : classBtns(c, ended, m)}</div>
      </div>
      <div id="dz">${dyDiary(m, look)}${look.placed.map(dyStk).join('')}</div>`;
    paintDrawer();
    root.querySelectorAll('#dz .stk').forEach(dragify);
    bind();
  }
  function paintDrawer() {
    const dr = q('#drawer'); if (!dr) return;
    dr.classList.toggle('words', sideTab !== 'cover' && stkTab === 'w');   // 문구 3개는 한 줄에 고르게 (11/11)
    dr.innerHTML = sideTab === 'cover'
      ? `<span class="cap" style="margin:0 0 4px;grid-column:1/-1">마음에 드는 다이어리를 골라요</span>` + DY_COVERS.map(([k, l]) => `<button class="cov ${look.art === k ? 'on' : ''}" data-cover="${k}" aria-label="${l} 다이어리"><img src="${DY_IMG('diary_' + k)}" alt=""><i class="cb ${look.art === k ? 'on' : ''}"></i></button>`).join('')
      : `<div class="subtabs">${Object.entries(DY_STK_TAB).map(([k, l]) => `<button data-st="${k}" class="${k === stkTab ? 'on' : ''}">${l}</button>`).join('')}</div><p class="hint2">누르면 붙고, 끌어서 옮길 수 있어요</p>`
        + DY_STK.map(([t, v, w, g], i) => g !== stkTab ? '' : `<button data-add="${i}" aria-label="스티커 붙이기">${t === 'img' ? `<img src="${DY_IMG(v)}" alt="">` : `<span class="wd ${w}">${v}</span>`}</button>`).join('');
    fitDrawer(dr);
  }
  /* 서랍 (11/10 점검): 넘치면 아래쪽을 흐리게 덮고 '아래로 밀면 더 있어요' — 줄이 잘려 보이지 않게 */
  function fitDrawer(dr) {
    requestAnimationFrame(() => {
      dr.classList.remove('more'); dr.style.flex = ''; dr.style.height = '';
      const old = dr.querySelector('.more-tip'); if (old) old.remove();
      if (dr.scrollHeight <= dr.clientHeight + 2) return;
      dr.classList.add('more');
      const tip = document.createElement('div'); tip.className = 'more-tip'; tip.textContent = '▾ 아래로 밀면 더 있어요'; dr.appendChild(tip);
      const upd = () => tip.classList.toggle('gone', dr.scrollTop + dr.clientHeight >= dr.scrollHeight - 4); dr.onscroll = upd; upd();
    });
  }
  const save = () => DyLook.set(look);
  function dragify(el) {
    let st = null;
    el.addEventListener('pointerdown', ev => {
      if (ev.target.closest('.x')) return; ev.preventDefault(); el.setPointerCapture(ev.pointerId);
      const s = b.getBoundingClientRect().width / 1600; st = { x: ev.clientX, y: ev.clientY, l: parseFloat(el.style.left), t: parseFloat(el.style.top), s, m: false }; el.classList.add('drag');
    });
    el.addEventListener('pointermove', ev => {
      if (!st) return; const dx = (ev.clientX - st.x) / st.s, dy = (ev.clientY - st.y) / st.s; if (Math.abs(dx) + Math.abs(dy) > 6) st.m = true;
      el.style.left = Math.max(400, Math.min(1540, st.l + dx)) + 'px'; el.style.top = Math.max(0, Math.min(840, st.t + dy)) + 'px';
    });
    const up = () => {
      if (!st) return; el.classList.remove('drag'); const i = +el.dataset.i;
      look.placed[i].x = parseFloat(el.style.left); look.placed[i].y = parseFloat(el.style.top); save();
      if (!st.m) { root.querySelectorAll('#dz .stk').forEach(o => o !== el && o.classList.remove('sel')); el.classList.toggle('sel'); }
      st = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.querySelector('.x').addEventListener('click', e => { e.stopPropagation(); look.placed.splice(+el.dataset.i, 1); save(); playSfx('uncheck'); paint(); });
  }
  function bind() {
    const go = q('#go'); if (go) onTap(go, start);
    const ag = q('#again'); if (ag) onTap(ag, () => { playSfx('tap'); Router.go('S39'); });   // 지우기 확인은 S39에서 한 번만 (11/10)
    onTap(q('#print'), printDiary);
    onTap(q('#pass'), passOn);
    onTap(q('#saveImg'), saveImage);
    onTap(q('#toBoard'), () => {
      if (!sentReady) { playSfx('full'); toast('먼저 [이미지 저장]을 눌러요.'); return; }
      playSfx('tap'); window.open(BOARD, '_blank', 'noopener');
      toast('저장한 다이어리 이미지를 게시판에 올려 주세요.', 4000);
    });
  }
  /* 판 안 클릭은 한곳에서 */
  W.addEventListener('click', e => {
    const t = e.target;
    const sd = t.closest('[data-side]'); if (sd) { playSfx('tab'); if (sd.dataset.side === 'photo') return openPhoto(); sideTab = sd.dataset.side; paint(); return; }
    const cv = t.closest('[data-cover]'); if (cv) { playSfx('tap'); look.art = cv.dataset.cover; save(); paint(); return; }
    const sb = t.closest('[data-st]'); if (sb) { playSfx('tab'); stkTab = sb.dataset.st; paintDrawer(); return; }
    const ad = t.closest('[data-add]'); if (ad) {
      playSfx('tap'); look.placed.push({ k: +ad.dataset.add, x: 700 + Math.random() * 500, y: 220 + Math.random() * 420, r: Math.round(Math.random() * 16 - 8) }); save(); paint();
      const last = [...root.querySelectorAll('#dz .stk')].pop();
      if (last && last.animate) last.animate([{ transform: last.style.transform + ' scale(.3)' }, { transform: last.style.transform + ' scale(1.12)' }, { transform: last.style.transform }], { duration: 380, easing: 'ease-out' });
      return;
    }
    const cb = t.closest('button.cb[data-rule]'); if (cb) return check(cb.dataset.rule);
    const row = t.closest('.ti'); const rb = row && row.querySelector('button.cb[data-rule]'); if (rb) return check(rb.dataset.rule);   // 약속 줄 어디를 눌러도 체크 (11/10 점검)
    if (!t.closest('.stk')) root.querySelectorAll('#dz .stk.sel').forEach(o => o.classList.remove('sel'));
  });

  function start() {
    playSfx('start');
    const c = Challenge.create(cfg);
    const first = c.mode === 'free' ? '오늘' : DateK.short(c.days[0]);
    toast(c.mode === 'free' ? `오늘부터 ${c.weeks}주 안에 ${c.count}번 체크해요!` : `${first}부터 학교 가는 날 ${c.count}번 체크해요!`, 3000);
    if (TestMode.on && typeof TestBar !== 'undefined') TestBar.update();
    paint();
  }
  function check(id) {
    if (EV) { playSfx('full'); toast('체크는 인쇄한 다이어리에 집에서 해요.'); return; }
    const c = live(); if (!c) { playSfx('full'); toast('먼저 [챌린지 시작하기]를 눌러 주세요.'); return; }
    const m = dyModel(c); if (m.ti < 0) { playSfx('full'); toast(Challenge.status(c) === 'rest' ? '오늘은 쉬는 날이에요.' : Challenge.status(c) === 'before' ? '아직 시작 전이에요.' : '체크할 수 있는 날이 아니에요.'); return; }
    const d = m.slots[m.ti] || DateK.today();
    const e = c.log[d] = c.log[d] || {};
    m.rules.forEach(r => { if (!e[r.id]) e[r.id] = 'X'; });
    e[id] = e[id] === 'O' ? 'X' : 'O';
    playSfx(e[id] === 'O' ? 'check' : 'uncheck');
    Store.set('challenge', c);
    paint();
    const m2 = dyModel(c);
    const big = m2.got >= m2.n && !c.cele.done, small = !big && m2.got >= c.min && c.min < m2.n && !c.cele.min;
    if (big || small) { if (big) c.cele.done = true; else c.cele.min = true; Store.set('challenge', c); setTimeout(() => cele(big), 450); }
    if (TestMode.on && typeof TestBar !== 'undefined') TestBar.update();
  }

  /* ---------- 축하 창: 성공(작게) · 완성(크게) ---------- */
  function cele(big) {
    const c = live(), m = dyModel(c), n = m.n, k = big ? n : c.min;
    const hasP = !!(c.promise || '').trim();
    const pr = ((big ? c.praiseDone : c.praiseMin) || '').trim() || (big ? DY_SAMPLE.done : DY_SAMPLE.min);
    const tier = big ? `${n}일 모두 약속을 지켰어요!` : (n > k ? (hasP ? `${n - k}일 더 하면 완성! 선생님 약속을 받아요` : `${n - k}일 더 하면 ${n}일 챌린지 완성!`) : '');
    const box = document.createElement('div'); box.className = 'cele-wrap';
    box.innerHTML = `<div class="veil"></div><div class="cele ${big ? 'big' : ''}">
      <h3 class="ribbon ${big ? 'coral' : 'blue'}"><span>${big ? `${n}일 챌린지 완성!` : `${k}일 챌린지 성공!`}</span></h3>
      <div class="crow"><div class="bd"><div class="halo ${big ? 'big' : ''}"><div class="rays"></div>${big ? '<div class="rays2"></div>' : ''}<div class="glow"></div></div>${dyBadge(m.got, n, big)}</div>
        <div class="cmemo"><h5>선생님 한마디</h5><p>${dyEsc(pr)}</p>${big ? (hasP ? `<div class="coupon"><b>선생님 약속</b><span>${dyEsc(c.promise.trim())}</span></div>` : `<small>${tier}</small>`) : (tier ? `<small>${tier}</small>` : '')}</div></div>
      <div class="act"><button class="pbtn y" id="hang">다이어리에 붙이기 ›</button></div>
    </div><canvas class="conf" width="1600" height="900"></canvas>`;
    W.appendChild(box);
    const nb = document.getElementById('navBtns'); if (nb) nb.classList.add('cele-hide');   // 축하 장면에서는 이전·처음 숨김 (11/10)
    playSfx('fanfare'); dyConfetti(box.querySelector('canvas'), big ? 220 : 60, big);
    onTap(box.querySelector('#hang'), () => { playSfx('stamp'); box.remove(); if (nb) nb.classList.remove('cele-hide'); paint(); const a = q('.award'); if (a) replay(a, 'hang'); });
  }

  /* ---------- 내 사진: 카메라(3·2·1 찰칵) 또는 수호냥 ---------- */
  function openPhoto() {
    let stream = null, shot = null, pick = look.photo !== 'cam' ? look.photo : 'staff_hello', busy = false;
    const box = document.createElement('div'); box.className = 'ph-wrap';
    box.innerHTML = `<div class="veil lite"></div><div class="mdl" style="left:130px;top:56px;width:1340px;height:790px">
      <div class="mdl-h">내 사진 넣기<small>다이어리 첫 쪽 사진 칸에 들어가요</small></div>
      <ol class="pguide"><li><b>1</b>얼굴을 동그라미 안에 맞춰요</li><li><b>2</b>노란 셔터를 누르면 3, 2, 1 뒤에 찰칵!</li><li><b>3</b>마음에 들면 [이걸로 할래요]</li></ol>
      <div class="mdl-lbl" style="left:36px;top:146px">카메라로 찍기</div>
      <div class="cam" style="left:36px;top:180px;width:640px;height:500px"><div class="view"><video playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video><img class="shot" alt="" hidden style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>
        <div class="oval" style="width:260px;height:330px;top:46%"></div><div class="tip" id="camTip" style="font-size:24px">카메라를 켜는 중이에요…</div>
        <div class="cd" id="cd"></div><div class="flash" id="flash"></div>
        <button class="shut" id="shutBtn" aria-label="찍기" style="width:84px;height:84px;bottom:20px;cursor:pointer"></button></div>
      <div class="mdl-lbl" style="left:716px;top:146px">수호냥으로 하기</div>
      <div style="position:absolute;left:716px;top:180px;width:588px;display:flex;flex-direction:column;gap:14px">
        <p style="margin:0;font-size:22px">카메라를 쓸 수 없거나 사진을 넣기 싫으면 수호냥을 골라요.</p>
        <div class="tiles" style="grid-template-columns:repeat(4,1fr)">${DY_BUDDY.map(k => `<button type="button" data-buddy="${k}" class="${k === pick && look.photo !== 'cam' ? 'on' : ''}" style="height:136px"><img src="${DY_IMG(k === 'staff_guide' ? 'staff_guide' : k)}" alt=""></button>`).join('')}</div>
        <div style="display:flex;gap:14px;margin-top:24px"><button class="pbtn" id="retake" style="font-size:24px">다시 찍기</button><button class="pbtn y" id="use" style="font-size:24px">이걸로 할래요</button></div>
      </div>
      <button class="mdl-skip" id="later" style="left:36px;bottom:26px">나중에 넣을래요 ›</button></div>`;
    W.appendChild(box);
    const v = box.querySelector('video'), img = box.querySelector('img.shot'), tip = box.querySelector('#camTip'), cd = box.querySelector('#cd'), fl = box.querySelector('#flash');
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    const close = () => { stop(); box.remove(); };
    const camOn = () => {
      shot = null; img.hidden = true;
      if (PREVIEW) { tip.textContent = '미리 보기: 학생 태블릿에서는 여기에 카메라 화면이 나와요'; return; }   // 선생님 화면 미리 보기에서는 카메라를 켜지 않아요 (11/11)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { tip.textContent = '이 기기에서는 카메라를 쓸 수 없어요. 수호냥을 골라요.'; return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 } }, audio: false })
        .then(s => { if (!box.isConnected) { s.getTracks().forEach(t => t.stop()); return; } stream = s; v.srcObject = s; v.play().catch(() => {}); tip.textContent = '준비되면 노란 셔터를 눌러요'; })
        .catch(() => { tip.textContent = '카메라를 켤 수 없어요. 수호냥을 골라요.'; });
    };
    camOn();
    box.addEventListener('click', e => {
      const bd = e.target.closest('[data-buddy]'); if (!bd) return;
      playSfx('tap'); pick = bd.dataset.buddy; shot = null;
      box.querySelectorAll('[data-buddy]').forEach(x => x.classList.toggle('on', x === bd));
    });
    onTap(box.querySelector('#shutBtn'), () => {
      if (busy || !stream) { if (!stream) playSfx('full'); return; }
      busy = true; let k = 3; tip.textContent = '움직이지 말고 웃어요!';
      const step = () => {
        if (!box.isConnected) return;
        if (k > 0) { cd.textContent = k; replay(cd, 'pop'); dyBeep(k === 1 ? 880 : 660, .15); k--; setTimeout(step, 1000); return; }
        cd.textContent = ''; dyShutter(); replay(fl, 'go');
        const cv = document.createElement('canvas'), S = 360, vw = v.videoWidth || 640, vh = v.videoHeight || 480, side = Math.min(vw, vh);
        cv.width = S; cv.height = S; const x = cv.getContext('2d'); x.translate(S, 0); x.scale(-1, 1);
        x.drawImage(v, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, S, S);
        shot = cv.toDataURL('image/jpeg', .82); img.src = shot; img.hidden = false;
        box.querySelectorAll('[data-buddy]').forEach(b2 => b2.classList.remove('on'));
        tip.textContent = '마음에 들면 [이걸로 할래요]'; busy = false;
      };
      step();
    });
    onTap(box.querySelector('#retake'), () => { playSfx('tap'); shot = null; img.hidden = true; if (!stream) camOn(); else tip.textContent = '준비되면 노란 셔터를 눌러요'; });
    onTap(box.querySelector('#use'), () => {
      playSfx('save');
      if (shot) { look.photo = 'cam'; look.pic = shot; } else { look.photo = pick; look.pic = null; }
      save(); close(); paint();
    });
    onTap(box.querySelector('#later'), () => { playSfx('tap'); close(); });
    const obs = new MutationObserver(() => { if (!host.isConnected) { stop(); obs.disconnect(); } });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 이미지 저장 (11/10): 다이어리 + 스티커를 그림 한 장(PNG)으로
     섀도 DOM 안 모양을 SVG(foreignObject)에 통째로 담아 canvas에 그려요. 그림·글꼴은 모두 data URL로 넣어야 그려져요. */
  let saving = false;
  async function saveImage() {
    if (saving) return; saving = true; playSfx('tap');
    const btn = q('#saveImg'); if (btn) btn.textContent = '만드는 중…';
    try {
      const cv = await dyRender(dyModel(live() || Challenge.plan(cfg)), look);
      const tm = new Date(), p2 = n => String(n).padStart(2, '0');   // 행사용은 이름 대신 시각 (함께 쓰는 태블릿)
      await saveCanvasPNG(cv, EV ? `챌린지다이어리_${DateK.today().replace(/-/g, '').slice(4)}_${p2(tm.getHours())}${p2(tm.getMinutes())}${p2(tm.getSeconds())}.png`
        : `챌린지다이어리_${(Store.get('name', '') || '나').replace(/[^\w가-힣-]/g, '')}.png`);
      playSfx('save'); evSaved = true;
      const tb = q('#toBoard');
      if (tb) { sentReady = true; tb.disabled = false; tb.removeAttribute('aria-disabled'); tb.classList.add('ready'); toast('저장했어요! 이제 [게시판에 올리기]를 눌러요.', 2500); }
      else toast('다이어리 이미지를 저장했어요.', 1800);
    } catch (e) { toast(e && e.name === 'AbortError' ? '저장이 취소됐어요.' : '저장하지 못했어요. 다시 눌러 주세요.', 2500); }
    saving = false; const b2 = q('#saveImg'); if (b2) b2.textContent = '이미지 저장';
  }

  /* ---------- 인쇄 (A4 가로) : 종이용 양식 — 잉크 아끼는 표지, 메달·진행 막대 없이, 맨 아래 확인란 ---------- */
  function printDiary() {
    playSfx('tap'); evPrinted = true;
    const m = model();
    let pa = document.getElementById('printArea');
    if (!pa) { pa = document.createElement('div'); pa.id = 'printArea'; pa.className = 'print-only'; document.body.appendChild(pa); }
    pa.innerHTML = '';
    const h = document.createElement('div'); h.className = 'dy-print'; pa.appendChild(h);
    const r = h.attachShadow({ mode: 'open' });
    r.innerHTML = `<link rel="stylesheet" href="./css/diary.css">${DY_STAR_DEF}<div class="a4p">${dyDiary(m, look, { print: true })}${look.placed.map(st => ({ ...st, x: st.x - 402, y: st.y - 46 })).map(dyStk).join('')}</div>`;
    const link = r.querySelector('link');
    const go = () => setTimeout(() => window.print(), 250);
    if (link.sheet) go(); else link.addEventListener('load', go, { once: true });
  }

  /* 행사용: 다음 친구에게 넘기기 (카드 꾸미기와 같은 안내) */
  function passOn() {
    const del = '함께 쓰는 태블릿이에요. <b class="red">사진첩에 저장한 내 이미지는 지워 주세요.</b>';
    const msg = evSaved ? (BOARD ? '게시판에 올렸나요?<br>' : '') + del
      : evPrinted ? '내 기록이 지워지고, 다음 친구가 처음부터 시작해요.'
      : '<b class="red">아직 인쇄하거나 저장하지 않았어요.</b><br>넘기면 내 다이어리가 사라져요.';
    const m = Modal.open(`<div class="pop-head">다음 친구에게 넘길까요?</div><p class="pop-body">${msg}</p>
      <div class="pop-btns"><button class="btn white" data-autofocus id="pNo">아직이에요</button><button class="btn pink" id="pYes">네, 넘길게요</button></div>`);
    onTap($('#pNo', m), () => Modal.close());
    onTap($('#pYes', m), () => { Modal.close(); playSfx('delete'); Store.clearAll(); NavBtns.depth = 0; const pa = document.getElementById('printArea'); if (pa) pa.innerHTML = ''; Router.go('S39', {}, { replace: true }); toast('다음 친구 차례예요!', 2000); });
  }

  paint();
  if (!EV && p.install && !isStandalone()) setTimeout(openInstallModal, 300);
  if (p.photo && cfg.photo !== false) setTimeout(openPhoto, 300);   // 선생님 미리 보기 '사진 찍기' (11/11)
  /* 들어왔을 때 아직 못 본 축하가 있으면 */
  const c0 = live();
  if (c0) { const m0 = dyModel(c0); if (m0.got >= m0.n && !c0.cele.done) { c0.cele.done = true; Store.set('challenge', c0); setTimeout(() => cele(true), 500); } else if (m0.got >= c0.min && c0.min < m0.n && !c0.cele.min) { c0.cele.min = true; Store.set('challenge', c0); setTimeout(() => cele(false), 500); } }
};
Router.screens.S47 = Router.screens.S46;
Router.screens.S46P = (app, p = {}) => Router.screens.S46(app, { ...p, photo: true });   // 미리 보기: 사진 찍기 창을 연 모습

/* ---------- 다이어리를 canvas로 (이미지 저장) ---------- */
const dyDataURL = (() => { const memo = {}; return url => memo[url] || (memo[url] = fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.blob(); })
  .then(b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); }))); })();
/* 글꼴: 구글 글꼴 CSS에서 다이어리 글자가 들어 있는 조각만 골라 data URL로 (못 받으면 기본 글꼴로) */
async function dyFontCSS(text) {
  try {
    const href = (document.querySelector('link[href*="fonts.googleapis.com/css"]') || {}).href; if (!href) return '';
    const css = await (await fetch(href)).text();
    const codes = [...new Set([...text].map(ch => ch.codePointAt(0)))];
    const hit = rng => rng.split(',').some(r => { r = r.trim().replace(/^U\+/i, ''); const [a, b] = r.split('-'); const lo = parseInt(a.replace(/\?/g, '0'), 16), hi = b ? parseInt(b, 16) : parseInt(a.replace(/\?/g, 'F'), 16); return codes.some(c => c >= lo && c <= hi); });
    const blocks = (css.match(/@font-face\s*{[^}]*}/g) || []).filter(bk => { const m = bk.match(/unicode-range:\s*([^;]+);/); return !m || hit(m[1]); });
    const out = await Promise.all(blocks.map(async bk => { const u = (bk.match(/url\(([^)]+)\)/) || [])[1]; if (!u) return ''; try { return bk.replace(u, await dyDataURL(u.replace(/['"]/g, ''))); } catch (e) { return ''; } }));
    return out.join('\n');
  } catch (e) { return ''; }
}
async function dyRender(m, look, scale = 1.5) {
  const X = 380, Y = 0, W = 1220, H = 900;   // 왼쪽 도구 칸은 빼고 다이어리 쪽만
  let css = await (await fetch('./css/diary.css')).text();
  const abs = u => new URL(u, location.href.replace(/[^/]*$/, '') + 'css/').href;
  for (const u of [...new Set((css.match(/url\(([^)]+)\)/g) || []).map(x => x.slice(4, -1).replace(/['"]/g, '')))]) { try { css = css.split(`url(${u})`).join(`url(${await dyDataURL(abs(u))})`); } catch (e) {} }
  css = css.replace(':host{', '.dyroot{');
  const box = document.createElement('div');
  box.innerHTML = `${DY_STAR_DEF}<div class="dyb"><div id="dz">${dyDiary(m, look)}${look.placed.map(dyStk).join('')}</div></div>`;
  box.querySelectorAll('.stk .x').forEach(x => x.remove());
  for (const im of box.querySelectorAll('img')) { const s = im.getAttribute('src'); if (s && !s.startsWith('data:')) try { im.setAttribute('src', await dyDataURL(s)); } catch (e) {} }
  for (const im of box.querySelectorAll('image')) { const s = im.getAttribute('href'); if (s && !s.startsWith('data:')) try { im.setAttribute('href', await dyDataURL(s)); } catch (e) {} }
  const font = await dyFontCSS(box.textContent);
  const root = document.createElement('div'); root.className = 'dyroot'; root.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  root.style.cssText = `width:1600px;height:900px;position:relative;background:#F8EFE2;transform:translate(${-X}px,${-Y}px)`;
  root.innerHTML = `<style>${font}\n${css}\n.dyb{background:none}</style>` + box.innerHTML;
  const xhtml = new XMLSerializer().serializeToString(root);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="1600" height="900">${xhtml}</foreignObject></svg>`;
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  try { await img.decode(); } catch (e) {}
  await new Promise(r => setTimeout(r, 120));   // 글꼴이 그려질 틈
  const cv = document.createElement('canvas'); cv.width = W * scale; cv.height = H * scale;
  const g = cv.getContext('2d'); g.fillStyle = '#F8EFE2'; g.fillRect(0, 0, cv.width, cv.height);
  g.drawImage(img, 0, 0, cv.width, cv.height);
  g.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}
Router.screens.S48 = Router.screens.S46;
