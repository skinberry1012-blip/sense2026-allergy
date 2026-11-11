/* =========================================================
   app.js — 화면 (S39~S48 · 선생님 설정 S49) 과 앱 시작 — 연구소 S00~S38A는 lab.js
   화면 이름: S39, S40, RULES(S41), S44, S46(+S45·체크 팝업), S47, S48(+S48-2 메달·S48-3 삭제), T49(S49 선생님 설정)
   ========================================================= */
'use strict';

/* 수호냥 그림 (예전 핑크 고양이 pinky_01~05 자리를 그대로 이어받음: 인사·하트·안내·엄지·만세) */
const PINKY = { pinky_01: 'staff_hello', pinky_02: 'staff_heart', pinky_03: 'staff_guide', pinky_04: 'staff_thumb', pinky_05: 'staff_cheer' };
const CAT = k => `assets/char/${PINKY[k] || k}_t.png`;
const pawSVG = () => '';   // 발바닥 무늬는 출입증·수첩·발견 도장에만 (팀 결정)
const openTeacher = from => Router.go('T49', { returnTo: from });

/* ===================== S39 시작 화면 =====================
   연구소 화면과 같은 판(1600×900) 위에 수호냥 + 말풍선 + 버튼 (11/10) */
Router.screens.S39 = (app) => {
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-s39' });
  labPanel(b, { sub: '나만의 알레르기 방패', title: '방패 만들기' });
  labChar(b, 'staff_guide', 600, { left: 70, bottom: 10 });
  if (Config.isEvent()) orgDoor(b, labEl(b, 'lab-org', null, '<b>SENSE</b><span>초등보건교육연구회</span>'), 'S39');   // 행사용 첫 화면에도 연구회 이름 + 선생님 화면 입구 (11/11)
  const bub = labBubble(b, { x: 760, y: 330, w: 720, fs: 42, tail: 'l', name: '수호냥', staff: true });   // 수호냥 몸 가운데 높이에 맞춤 (11/10)
  /* 11/11: 버튼은 '방패 만들러 출발!', 말풍선은 수업용·행사용(활동과 상관없이) 모두 같은 말로 통일 */
  bub.say('알레르기로부터 지켜 줄<br>{{나만의 방패}}를 만들어 보자!');
  const start = labBtn(b, '방패 만들러 출발! ›', 'top:640px;width:520px;box-sizing:border-box;text-align:center;font-size:46px', 'y beat');
  start.style.left = Math.round(bub.offsetLeft + bub.offsetWidth / 2 - 260) + 'px';   // 말풍선 가운데 아래 (글자가 짧아도 버튼 너비는 고정)
  onTap(start, () => {
    playSfx('next');
    /* 행사용 (11/10 최종): 함께 쓰는 태블릿 — 시작할 때마다 깨끗하게 (카드를 저장하기 전에 떠난 사람의 이름·약속·서명까지) */
    if (Config.isEvent()) {
      const had = Store.hasAny(); Store.clearAll(); NavBtns.depth = 0;
      if (had) toast('앞 친구 기록을 지우고 시작할게요.', 2200);
      return Router.go('S40', {}, { replace: true });
    }
    if (!Store.hasRecord()) return Router.go('S40');
    const back = () => Router.go('S46');
    const m = Modal.open(`
      <div class="pop-head orange">⚠ 새 약속 카드를 만들까요?</div>
      <p class="pop-body">새로 만들면 지금까지의 <b class="red">약속 카드와 챌린지 기록이 지워져요.</b></p>
      <p class="pop-small">이미 저장한 카드·다이어리 이미지(PNG)는 지워지지 않아요.</p>
      <div class="pop-btns"><button class="btn blue" data-autofocus id="mBack">내 챌린지로 돌아가기</button><button class="btn red" id="mNew">새로 만들기</button></div>`,
      { onBack: back });
    onTap($('#mBack', m), () => { playSfx('tap'); Modal.close(); back(); });
    onTap($('#mNew', m), () => { playSfx('delete'); Store.clearAll(); Modal.close(); history.replaceState(null, ''); Router.go('S40', {}, { replace: true }); });
  });
};

/* ===================== S40 이름 입력 =====================
   바깥 상자 없이: 수호냥 + 말풍선 + 이름 칸, 버튼은 따로 오른쪽 아래 (11/10) */
Router.screens.S40 = (app) => {
  const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-s40' });
  labPanel(b, { sub: '나만의 알레르기 방패', title: '이름 쓰기' });
  labChar(b, 'staff_hello', 560, { left: 14, bottom: 10 });   // 좌우 여백 맞춤 (11/10)
  /* 말풍선 안에 이름 칸 (11/10 다시): 수호냥이 묻고, 말풍선 안에서 바로 써요 */
  const bub = labEl(b, 'px-bub tail-l name-bub', null, `<span class="px-name s">수호냥</span>
    <div class="px-bub-txt">${Config.isEvent() ? '약속 카드에 들어갈<br>{{이름}}이나 별명을 써 보아요!' : '약속 카드에 들어갈<br>{{이름}}을 입력해 보아요!'}</div>
    <label class="name-px"><input id="name" type="text" maxlength="12" placeholder="이름 (번호도 쓸 수 있어요)" autocomplete="off" enterkeyhint="done" aria-label="이름"><span class="count" id="count">0/${NAME_MAX}</span></label>
    <i class="t1"></i><i class="t2"></i>`.replace(/\{\{(.+?)\}\}/g, '<b class="lc">$1</b>'), 'div', 'left:694px;top:300px;width:700px');
  const field = $('.name-px', bub);
  const make = labBtn(b, '내 카드 만들기 ›', 'right:206px;top:704px;font-size:38px', 'y');   // 말풍선 아래 오른쪽 끝 맞춤
  const input = $('#name', field);
  let composing = false;
  const clean = v => v.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\- ]/g, '').replace(/^ +/, '').replace(/ {2,}/g, ' ');   // 번호·반 번호 허용 (5-3 김건강, 12번)
  const enforce = () => { let v = clean(input.value); if ([...v].length > NAME_MAX) v = [...v].slice(0, NAME_MAX).join(''); if (v !== input.value) input.value = v; };
  const render = () => {
    const len = [...input.value.trim()].length;
    $('#count', field).textContent = `${Math.min(len, NAME_MAX)}/${NAME_MAX}`;
    make.classList.toggle('off', !len); make.setAttribute('aria-disabled', String(!len));
    field.classList.toggle('filled', !!len);
  };
  input.addEventListener('compositionstart', () => (composing = true));
  input.addEventListener('compositionend', () => { composing = false; enforce(); render(); });
  input.addEventListener('input', () => { if (!composing) enforce(); render(); });
  input.addEventListener('blur', () => { enforce(); render(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) go(); });
  const go = () => {
    enforce(); const n = input.value.trim();
    if (!n) { playSfx('full'); replay(field, 'shake'); input.focus(); return; }
    Store.set('name', n); playSfx('next'); Router.go('RULES', { tab: 0 });
  };
  onTap(make, go);
  input.value = Store.get('name', ''); render();
};

/* ===================== S41 약속 고르기 (11/10 다시) =====================
   연구소 판 위에: 왼쪽 수호냥 + 말풍선, 오른쪽 다이어리의 '실천한 약속' 칸과 같은 목록
   장소(집 · 학교 · 밖)마다 1가지씩 꼭 고르고, '나만의 약속'은 직접 써서 2개까지 더할 수 있어요. 고르면 바로 저장돼요. */
const RULE_TABS = [['home', '집에서'], ['school', '학교에서'], ['outside', '밖에서'], ['mine', '나만의 약속']];
Router.screens.RULES = (app, p) => {
  if (!Store.get('name', '')) return Router.go('S40', {}, { replace: true });   // 이름 없이 들어오면(넘긴 뒤 뒤로 가기 등) 이름 쓰기부터 (11/10)
  let tab = Math.max(0, Math.min(3, p.tab | 0));
  const empty = () => ({ home: [], school: [], outside: [] });
  const rules = Object.assign(empty(), Store.get('rules', empty()));
  const custom = Object.assign({ mine: [] }, Store.get('custom', {}));
  PLACES.forEach(pl => { rules[pl] = (rules[pl] || []).filter(id => window.RULES_DATA[pl].rules.some(r => r.id === id)).slice(0, 1); });   // 장소마다 1개
  custom.mine = (custom.mine || []).slice(0, MINE_MAX);
  const save = () => { Store.set('rules', rules); Store.set('custom', custom); };
  const done = pl => pl === 'mine' ? custom.mine.some(c => c.checked) : rules[pl].length > 0;
  const allPlaces = () => PLACES.every(done);

  const b = labBoard(app, LAB.bg.lab, { dim: 'cream', cls: 'lab-rules' });
  labPanel(b, { sub: '나만의 알레르기 방패', title: '실천 약속 고르기' });
  /* 배치 (11/10): 수호냥 왼쪽(보이는 몸 왼끝 70), 말풍선은 머리 위, 상자는 오른쪽 여백 70 */
  labChar(b, 'staff_guide', 500, { left: -40, bottom: 10 });
  const bub = labBubbleAt(labBubble(b, { x: 70, y: 0, w: 430, fs: 30, tail: 'bl', name: '수호냥', staff: true }), { bottom: 504, tailX: 190 });   // 11/10: 귀 끝에 겹치지 않게 조금 위로
  const box = labEl(b, 'rl-box', [560, 156, 970, 616]);   // 제목 아래 ~ 버튼 위 사이 가운데 (장소 고르기 2×2 · 약속 상자)
  const NEXT_TXT = Config.isEvent() && !Config.evCard() ? '다이어리 꾸미기로 ›' : '카드 꾸미기로 ›';   // 행사용 '다이어리만' (11/11)
  const next = labBtn(b, NEXT_TXT, 'right:70px;top:800px;font-size:38px', 'y beat');

  /* 순서대로 (11/10): 집 → 학교 → 밖 → 나만의 약속(선택) → 카드 꾸미기. 하나 고르면 다음 장소로 넘어가요 */
  let step = Math.max(0, Math.min(3, p.step != null ? p.step | 0 : (PLACES.findIndex(pl => !done(pl)) + 1 || 4) - 1));
  const say = () => {
    const k = RULE_TABS[step][0];
    if (k === 'mine') return bub.say(allPlaces() ? '내가 지킬 약속을<br><b class="kw light">직접</b> 적어도 좋아!' : '집 · 학교 · 밖에서<br>하나씩 먼저 정해 줘!', false);
    bub.say(allPlaces() ? '모두 정했어!<br><b class="kw light">카드 꾸미기</b>로 가 보자!' : done(k) ? '좋아! 위의 <b class="kw light">장소</b>를 눌러<br>다른 곳도 정해 봐!' : '여기서 꼭 지킬 것을<br><b class="kw light">하나</b> 정해 봐!', false);
  };
  const render = () => {
    const pl = RULE_TABS[step][0];
    let body;
    if (pl !== 'mine') {
      body = window.RULES_DATA[pl].rules.map((r, n) =>
        `<button class="ti ${rules[pl][0] === r.id ? 'on' : ''}" data-id="${r.id}"><span class="tno">${n + 1}</span><span class="tt">${esc(r.text)}</span><i class="cb ${rules[pl][0] === r.id ? 'on' : ''}"></i></button>`).join('');
    } else {
      const d = window.RULES_DATA.mine;
      body = custom.mine.map((c, j) => `<div class="ti ${c.checked ? 'on' : ''}" data-c="${j}" role="button" tabindex="0"><span class="tno">${j + 1}</span><span class="tt">${esc(c.text)}</span><button class="del" data-d="${j}" aria-label="삭제">✕</button><i class="cb ${c.checked ? 'on' : ''}"></i></div>`).join('')
        + (custom.mine.length < MINE_MAX ? `<div class="rl-add"><p>${d.tip}</p><label class="name-px rl-in"><input id="cin" maxlength="${CUSTOM_MAX}" placeholder="${d.placeholder}" enterkeyhint="done" aria-label="나만의 약속"><span class="count" id="ccount">0/${CUSTOM_MAX}</span></label><button class="px-btn y rl-addbtn" id="cadd" type="button"><span>+ 추가</span></button></div>` : '')
        + `<p class="rl-note"><b>i</b>병 이름 같은 건강 정보는 적지 않아요. 나만의 약속은 내 카드에만 나와요.</p>`;
    }
    /* 위: 장소 그림 띠 + 장소 이름, 아래: 약속 목록 */
    /* 11/10: 상자 위 장소 배지(누르면 그 장소로) + 상자 머리 "학교에서는 이렇게 해요"(장소 형광펜) */
    const PB = { home: '🏠 집', school: '🏫 학교', outside: '🌳 밖', mine: '⭐ 나만의 약속' };
    const PH = { home: '<b class="pw pl-home">집</b>에서는 이렇게 해요', school: '<b class="pw pl-school">학교</b>에서는 이렇게 해요', outside: '<b class="pw pl-outside">밖</b>에서는 이렇게 해요', mine: '<b class="pw pl-mine">나만의 약속</b>을 적어 봐요' };
    const badges = RULE_TABS.map(([k], j) => { const ok = k !== 'mine' && done(k); return `<button type="button" class="rl-badge pl-${k} ${j === step ? 'cur' : ''} ${ok ? 'ok' : ''}" data-go="${j}">${PB[k]}${ok ? ' <i>✓</i>' : ''}</button>`; }).join('');
    box.innerHTML = `<div class="rl-stack"><div class="rl-badges">${badges}</div><div class="tlist rl-list"><div class="rl-pic pl-${pl}"><span class="rl-head">${PH[pl]}</span>${pl === 'mine' ? `<em>안 적어도 돼요 · ${MINE_MAX}개까지</em>` : ''}</div>${body}</div></div>`;
    const cin = $('#cin', box);
    if (cin) {
      cin.addEventListener('input', () => { $('#ccount', box).textContent = `${[...cin.value].length}/${CUSTOM_MAX}`; });
      cin.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) add(); });
      onTap($('#cadd', box), add);
    }
    /* 아래 버튼 (11/10): 장소 이동은 위 배지로만 — 집·학교·밖을 다 고르면 [카드 꾸미기로 ›] 하나만 나와요 */
    prev.hidden = true;
    $('span', next).textContent = NEXT_TXT;
    next.hidden = !allPlaces();
    say();
    /* 정리 (11/10): 상자 + 아래 버튼 줄을 한 묶음으로 제목 아래~화면 아래 사이 세로 가운데, 버튼은 오른쪽에 나란히 (끝 = 상자 끝) */
    requestAnimationFrame(() => {
      const list = $('.rl-stack', box); if (!list) return;
      const h = list.offsetHeight, bh = 70, gap = 26, y0 = 130, y1 = 880;
      const top = Math.round(y0 + Math.max(0, (y1 - y0 - (h + gap + bh)) / 2));
      box.style.top = top + 'px'; box.style.height = h + 'px';
      next.style.top = (top + h + gap) + 'px';
    });
  };
  const prev = labBtn(b, '‹', 'right:40px;top:800px;font-size:32px', 'w');
  const add = () => {
    const cin = $('#cin', box), v = (cin.value || '').trim(); if (!v) { playSfx('full'); replay(cin.parentNode, 'shake'); return; }
    const all = [...custom.mine.map(c => c.text), ...PLACES.flatMap(pl => window.RULES_DATA[pl].rules.map(r => r.text))];
    if (all.includes(v)) return toast('이미 있는 약속이에요.');
    custom.mine.push({ id: 'c' + Date.now().toString(36), text: v, checked: true }); save(); playSfx('check'); render();
  };
  const go = n => { step = n; render(); replay(box, 'pop'); };
  box.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { const j = +g.dataset.go; if (j !== step) { playSfx('tab'); go(j); } return; }
    const d = e.target.closest('[data-d]'); if (d) { e.stopPropagation(); custom.mine.splice(+d.dataset.d, 1); save(); playSfx('uncheck'); return render(); }
    const row = e.target.closest('.ti'); if (!row) return;
    const pl = RULE_TABS[step][0];
    if (row.dataset.id) {
      const on = rules[pl][0] === row.dataset.id;
      rules[pl] = on ? [] : [row.dataset.id]; playSfx(on ? 'uncheck' : 'check'); save(); render();
      return;
    }
    const cc = custom.mine[+row.dataset.c]; cc.checked = !cc.checked; save(); playSfx(cc.checked ? 'check' : 'uncheck'); render();
  });
  onTap(prev, () => { if (step > 0) { playSfx('tap'); go(step - 1); } });
  onTap(next, () => {
    if (!allPlaces()) { playSfx('full'); replay(next, 'shake'); go(PLACES.findIndex(x => !done(x))); return toast('집 · 학교 · 밖에서 하나씩 골라 주세요.'); }
    playSfx('next'); Router.go(Config.isEvent() && !Config.evCard() ? 'S46' : 'S44');   // 행사용 '다이어리만'은 카드 꾸미기를 건너뛰어요 (11/11)
  });
  render();
};

/* ===================== S44 카드 디자인 및 제작 ===================== */
let signatureImg = null; // 서명은 저장하지 않고 이 화면 메모리에만
/* 기록을 지울 때 서명도 함께 지워요 (11/10): 서명은 메모리에만 있어서 Store.clearAll로는 안 지워졌어요 — 다음 사람 카드에 앞 사람 서명이 나오던 문제 */
{ const clear = Store.clearAll; Store.clearAll = function () { signatureImg = null; return clear.apply(Store, arguments); }; }
Router.screens.S44 = (app) => {
  const st = { design: 'certificate', buddy: Store.get('buddy', 'pinky_01'), step: 1 };
  if (!BUDDIES[st.buddy]) st.buddy = 'pinky_01';   // 수호 친구는 4가지만 (11/9)
  const rules = selectedRules(), name = Store.get('name', '');
  /* 행사용 (11/10 최종): 함께 쓰는 태블릿 — 카드 이미지 저장·게시판 올리기(게시판이 없으면 인쇄·이미지 저장, 11/11 — 노담·헌혈처럼 휴대폰 찍기는 v1.0에서 넣지 않음) → 다음 친구에게 넘기기. 다이어리 없음 */
  const EV = Config.isEvent(), EVD = EV && Config.evDiary(), BOARD = EV && !EVD ? (Config.get().board || '') : '';   // 카드 + 다이어리면 게시판은 다이어리에서 (11/11)
  if (!rules.length) return Router.go(EV ? 'S39' : 'RULES', {}, { replace: true });   // 넘긴 뒤 뒤로 가기로 빈 카드가 열리지 않게
  let saved = false, savedImg = false;   // saved = 인쇄 또는 저장함, savedImg = 태블릿에 이미지를 저장함
  /* 배치 (11/9): 헌혈 임명장처럼 — 오른쪽 크게 약속 카드, 왼쪽에 수호 친구 고르기 · 저장 · 인쇄 · 처음으로 */
  app.innerHTML = `
  <div class="sc outdoor s44 s44b">
    <header class="s44-top">
      <h1 class="px-panel s44-title"><div><small>나만의 알레르기 방패</small><b>카드 꾸미기</b></div></h1>
    </header>
    <div class="s44b-body">
      <aside class="s44b-side">
        <section class="s44-box"><h3 class="box-tag">나의 수호 친구 고르기</h3><div class="buddies" id="buddies"></div></section>
        <div class="s44b-btns">
          ${!EV ? `<button class="btn pink" id="save">약속 카드 저장하기</button>
          <div class="s44b-row"><button class="btn white" id="print">인쇄하기</button><button class="btn white" id="home">처음으로</button></div>`
          : (BOARD ? `<button class="btn pink" id="save">① 카드 이미지 저장</button><button class="btn white ev-step" id="toBoard" disabled aria-disabled="true">② 게시판에 올리기</button>`
                   : `<div class="s44b-row ev-row"><button class="btn pink" id="print">인쇄하기</button><button class="btn white" id="save">이미지 저장</button></div>`)
            + (EVD ? `<button class="btn white ev-pass ev-next" id="toDiary">다이어리 꾸미기 ›</button>` : `<button class="btn white ev-pass" id="pass">다음 친구에게 넘기기 ›</button>`)}
        </div>
      </aside>
      <section class="s44b-card">
        <div class="preview-wrap" id="pvwrap"><canvas id="pv"></canvas></div>
      </section>
    </div>
  </div>`;
  const canvas = $('#pv');
  const cardDay = () => Store.get('cardDate', '') || DateK.today();
  let signAt = null;
  const draw = () => drawPromiseCard(canvas, { ...st, name, date: cardDay(), rules, sigImg: signatureImg, preview: true }).then(r => { signAt = r.sign; });
  const render = () => {
    $('#buddies').innerHTML = Object.entries(BUDDIES).map(([k, n]) => `<button class="buddy ${st.buddy === k ? 'on' : ''}" data-k="${k}" aria-label="수호냥 ${n}"><span class="tick">✓</span><img src="${CAT(k)}" alt=""></button>`).join('');
    draw();
  };
  $('#buddies').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; st.buddy = b.dataset.k; st.step = Math.max(st.step, 3); Store.set('buddy', st.buddy); playSfx('check'); render(); replay($(`.buddy[data-k="${st.buddy}"]`), 'hop'); });


  /* 서명 창: 미리보기 카드의 '다짐한 사람' 서명 줄을 누르면 열림 (헌혈 임명장처럼) */
  const onSeal = e => {
    if (!signAt) return false;
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * CARD_W / r.width, y = (e.clientY - r.top) * CARD_H / r.height;
    return x >= signAt[0] - 20 && x <= signAt[0] + signAt[2] + 20 && y >= signAt[1] - 20 && y <= signAt[1] + signAt[3] + 20;
  };
  canvas.addEventListener('pointermove', e => { canvas.style.cursor = onSeal(e) ? 'pointer' : ''; });
  canvas.addEventListener('click', e => { if (onSeal(e)) { playSfx('tap'); openSign(); } });
  const openSign = () => {
    const m = Modal.open(`
      <div class="pop-head">✍️ 직접 서명하기</div>
      <p class="pop-small">손가락이나 터치펜으로 이름을 써 주세요. 서명은 선택이에요.</p>
      <canvas class="sig-pad" id="pad" width="900" height="300"></canvas>
      <div class="pop-btns three"><button class="btn white" id="sClose">닫기</button><button class="btn white" id="sClear">다시 쓰기</button><button class="btn pink" id="sOk">서명 완료</button></div>`, { cls: 'sheet' });
    const pad = $('#pad', m), c = pad.getContext('2d'); let drawing = false, has = false, lastPt = null;
    c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1F2436';
    const pt = e => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; };
    pad.addEventListener('pointerdown', e => { drawing = true; lastPt = pt(e); pad.setPointerCapture(e.pointerId); });
    pad.addEventListener('pointermove', e => { if (!drawing) return; const p2 = pt(e); c.beginPath(); c.moveTo(...lastPt); c.lineTo(...p2); c.stroke(); lastPt = p2; has = true; });
    ['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, () => (drawing = false)));
    onTap($('#sClose', m), () => Modal.close());
    onTap($('#sClear', m), () => { c.clearRect(0, 0, pad.width, pad.height); has = false; });
    onTap($('#sOk', m), async () => {
      if (!has) { Modal.close(); return; }
      /* 쓴 부분만 잘라서 서명 줄 크기에 맞춰요 */
      const d = c.getImageData(0, 0, pad.width, pad.height).data; let x0 = pad.width, y0 = pad.height, x1 = 0, y1 = 0;
      for (let yy = 0; yy < pad.height; yy += 2) for (let xx = 0; xx < pad.width; xx += 2) if (d[(yy * pad.width + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      const pd = 10; x0 = Math.max(0, x0 - pd); y0 = Math.max(0, y0 - pd); x1 = Math.min(pad.width, x1 + pd); y1 = Math.min(pad.height, y1 + pd);
      const cut = document.createElement('canvas'); cut.width = Math.max(1, x1 - x0); cut.height = Math.max(1, y1 - y0); cut.getContext('2d').drawImage(pad, x0, y0, cut.width, cut.height, 0, 0, cut.width, cut.height);
      signatureImg = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = cut.toDataURL('image/png'); });
      Modal.close(); render();
    });
  };

  onTap($('#home'), () => {
    const m = Modal.open(`<div class="pop-head">처음 화면으로 갈까요?</div><p class="pop-body">만든 카드는 아직 저장되지 않았어요.</p>
      <div class="pop-btns"><button class="btn white" data-autofocus id="mNo">아니요</button><button class="btn pink" id="mYes">처음 화면으로</button></div>`);
    onTap($('#mNo', m), () => Modal.close());
    onTap($('#mYes', m), () => { Modal.close(); Router.go('S39'); });
  });

  /* 11/11 점검: 서명하지 않고 저장·인쇄를 누르면 한 번만 '서명을 하지 않았어요' 알림 — 한 번 더 누르면 그대로 진행 */
  let signWarned = false;
  const needSign = () => {
    if (signatureImg || signWarned) return false;
    signWarned = true;
    /* 배지 화면처럼 화면이 흐려지고 가운데 수호냥이 호루라기를 불며 알려요 — 잠깐 보였다가 사라짐(누르면 바로 닫힘) */
    const sc = document.getElementById('stage') || document.body;   // 화면 전체(판 1600×900)를 흐리게
    const w = document.createElement('div'); w.className = 'sign-warn';
    w.innerHTML = `<img class="sw-cat" src="assets/char/staff_cheer.png" alt="">
      <div class="px-bub tail-l sw-bub"><span class="px-name s">수호냥</span><div class="px-bub-txt"><b>잠깐만!</b><br>서명을 아직 안 했어요!</div><i class="t1"></i><i class="t2"></i></div>
      <div class="cope-siren sw-siren">${LAB_SIREN}</div>`;
    const bg = document.createElement('div'); bg.className = 'sign-warn-bg';   // 판 밖(태블릿 화면 가장자리)까지 화면 전체를 흐리게
    document.body.appendChild(bg); sc.appendChild(w);
    playSfx('whistle'); setTimeout(() => playSfx('warn'), 450);
    let gone = false; const close = () => { if (gone) return; gone = true; w.classList.add('out'); bg.classList.add('out'); setTimeout(() => { w.remove(); bg.remove(); }, 300); };
    bg.addEventListener('click', close);
    w.addEventListener('click', close); setTimeout(close, 2600);
    return true;
  };
  /* 인쇄: 저장용과 같은 카드를 그려서 인쇄 전용 칸에 넣고 인쇄 창을 열어요 */
  const doPrint = async () => {
    if (!Store.get('cardDate')) Store.set('cardDate', DateK.today());
    const out = document.createElement('canvas');
    await drawPromiseCard(out, { ...st, name, date: cardDay(), rules, sigImg: signatureImg, preview: false });
    let pa = document.getElementById('printArea');   // 화면 확대·축소의 영향을 받지 않게 body 바로 아래에
    if (!pa) { pa = document.createElement('div'); pa.id = 'printArea'; pa.className = 'print-only'; document.body.appendChild(pa); }
    pa.innerHTML = `<img src="${out.toDataURL('image/png')}" alt="알레르기 예방 약속 카드">`;
    playSfx('tap'); setTimeout(() => window.print(), 150);
    if (EV) saved = true;   // 행사용: 인쇄했으면 넘길 때 '카드가 사라져요' 경고 없이 (11/11)
  };
  onTap($('#print'), () => { if (!needSign()) doPrint(); });
  onTap($('#save'), async () => {
    if (needSign()) return;
    if (!Store.get('cardNo')) {
      const t = DateK.today().replace(/-/g, '').slice(0, 6);
      Store.set('cardNo', `AL-${t}-${String(Math.floor(1000 + Math.random() * 9000))}`);
    }
    const out = document.createElement('canvas');
    if (!Store.get('cardDate')) Store.set('cardDate', DateK.today());
    const res = await drawPromiseCard(out, { ...st, name, date: cardDay(), rules, sigImg: signatureImg, preview: false });
    if (!res.fit) {
      toast('약속이 카드에 다 들어가지 않아요. [다시 꾸미기]에서 약속을 줄이거나 짧게 고쳐 주세요.', 3500); return;
    }
    /* 행사용 파일 이름은 이름 대신 시각 (함께 쓰는 태블릿 사진첩에 이름이 쌓이지 않게, 같은 이름끼리 겹치지 않게) */
    const tm = new Date(), p2 = n => String(n).padStart(2, '0');
    const fname = EV ? `약속카드_${DateK.today().replace(/-/g, '').slice(4)}_${p2(tm.getHours())}${p2(tm.getMinutes())}${p2(tm.getSeconds())}.png`
      : `약속카드_${(name || '나').replace(/[^가-힣a-zA-Z0-9]/g, '')}_${DateK.today().replace(/-/g, '').slice(4)}.png`;
    try { await saveCanvasPNG(out, fname); }
    catch (e) { toast(e && e.name === 'AbortError' ? '카드 저장이 취소됐어요. 다시 눌러 주세요.' : '저장하지 못했어요. 다시 눌러 주세요.', 2500); return; }
    if (EV && !BOARD) { saved = savedImg = true; playSfx('save'); toast('카드 이미지를 저장했어요!', 2500); return; }
    if (EV) {
      saved = savedImg = true; playSfx('save');
      const tb = $('#toBoard'); if (tb) { tb.disabled = false; tb.setAttribute('aria-disabled', 'false'); tb.classList.add('ready'); }
      toast('카드를 저장했어요! 이제 ② 게시판에 올리기를 눌러요.', 3000);
      return;
    }
    st.step = 4; playSfx('save'); render();
    Store.set('design', st.design); Store.set('buddy', st.buddy);
    Router.go('S46', { install: !isStandalone() });
  });
  /* ---- 행사용 버튼 ---- */
  onTap($('#toBoard'), () => {
    if (!saved) { playSfx('full'); toast('먼저 ① 카드 이미지 저장을 눌러요.'); return; }
    playSfx('tap'); window.open(BOARD, '_blank', 'noopener');
    toast('게시판에 카드 이미지를 올린 뒤, 이 화면으로 돌아와 [다음 친구에게 넘기기]를 눌러요.', 5000);
  });
  onTap($('#toDiary'), () => { playSfx('next'); Store.set('buddy', st.buddy); Router.go('S46'); });   // 행사용 카드 + 다이어리 (11/11)
  onTap($('#pass'), () => {
    const del = '함께 쓰는 태블릿이에요. <b class="red">사진첩에 저장한 내 카드 이미지는 지워 주세요.</b>';
    const msg = !BOARD ? (savedImg ? del : saved ? '내 카드와 기록이 지워지고, 다음 친구가 처음부터 시작해요.' : '<b class="red">아직 인쇄하거나 저장하지 않았어요.</b><br>넘기면 내 카드가 사라져요.')
      : saved ? '게시판에 올렸나요?<br>' + del
      : '<b class="red">아직 카드를 저장하지 않았어요.</b><br>넘기면 내 카드가 사라져요.';
    const m = Modal.open(`<div class="pop-head">다음 친구에게 넘길까요?</div><p class="pop-body">${msg}</p>
      <div class="pop-btns"><button class="btn white" data-autofocus id="pNo">아직이에요</button><button class="btn pink" id="pYes">네, 넘길게요</button></div>`);
    onTap($('#pNo', m), () => Modal.close());
    onTap($('#pYes', m), () => { Modal.close(); playSfx('delete'); Store.clearAll(); NavBtns.depth = 0; const pa = document.getElementById('printArea'); if (pa) pa.innerHTML = ''; Router.go('S39', {}, { replace: true }); setTimeout(() => toast('다음 친구 차례예요!', 2200), 450); });
  });
  render();
};

/* ===================== S45 앱 설치 안내 (S46 위 팝업) ===================== */
function openInstallModal() {
  const ios = isIOS();
  /* 아이폰·아이패드: Safari와 홈 화면 앱은 저장 공간이 따로 → 기록을 주소 # 뒤에 담아 둠 (서버로 전송 안 됨) */
  try {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(Store.snapshot()))));
    history.replaceState(Router.current, '', location.pathname + location.search + '#restore=' + b64);
  } catch (e) {}
  /* 11/10 정리: 제목 · 수호냥 · 말풍선 · [홈 화면에 추가하고 시작하기] 하나만.
     안드로이드: 버튼 → 기기 설치 창 → 결과와 상관없이 다이어리로. 아이폰: 설치 창을 띄울 수 없어 말풍선에 방법을 적고 버튼은 시작하기 */
  /* 11/10: 제목 대신 대화 — 친구들 "약속 카드 완성!" → 수호냥 "이제 챌린지를 시작해요!" (말풍선 둘) */
  const say = ios
    ? '이제 챌린지를 시작해요!<br>사파리 {{공유 ⇧ → 홈 화면에 추가}}를 누르면<br>매일 쉽게 열 수 있어요.'
    : '이제 챌린지를 시작해요!<br>{{홈 화면에 추가}}해 두면<br>매일 쉽게 열 수 있어요.';
  const bub = (cls, name, nameCls, html) => `<div class="px-bub ${cls}"><span class="px-name ${nameCls}">${name}</span><div class="px-bub-txt">${labFmt(html)}</div><i class="t1"></i><i class="t2"></i></div>`;
  const m = Modal.open(`
    <div class="install talk">
      <div class="it-stage">
        <img class="it-kid g" src="assets/kid/kid_girl.png" alt="">
        ${bub('tail-bl it-kb', '', '', '나만의 알레르기<br>{{실천 약속 카드}} 완성!')}
        <img class="it-cat" src="assets/char/staff_hello.png" alt="">
        ${bub('tail-br it-cb', '수호냥', 's', say)}
      </div>
      <button class="btn pink big" id="iMain">${ios ? '시작하기 ›' : '＋ 홈 화면에 추가하고 시작하기 ›'}</button>
    </div>`, { cls: 'install-dim', onBack: () => closeInstall() });
  const closeInstall = () => {
    Modal.close();
    history.replaceState({ s: 'S46', p: {} }, '', location.pathname + location.search + location.hash);
    Router.current = { s: 'S46', p: {} };
    if (ios && !sessionStorage.getItem('sevenDayTip')) { sessionStorage.setItem('sevenDayTip', '1'); toast('사파리에서 7일 동안 열지 않으면 기록이 지워질 수 있어요. 매일 들어와 주세요!', 4000); }
  };
  onTap($('#iMain', m), async () => {
    if (!ios && deferredInstall) {
      try { deferredInstall.prompt(); await deferredInstall.userChoice; } catch (e) {}
      deferredInstall = null;
    }
    closeInstall();
  });
}

/* S46~S48 (5일 챌린지 체크·결과·메달)은 챌린지 다이어리(js/diary.js)로 바뀌었어요 (11/10) */

/* ===================== S49 선생님 설정 (탭 2개 · 큰 미리 보기) — 2026-11-09 새 구도 =====================
   참고: 확정 그림 모음 16쪽 시안 (한 줄 제목 · 접는 탭 · 번호 붙은 칸)
   버튼은 세 가지만: .tc-btn.pri(주 버튼, 화면에 하나) · .tc-btn(보조) · .tc-seg(고르기)
   스타일은 css/teacher.css */
const isHttps = s => /^https:\/\/\S+$/i.test(s);
const DEMO_BASE = 'https://skinberry1012-blip.github.io/sense2026-allergy/';   // 내 컴퓨터에서 열 때 보여 줄 예시 주소
/* 미리 보기에서 열어 볼 화면 (연구소 · 약속 카드) */
const PREVIEW_STEPS = {
  lab:  [['S00', '처음'], ['S01', '이야기'], ['S05', '미션 고르기'], ['S06', '집'], ['S15', '급식실'], ['S24', '운동장'], ['S36-3', '증상 카드'], ['S37', '대처 방법'], ['S38A', '기억 체크']],
  card: [['S39', '시작'], ['S40', '이름'], ['RULES', '약속 고르기'], ['S44', '카드 꾸미기'], ['S46', '다이어리'], ['S47', '성공 메달'], ['S48', '완성']]
};
const T_FLOW = {
  class: ['미션 · 숨은 알레르기 원인 12가지 찾기', '증상 카드 · 대처 방법 익히기', '나만의 예방 약속 카드 만들기', '챌린지 다이어리 꾸미기 → 매일 체크 → 메달'],
  event: ['나만의 예방 약속 카드 만들기', '카드 이미지를 게시판에 올리기 (게시판이 없으면 인쇄하거나 이미지로 저장하기)', '다음 친구에게 넘기기 (이 태블릿 기록 지움)']
};
/* 행사용 학생 흐름 (11/11): 행사 활동에 따라 */
const T_EVFLOW = (a, board) => {
  const keep = board ? '게시판에 올리기' : '인쇄하거나 이미지로 저장하기';
  return a === 'diary' ? ['나만의 예방 약속 고르기', `챌린지 다이어리 꾸미기 → ${keep} (체크는 집에서 종이에)`, '다음 친구에게 넘기기 (이 태블릿 기록 지움)']
    : a === 'both' ? ['나만의 예방 약속 카드 만들기 → 인쇄하거나 이미지로 저장하기', `챌린지 다이어리 꾸미기 → ${keep} (체크는 집에서 종이에)`, '다음 친구에게 넘기기 (이 태블릿 기록 지움)']
    : ['나만의 예방 약속 카드 만들기', `카드 ${board ? '이미지를 게시판에 올리기' : '인쇄하거나 이미지로 저장하기'}`, '다음 친구에게 넘기기 (이 태블릿 기록 지움)'];
};
Router.screens.T49 = (app, p) => {
  const returnTo = p.returnTo || 'S00';
  let tab = p.tab || 1, d = Draft.get(), dev = 'tablet', view = Draft.get().mode === 'event' ? 'card' : 'lab';
  const step = { lab: 'S00', card: 'S39' };   // 부분마다 마지막으로 연 화면
  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const base = local ? DEMO_BASE : location.origin + location.pathname;
  const okBoard = () => d.board && isHttps(d.board);
  const dy = () => Object.assign({}, DY_DEF, d.dy || {});
  /* 챌린지 다이어리 설정도 학생 링크에 담아요: dy=횟수.방식.주.성공기준.사진.확인란 · 문구는 dp(약속) dm(성공 칭찬) dd(완성 칭찬) */
  const dyQuery = () => { const y = dy(); return `&dy=${y.count}.${y.mode === 'free' ? 'f' : 'r'}.${y.weeks}.${y.min}.${y.photo === false ? 0 : 1}.${y.tsign === 'n' ? 'n' : 't'}`
    + (y.promise.trim() ? '&dp=' + encodeURIComponent(y.promise.trim()) : '') + (y.praiseMin.trim() ? '&dm=' + encodeURIComponent(y.praiseMin.trim()) : '') + (y.praiseDone.trim() ? '&dd=' + encodeURIComponent(y.praiseDone.trim()) : ''); };
  const query = () => '?mode=' + (d.mode === 'event' ? 'event&ev=' + evA()[0] : 'class') + (okBoard() ? '&board=' + encodeURIComponent(d.board) : '') + (d.sound === 'off' ? '&sound=off' : '') + dyQuery();
  const urlOf = () => base + query();
  const modeName = () => d.mode === 'event' ? '행사용' : '수업용';
  /* 행사 활동 (11/11): d.ev = 'card' | 'diary' | 'both', 기본 약속 카드만 */
  const evA = () => d.ev === 'diary' || d.ev === 'both' ? d.ev : 'card', evC = () => evA() !== 'diary', evD = () => evA() !== 'card';
  const evName = () => ({ card: '약속 카드', diary: '다이어리', both: '약속 카드 + 다이어리' })[evA()];
  const BOARD_HELP = () => d.mode === 'event' ? `${evA() === 'card' ? '약속 카드' : '챌린지 다이어리'} 이미지를 올릴 패들렛·띵커벨 보드 주소예요.` : '챌린지 다이어리 이미지를 올릴 패들렛·띵커벨 보드 주소예요.';
  app.innerHTML = `<div class="sc tgx">
    <header class="tc-head">
      <h1 class="tc-title">냥박사의 알레르기 연구소 <span>선생님 설정</span></h1>
      <p class="tc-sub">학생에게 QR을 나눠 주기 전에 정해 주세요</p>
    </header>
    <nav class="tc-tabs" role="tablist"><button class="tc-tab" data-t="1" role="tab"><b>01</b> 기본 설정</button><button class="tc-tab" data-t="2" role="tab"><b>02</b> 챌린지 다이어리</button><button class="tc-tab" data-t="3" role="tab"><b>03</b> QR 코드와 공유</button></nav>
    <section class="tc-panel" id="panel"></section>
  </div>`;
  const viewName = () => step[view];
  const pvSrc = () => `index.html${query()}&preview=1&view=${viewName()}`;
  const fitFrame = () => {
    const f = $('#frame'), ifr = $('#pv'); if (!f) return;
    const W = dev === 'tablet' ? 1600 : 852, H = dev === 'tablet' ? 900 : 393, s = Math.min(f.clientWidth / W, f.clientHeight / H);
    Object.assign(ifr.style, { width: W + 'px', height: H + 'px', transform: `translate(-50%,-50%) scale(${s})` });
  };
  const seg = (k, opts, cur) => `<span class="tc-seg" data-k="${k}">${opts.map(([v, n]) => `<button data-v="${v}" class="${v === cur ? 'on' : ''}">${n}</button>`).join('')}</span>`;
  const paintSeg = (k, v) => $$(`.tc-seg[data-k="${k}"] button`).forEach(x => x.classList.toggle('on', x.dataset.v === v));
  const drawPrev = () => {
    if (tab === 2) { $('#pv').src = `index.html${query()}&preview=1&view=${step.dy || 'S46'}`; fitFrame(); return; }
    if (tab !== 1) return;
    if (d.mode === 'event' && view === 'lab') view = 'card';
    paintSeg('view', view);
    $('#steps').innerHTML = PREVIEW_STEPS[view].filter(([k]) => !(d.mode === 'event' && (/^S4[78]$/.test(k) || (k === 'S46' && !evD()) || (k === 'S44' && !evC())))).map(([k, n]) => `<button data-s="${k}" class="${k === step[view] ? 'on' : ''}">${n}</button>`).join('');
    $$('.tc-seg[data-k="view"] button').forEach(x => { x.disabled = x.dataset.v === 'lab' && d.mode === 'event'; });
    $('#pv').src = pvSrc(); fitFrame();
  };

  /* QR 이미지 저장 (칠판·학습지에 붙이기) */
  const saveQR = async () => {
    const W = 1000, H = 1240, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1E2A5A'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
    g.fillStyle = '#1E2A5A'; g.textAlign = 'center';
    g.font = '64px Jua, sans-serif'; g.fillText('냥박사의 알레르기 연구소', W / 2, 130);
    g.font = '40px "Gowun Dodum", sans-serif'; g.fillStyle = '#4A5578';
    g.fillText(`${modeName()} · 스캔하세요`, W / 2, 200);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej;
      i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(QR.toSVG(urlOf())); });
    g.imageSmoothingEnabled = false; g.drawImage(img, 150, 260, 700, 700);
    g.font = '30px "Gowun Dodum", sans-serif'; g.fillStyle = '#1E2A5A';
    const u = urlOf(), cut = u.lastIndexOf('/', u.indexOf('?'));   // 주소는 마지막 / 앞에서 나눠 두 줄로
    if (u.length > 52 && cut > 0) { g.fillText(u.slice(0, cut), W / 2, 1050); g.fillText(u.slice(cut), W / 2, 1095); } else g.fillText(u, W / 2, 1060);
    try { await saveCanvasPNG(cv, `냥박사연구소_QR_${modeName()}.png`); toast('QR 이미지를 저장했어요.', 1800); }
    catch (e) { toast(e && e.name === 'AbortError' ? '저장이 취소됐어요.' : '저장하지 못했어요. 다시 눌러 주세요.'); }
  };

  const draw = () => {
    $$('.tc-tab').forEach(b => { b.classList.toggle('on', +b.dataset.t === tab); b.setAttribute('aria-selected', +b.dataset.t === tab); b.classList.toggle('off', +b.dataset.t === 2 && d.mode === 'event' && !evD()); });
    $('#panel').className = 'tc-panel t' + tab;
    if (tab === 1) {
      /* 이 기기 기록 지우기 (11/11): 수업용은 게시판 아래, 행사용은 자리가 모자라 맨 아래에 가로로 길게(미리 보기 아래까지) */
      const DEV = `<section class="tc-device">
          <button class="tc-btn sm danger" id="wipe">이 기기 기록 지우기</button>
          <p>학생 기록(이름·약속·다이어리·사진)은 <b>이 기기에만</b> 저장되고 서버로 보내지 않아요. 한 번에 저장된 학생 기록을 지울 수 있어요.</p>
        </section>`;
      $('#panel').innerHTML = `
      <div class="tc-col tc-set">
        <section class="tc-sec">
          <h2 class="tc-h"><i>1</i>실행 모드</h2>
          <div class="tc-modes" id="modes">
            <button data-m="class" class="${d.mode !== 'event' ? 'on' : ''}"><span class="rd"></span><span><b>수업용</b><small>연구소 학습을 마친 뒤 약속 카드를 만들어요</small></span></button>
            <button data-m="event" class="${d.mode === 'event' ? 'on' : ''}"><span class="rd"></span><span><b>행사용<em class="tc-msub">함께 쓰는 태블릿용</em></b><small>연구소를 건너뛰고 방패 만들기부터</small></span></button>
          </div>
          ${d.mode === 'event' ? `<div class="tc-row tc-evact"><span class="tc-checks" id="evact" aria-label="행사 활동">
            <button data-a="card" class="${evC() ? 'on' : ''}" aria-pressed="${evC()}"><i></i>약속 카드</button><button data-a="diary" class="${evD() ? 'on' : ''}" aria-pressed="${evD()}"><i></i>다이어리</button></span>
            </div>` : ''}
        </section>
        <section class="tc-sec tc-inl">
          <h2 class="tc-h"><i>2</i>소리</h2>${seg('sound', [['on', '켜기'], ['off', '끄기']], d.sound === 'off' ? 'off' : 'on')}
        </section>
        <section class="tc-sec">
          <h2 class="tc-h"><i>3</i>결과 공유 게시판 <em>선택</em></h2>
          <label class="tc-url" id="uf"><span class="sr">게시판 주소</span><input type="url" inputmode="url" id="board" placeholder="예: https://padlet.com/…" value="${esc(d.board)}"></label>
          <p class="tc-help" id="err">${BOARD_HELP()}</p>
          <p class="tc-help tc-privacy">게시판은 우리 학교만 볼 수 있게(비공개·비밀번호) 설정해 주세요.</p>
        </section>
        ${DEV}
      </div>
      <div class="tc-col tc-pv">
        <div class="tc-pvhead"><h2 class="tc-h">미리 보기</h2>
          ${seg('view', [['lab', '연구소'], ['card', '약속 카드']], view)}
          ${seg('dev', [['tablet', '태블릿'], ['phone', '휴대폰']], dev)}</div>
        <div class="tc-steps" id="steps" aria-label="열어 볼 화면"></div>
        <div class="tc-frame" id="frame"><iframe id="pv" title="학생 화면 미리 보기"></iframe></div>
        <div class="tc-foot"><button class="tc-btn" id="reset">기본값으로</button><button class="tc-btn pri" id="toNext">${d.mode === 'event' && !evD() ? '다음 · QR 코드와 공유 ›' : '다음 · 챌린지 다이어리 ›'}</button></div>
      </div>`;
      $('#modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; const was = d.mode; d.mode = b.dataset.m; Draft.set(d); view = d.mode === 'event' ? 'card' : 'lab';
        $$('#modes button').forEach(x => x.classList.toggle('on', x === b)); drawPrev();
        draw();
        /* 행사용: 게시판 주소가 없으면 한 번 알려 줘요 — 비워 두면 학생은 카드를 인쇄하거나 이미지로 저장해요 (11/11) */
        if (d.mode === 'event' && was !== 'event' && !okBoard()) {
          const m = Modal.open(`<div class="pop-head">결과 게시판 주소를 넣어 주세요</div>
            <p class="pop-body">게시판 주소를 넣으면 학생이 약속 카드 이미지를 게시판으로 보내요.<br>선생님이 게시판에서 출력해 나눠 줄 수 있어요.<br><b>비워 두면</b> 학생이 카드를 인쇄하거나 이미지로 저장해요.</p>
            <p class="pop-small">게시판은 로그인 없이 올리기를 허용해 주세요.</p>
            <div class="pop-btns"><button class="btn white" id="bLater">비워 둘게요</button><button class="btn pink" data-autofocus id="bNow">주소 넣기</button></div>`);
          onTap($('#bLater', m), () => Modal.close());
          onTap($('#bNow', m), () => { Modal.close(); const i = $('#board'); if (i) i.focus(); });
        } });
      const ea = $('#evact'); if (ea) ea.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return;
        let c = evC(), y = evD(); if (b.dataset.a === 'card') c = !c; else y = !y;
        if (!c && !y) { playSfx('full'); replay(b, 'shake'); return toast('행사 활동을 하나는 골라 주세요.'); }
        playSfx(b.classList.contains('on') ? 'uncheck' : 'check');
        d.ev = c && y ? 'both' : y ? 'diary' : 'card'; Draft.set(d);
        if ((step.card === 'S44' && !c) || (step.card === 'S46' && !y)) step.card = 'S39';
        draw(); });
      $('#board').addEventListener('change', e => { d.board = e.target.value.trim(); Draft.set(d);
        const bad = d.board && !isHttps(d.board); $('#uf').classList.toggle('bad', !!bad);
        $('#err').classList.toggle('bad', !!bad);
        $('#err').textContent = bad ? 'https로 시작하는 주소를 넣어 주세요.' : BOARD_HELP(); });
      $('#steps').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; step[view] = b.dataset.s; drawPrev(); });
      $$('.tc-seg').forEach(g => g.addEventListener('click', e => {
        const x = e.target.closest('[data-v]'); if (!x || x.disabled) return; const k = g.dataset.k;
        if (k === 'view') { view = x.dataset.v; drawPrev(); return; }
        if (k === 'dev') { dev = x.dataset.v; paintSeg('dev', dev); fitFrame(); return; }
        d[k] = x.dataset.v; Draft.set(d); paintSeg(k, x.dataset.v); drawPrev();
      }));
      onTap($('#wipe'), () => {
        const m = Modal.open(`<div class="pop-head redbar">이 기기의 기록을 모두 지울까요?</div>
          <p class="pop-body">이 기기에 저장된 <b class="red">약속 카드·다이어리(사진 포함)·연구소 진행</b>이 모두 지워져요.<br>다음 학생이 처음부터 시작할 수 있어요.</p>
          <div class="pop-btns"><button class="btn blue" data-autofocus id="wNo">취소</button><button class="btn red" id="wYes">모두 지우기</button></div>`, { sfx: 'full' });
        onTap($('#wNo', m), () => Modal.close());
        onTap($('#wYes', m), () => { playSfx('delete'); Store.clearAll(); try { sessionStorage.clear(); } catch (e) {} Modal.close(); toast('이 기기의 기록을 모두 지웠어요.'); });
      });
      onTap($('#toNext'), () => { tab = d.mode === 'event' && !evD() ? 3 : 2; draw(); });   // 행사용은 다이어리를 쓰지 않아 02 탭 건너뛰기 (11/10)
      onTap($('#reset'), () => { d = { mode: 'class', ev: 'card', board: '', sound: 'on', bgm: 'on', dy: d.dy }; Draft.set(d); view = 'lab'; draw(); toast('기본값으로 되돌렸어요'); });
    } else if (tab === 2) {
      /* 02 챌린지 다이어리 (11/10 시안) */
      const y = dy(), EVD = d.mode === 'event' && evD();   // 행사용 다이어리: 성공 메달(최소 목표)만 빼고 모두 (11/11)
      let no = 0; const N = () => ++no;
      const keepTop = ($('.tc-dy') || {}).scrollTop || 0;   // 값을 바꿔 다시 그려도 보던 자리 그대로 (11/10 점검)
      const step1 = (k, v, unit, min, max) => `<span class="tc-step" data-k="${k}"><button data-d="-1" ${v <= min ? 'disabled' : ''} aria-label="줄이기">−</button><b>${v}${unit}</b><button data-d="1" ${v >= max ? 'disabled' : ''} aria-label="늘리기">+</button></span>`;
      const txt = (k, max, ph, sample) => `<label class="tc-url tc-txt"><span class="sr">${ph}</span><input id="dy_${k}" maxlength="${max}" placeholder="${ph}" value="${esc(y[k])}"><span class="tc-cnt" id="cn_${k}">${[...y[k]].length}/${max}</span></label>
        ${sample ? `<button class="tc-sample" data-fill="${k}" data-text="${esc(sample)}">예: ${esc(sample)}</button>` : ''}`;
      $('#panel').innerHTML = `
      <div class="tc-col tc-set tc-dy">
        ${EVD ? '<p class="tc-evwarn"><b>행사용 다이어리</b>는 꾸며서 인쇄해 가고, 체크는 집에서 종이에 해요. 성공 메달은 없어요.</p>' : ''}
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>${N()}</i>챌린지 횟수</h2>${step1('count', y.count, '회', 1, 10)}</section>
        ${EVD ? '' : `<section class="tc-sec tc-inl"><h2 class="tc-h"><i>${N()}</i>성공 메달</h2>${step1('min', Math.min(y.min, y.count), '일', 1, y.count)}<small>최소 목표예요<br>다 모으면 완성 메달</small></section>`}
        <section class="tc-sec tc-inl tc-way"><h2 class="tc-h"><i>${N()}</i>진행 방식</h2>${seg('dmode', [['row', '이어서'], ['free', '자유롭게']], y.mode)}
          <div class="tc-sub">${y.mode === 'free' ? seg('weeks', [['1', '1주'], ['2', '2주'], ['3', '3주'], ['4', '4주']], String(y.weeks)) : ''}<small>${y.mode === 'free' ? `${y.weeks}주 안에 아무 날이나 ${y.count}번 (주말 포함)` : `시작한 다음 날부터 학교 가는 날 ${y.count}번 이어서`}</small></div></section>
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>${N()}</i>사진 찍기</h2>${seg('dphoto', [['1', '켜기'], ['0', '끄기']], y.photo === false ? '0' : '1')}</section>
        <section class="tc-sec"><h2 class="tc-h"><i>${N()}</i>선생님 약속 <em>선택</em></h2>${txt('promise', 30, '예: 다 완성하면 선생님이 간식을 쏠게요!', '')}</section>
        <section class="tc-sec${EVD ? ' tc-dim' : ''}"><h2 class="tc-h"><i>${N()}</i>선생님 칭찬${EVD ? '<em>행사용은 축하 창이 없어요</em>' : ''}</h2>
          <div class="tc-pr"><span>${Math.min(y.min, y.count)}일 성공</span><div>${txt('praiseMin', 40, '비워 두면 예시 문구가 나와요', DY_SAMPLE.min)}</div></div>
          <div class="tc-pr"><span>완성</span><div>${txt('praiseDone', 40, '비워 두면 예시 문구가 나와요', DY_SAMPLE.done)}</div></div></section>
        <section class="tc-sec tc-inl tc-way"><h2 class="tc-h"><i>${N()}</i>완성 확인</h2>${seg('dsign', [['t', '선생님 서명'], ['n', '냥박사 도장']], y.tsign === 'n' ? 'n' : 't')}</section>
        <div class="tc-more" aria-hidden="true">▾ 아래로 내리면 더 있어요</div>
      </div>
      <div class="tc-col tc-pv">
        <div class="tc-pvhead"><h2 class="tc-h">미리 보기</h2>${EVD ? seg('dstep', [...(y.photo !== false ? [['S46P', '사진 찍기']] : []), ['S46', '다이어리 꾸미기']], step.dy === 'S46P' && y.photo !== false ? 'S46P' : 'S46') : seg('dstep', [...(y.photo !== false ? [['S46P', '사진 찍기']] : []), ['S46', '매일 체크'], ['S47', '성공 메달'], ['S48', '완성']], step.dy || 'S46')}</div>
        <div class="tc-frame" id="frame"><iframe id="pv" title="챌린지 다이어리 미리 보기"></iframe></div>
        <div class="tc-foot"><button class="tc-btn" id="reset2">기본값으로</button><button class="tc-btn pri" id="toNext2">다음 · QR 코드와 공유 ›</button></div>
      </div>`;
      { const col = $('.tc-dy'), more = $('.tc-more', col);
        const upd = () => more.classList.toggle('gone', col.scrollTop + col.clientHeight >= col.scrollHeight - 6);
        col.scrollTop = keepTop; col.addEventListener('scroll', upd, { passive: true }); requestAnimationFrame(upd); }
      const setY = (k, v, redraw = true) => { d.dy = Object.assign(dy(), { [k]: v }); if (d.dy.min > d.dy.count) d.dy.min = d.dy.count; Draft.set(d); if (redraw) draw(); };
      $$('.tc-step').forEach(g => g.addEventListener('click', e => { const x = e.target.closest('[data-d]'); if (!x || x.disabled) return; const k = g.dataset.k; setY(k, Math.max(1, Math.min(k === 'min' ? dy().count : 10, dy()[k] + +x.dataset.d))); }));
      $$('.tc-seg').forEach(g => g.addEventListener('click', e => {
        const x = e.target.closest('[data-v]'); if (!x) return; const k = g.dataset.k, v = x.dataset.v;
        if (k === 'dstep') { step.dy = v; paintSeg('dstep', v); drawPrev(); return; }
        if (k === 'dmode') setY('mode', v); else if (k === 'weeks') setY('weeks', +v); else if (k === 'dphoto') { if (v === '0' && step.dy === 'S46P') step.dy = 'S46'; setY('photo', v === '1'); } else if (k === 'dsign') setY('tsign', v);
      }));
      ['promise', 'praiseMin', 'praiseDone'].forEach(k => { const i = $('#dy_' + k); if (!i) return;   // 행사용 다이어리는 칭찬 칸이 없어요
        i.addEventListener('input', () => { $('#cn_' + k).textContent = `${[...i.value].length}/${i.maxLength}`; setY(k, i.value, false); });
        i.addEventListener('change', () => drawPrev()); });
      $$('[data-fill]').forEach(bt => onTap(bt, () => { const k = bt.dataset.fill, i = $('#dy_' + k); i.value = bt.dataset.text; setY(k, i.value, false); $('#cn_' + k).textContent = `${[...i.value].length}/${i.maxLength}`; drawPrev(); }));
      onTap($('#reset2'), () => { d.dy = Object.assign({}, DY_DEF); Draft.set(d); draw(); toast('기본값으로 되돌렸어요'); });
      onTap($('#toNext2'), () => { tab = 3; draw(); });
    } else {
      $('#panel').innerHTML = `
      <section class="tc-card3 tc-qrcard">
        <div class="tc-cardhead"><h2 class="tc-h">학생 접속 QR 코드</h2></div>
        <button class="tc-qr" id="qr" aria-label="QR 코드 크게 보기">${QR.toSVG(urlOf())}</button>
        <p class="tc-help">QR 코드를 누르면 전체 화면으로 크게 보여요.</p>
        <div class="tc-qrbtns"><button class="tc-btn" id="qrBig">크게 보기</button><button class="tc-btn" id="qrSave">QR 이미지 저장</button></div>
      </section>
      <section class="tc-card3 tc-sum">
        <div class="tc-cardhead tc-sumhead"><h2 class="tc-h">설정 요약</h2><button class="tc-btn sm" id="edit">수정</button></div>
        <dl class="tc-facts">
          <div><dt>실행 모드</dt><dd><b>${d.mode === 'event' ? '행사용' : '수업용'}</b> · ${d.mode === 'event' ? `함께 쓰는 태블릿 · 행사 활동: <b>${evName()}</b>` : '1인 1태블릿 (챌린지 다이어리)'}</dd></div>
          <div><dt>소리</dt><dd>${d.sound === 'off' ? '끄기' : '켜기'}</dd></div>
          <div><dt>챌린지</dt><dd>${(() => { const y = dy(); return `${y.mode === 'free' ? `${y.weeks}주 안에 자유롭게` : '학교 가는 날 이어서'} ${y.count}회 · ${Math.min(y.min, y.count)}일 성공 메달${y.promise.trim() ? ' · 선생님 약속 있음' : ''}`; })()}</dd></div>
          <div><dt>결과 게시판</dt><dd>${okBoard() ? `<span class="ok">연결됨</span> ${esc(d.board)}` : d.mode === 'event' ? '<span class="no">없음</span> 학생은 카드를 인쇄하거나 이미지로 저장해요' : '<span class="no">없음</span> 다이어리는 학생 기기에만 저장돼요'}</dd></div>
        </dl>
        <div class="tc-flowbox"><p class="tc-mode"><b>${modeName()}</b> 학생은 이렇게 해요</p>
        <ol class="tc-flow">${(d.mode === 'event' ? T_EVFLOW(evA(), okBoard()) : T_FLOW.class).map(s => `<li>${s}</li>`).join('')}</ol>
        ${d.mode === 'event' ? `<p class="tc-help tc-evnote">행사가 끝나면 태블릿 사진첩·다운로드 폴더의 ${evA() === 'card' ? '카드' : evA() === 'diary' ? '다이어리' : '카드·다이어리'} 이미지를 지워 주세요.</p>` : ''}</div>
        <div class="tc-linkbox"><p class="tc-mode"><b>접속 링크</b> 설정을 바꾸면 새 QR을 다시 찍어야 해요</p>
          <div class="tc-linkrow"><div class="tc-link" id="lnk">${esc(urlOf())}</div><button class="tc-btn" id="copy">링크 복사</button></div>
          ${okBoard() ? '<button class="tc-btn sm" id="bqr">결과 게시판 QR 보기</button>' : ''}</div>
      </section>
      <div class="tc-foot tc-foot3"><p class="tc-back"><b>선생님 설정으로 돌아오기</b> 학생 첫 화면 오른쪽 위 <span>SENSE 초등보건교육연구회</span>를 두 번 빠르게 눌러요</p><button class="tc-btn" id="prev">‹ 이전</button><button class="tc-btn pri" id="done">설정 완료 · 학생 화면 열기 ›</button></div>`;
      onTap($('#copy'), async () => { if (await copyText(urlOf(), $('#lnk'))) toast('링크를 복사했어요.', 1800); });
      onTap($('#bqr'), () => full('결과 게시판 QR (접속용 아님)', d.board, true));
      onTap($('#qr'), () => full('학생 접속 QR 코드', urlOf()));
      onTap($('#qrBig'), () => full('학생 접속 QR 코드', urlOf()));
      onTap($('#qrSave'), saveQR);
      onTap($('#edit'), () => { tab = 1; draw(); });
      onTap($('#prev'), () => { tab = d.mode === 'event' && !evD() ? 1 : 2; draw(); });
      /* [설정 완료] (11/10 최종): 이 기기에도 설정을 적용해요 — 부스 태블릿처럼 선생님 설정에서 행사용을 고른 기기는 계속 행사용 */
      onTap($('#done'), () => {
        Config.set(Object.assign(Config.get(), { mode: d.mode === 'event' ? 'event' : 'class', ev: evA(), board: okBoard() ? d.board : '', bgm: d.sound !== 'off' }));   // 소리 하나로 (11/11): 효과음·대기 음악 함께
        setSound(d.sound !== 'off');
        Router.go(d.mode === 'event' ? 'S39' : (returnTo === 'S39' ? 'S00' : returnTo));
      });
    }
    drawPrev();
  };
  const full = (title, text, warn) => {
    const m = Modal.open(`<h3 class="${warn ? 'warn' : ''}">${title}</h3><div class="qr-big">${QR.toSVG(text)}</div><p>${warn ? '챌린지를 마친 뒤 다이어리 이미지를 올릴 때 쓰세요' : '스캔하세요'}</p><button class="btn white" data-autofocus id="qc">✕ 닫기</button>`, { cls: 'qr-full', sfx: null });
    onTap($('#qc', m), () => Modal.close());
  };
  $('.tc-tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; if (+b.dataset.t === 2 && d.mode === 'event' && !evD()) { toast(evD() ? '행사용 다이어리는 꾸미고 인쇄만 해요. 챌린지 설정은 수업용에서 써요.' : '행사용은 다이어리를 쓰지 않아요.', 3000); return; } tab = +b.dataset.t; draw(); });
  window.addEventListener('resize', fitFrame);
  draw();
};
Router.screens.T50 = (app, p) => Router.screens.T49(app, { ...p, tab: 3 });

/* 미리 보기용 예시 기록 (preview 키에만 저장) */
function seedPreview(view) {
  Store.clearAll();
  Store.set('name', '김건강'); Store.set('cardNo', 'AL-PREVIEW');
  Store.set('rules', { home: ['home-1'], school: ['school-1'], outside: ['outside-2'] });
  Store.set('custom', { mine: [] });
  /* 연구소 뒤쪽 화면은 앞 단계를 마친 것처럼 (미리 보기 기기에만) */
  if (['S36-3', 'S37', 'S38', 'S38A'].includes(view) && window.LAB) {
    Store.set('labFound', Object.fromEntries(Object.entries(LAB.places).map(([k, pl]) => [k, pl.points.map(pt => pt.item)])));
    if (view !== 'S36-3') LabState.cardsSeen = LAB.cards.list.map(c => c.id);
    if (view === 'S38A') LabState.copeSeen = { light: true, severe: true };
  }
  if (view === 'S46' || view === 'S46P' || view === 'S47' || view === 'S48') {
    /* 다이어리 미리 보기: S46 = 2일 한 뒤 3일째 · S47 = 성공 메달까지 · S48 = 완성 (축하 창은 이미 본 것으로) */
    DateK.override = '2026-11-04';
    const cc = Challenge.create(), ids = selectedRules().map(r => r.id);
    const upto = view === 'S48' ? cc.count : view === 'S47' ? cc.min : 2;
    const dates = cc.mode === 'free' ? Array.from({ length: cc.count }, (_, i) => DateK.add(cc.start, i * 2)) : cc.days;   // 자유롭게: 이틀에 한 번 한 것처럼
    dates.slice(0, upto).forEach((d, i) => { cc.log[d] = {}; ids.forEach((id, j) => cc.log[d][id] = (view === 'S46' && i === 1 && j === 1) ? 'X' : 'O'); });
    cc.cele = { min: true, done: true }; Store.set('challenge', cc);
    DateK.override = view === 'S48' ? dates[cc.count - 1] : dates[Math.min(upto, cc.count - 1)];
  }
}

/* ===================== 점검 모드 띠 (?test) ===================== */
const TestBar = {
  el: null,
  update() {
    if (!TestBar.el) {
      const b = document.createElement('div'); b.className = 'test-bar';
      b.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9999;display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:10px;background:#252E52;color:#fff;font:600 13px/1.3 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25)';
      document.body.appendChild(b); TestBar.el = b;
      b.addEventListener('click', e => {
        if (!e.target.closest('[data-tnext]')) return;
        TestMode.next(); const s = Challenge.status();
        Router.go('S46', {}, { replace: true });
      });
    }
    const c = Challenge.get();
    if (!c) { TestBar.el.innerHTML = '🧪 점검 모드 · 약속 카드를 만들면 챌린지를 바로 시작해요'; return; }
    const i = TestMode.idx(c), n = TestMode.len(c), ended = Challenge.status(c) === 'ended';
    const btn = 'style="border:0;border-radius:8px;padding:4px 10px;background:#FFB199;color:#252E52;font:700 13px sans-serif;cursor:pointer"';
    TestBar.el.innerHTML = ended
      ? `🧪 점검 모드 · ${n}회 완료`
      : `🧪 점검 모드 · ${Math.min(i + 1, n)} / ${n}회째 <button data-tnext ${btn}>다음 날로 ›</button>`;
  }
};

/* ===================== 앱 시작 ===================== */
(function start() {
  const qs = new URLSearchParams(location.search);
  if (qs.has('test')) TestMode.on = true; // 점검 모드: 체크를 하루씩 바로 넘겨 보기
  if (/^\d{4}-\d{2}-\d{2}$/.test(qs.get('today') || '')) DateK.override = qs.get('today'); // 테스트용 날짜
  /* 1) 교사 링크의 설정을 이 기기에 저장 */
  const fromLink = qs.has('mode') || qs.has('board') || qs.has('sound') || qs.has('bgm') || qs.has('dy');   // QR·공유 링크로 들어온 학생 기기
  let configured = false; try { configured = localStorage.getItem(CFG_KEY) !== null; } catch (e) {}
  if (fromLink) {
    const board = qs.get('board') || '';
    const evq = qs.get('ev');
    const cfg = { mode: qs.get('mode') === 'event' ? 'event' : 'class', ev: evq === 'd' ? 'diary' : evq === 'b' ? 'both' : 'card', board: isHttps(board) ? board : '', bgm: qs.get('bgm') !== 'off' && qs.get('sound') !== 'off' };   // 소리를 끄면 대기 음악도 꺼요 (11/11)
    /* 챌린지 다이어리 설정 (선생님 링크 dy · dp · dm · dd) */
    const dyv = (qs.get('dy') || '').split('.');
    if (dyv.length >= 6) cfg.diary = { count: Math.max(1, Math.min(10, +dyv[0] || 5)), mode: dyv[1] === 'f' ? 'free' : 'row', weeks: Math.max(1, Math.min(4, +dyv[2] || 2)), min: Math.max(1, +dyv[3] || 3), photo: dyv[4] !== '0', tsign: dyv[5] === 'n' ? 'n' : 't',
      promise: (qs.get('dp') || '').slice(0, 30), praiseMin: (qs.get('dm') || '').slice(0, 40), praiseDone: (qs.get('dd') || '').slice(0, 40) };
    if (cfg.mode === 'event' && !PREVIEW) {
      /* 행사용 QR (11/10 최종): 이 창을 닫을 때까지만 행사용 — 학생 개인 태블릿은 다시 열면 원래대로(수업 다이어리) */
      if (!configured) { try { localStorage.setItem(CFG_KEY, JSON.stringify({ mode: 'class', board: '', bgm: true })); } catch (e) {} }
      Config.setSession(cfg);
    } else Config.set(cfg);
    if (!PREVIEW) setSound(qs.get('sound') !== 'off');
    ['mode', 'ev', 'board', 'sound', 'bgm', 'dy', 'dp', 'dm', 'dd'].forEach(k => qs.delete(k));
  }
  /* 선생님 설정: 사이트 주소 뒤 ?teacher, 또는 홈 화면 연구회 이름표를 두 번 빠르게 누르기 (11/11) */
  const teacher = qs.has('teacher') || location.hash === '#teacher'; qs.delete('teacher');
  if (location.hash === '#teacher') history.replaceState(null, '', location.pathname + location.search);
  /* 2) 아이폰·아이패드 홈 화면 앱 첫 실행: Safari 기록 이어 받기 */
  if (location.hash.startsWith('#restore=')) {
    if (!Store.hasRecord()) { try { Store.restore(JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(9)))))); } catch (e) {} }
  }
  const q = qs.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
  /* 3) 기록 보존 요청 */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  /* 미리 보기(iframe): 예시 기록으로 원하는 화면만 보여 주기 */
  if (PREVIEW) { seedPreview(qs.get('view')); Router.go(qs.get('view') || 'S00', {}, { replace: true }); return; }
  /* 4) 시작 화면 판단 */
  const st = Challenge.status();
  const first = Config.isEvent() ? 'S39' : st !== 'none' ? 'S46' : 'S00';   // 행사용은 늘 방패 만들기부터 (다이어리 없음)
  /* 선생님 화면 먼저 (팀 점검 11/8): 주소만으로 연 기기(QR 설정·학생 기록 없음)는 선생님 설정부터.
     QR·공유 링크로 들어온 학생 기기는 바로 학생 화면. 선생님 기기에서 다시 열 때는 주소 뒤 ?teacher */
  const teacherFirst = !fromLink && !configured && !Store.hasRecord() && LabFound.total() === 0;
  if (teacher || teacherFirst) Router.go('T49', { returnTo: first }, { replace: true });
  else Router.go(first, {}, { replace: true });
  /* 5) 오프라인 실행 (https에서만) */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    /* 11/11: 새 버전이 설치되면 한 번 저절로 새로고침 — 배포 뒤 예전 화면이 남지 않게 (처음 설치 때는 하지 않음) */
    if (navigator.serviceWorker.controller) {
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; location.reload(); });
    }
  }
  /* 6) 자정이 지나면 다시 그리기 */
  let day = DateK.today();
  setInterval(() => { const n = DateK.today(); if (n !== day) { day = n; if (Router.current) Router.render(Router.current); } }, 60000);
})();
