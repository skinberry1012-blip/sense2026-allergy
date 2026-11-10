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
  labPanel(b, { y: 30, title: '알레르기 방패 만들기', center: true, fs: 40 });
  labChar(b, 'staff_guide', 600, { left: 70, bottom: 10 });
  const bub = labBubble(b, { x: 760, y: 250, w: 720, fs: 42, tail: 'l', name: '수호냥', staff: true });
  bub.say('알레르기로부터 나를 지켜 줄<br>{{나만의 방패}}를 만들어 보자!');
  const start = labBtn(b, '나만의 약속 카드 만들기 ›', 'left:780px;top:560px;font-size:40px', 'y beat');
  onTap(start, () => {
    playSfx('next');
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
  labPanel(b, { y: 30, title: '알레르기 예방 약속 카드', center: true, fs: 40 });
  labChar(b, 'staff_hello', 560, { left: 40, bottom: 10 });
  /* 말풍선 안에 이름 칸 (11/10 다시): 수호냥이 묻고, 말풍선 안에서 바로 써요 */
  const bub = labEl(b, 'px-bub tail-l name-bub', null, `<span class="px-name s">수호냥</span>
    <div class="px-bub-txt">약속 카드에 들어갈<br>{{이름}}을 입력해 보아요!</div>
    <label class="name-px"><input id="name" type="text" maxlength="12" placeholder="이름 (번호도 쓸 수 있어요)" autocomplete="off" enterkeyhint="done" aria-label="이름"><span class="count" id="count">0/${NAME_MAX}</span></label>
    <i class="t1"></i><i class="t2"></i>`.replace(/\{\{(.+?)\}\}/g, '<b class="lc">$1</b>'), 'div', 'left:720px;top:236px;width:700px');
  const field = $('.name-px', bub);
  const make = labBtn(b, '내 카드 만들기 ›', 'right:180px;top:640px;font-size:38px', 'y');   // 말풍선 아래 오른쪽 끝 맞춤
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
  labPanel(b, { y: 26, title: '나만의 약속을 골라 보세요!', center: true, fs: 38 });
  labChar(b, 'staff_guide', 500, { left: -60, bottom: 10 });
  const bub = labBubbleAt(labBubble(b, { x: 40, y: 0, w: 470, fs: 30, tail: 'bl', name: '수호냥', staff: true }), { bottom: 470, tailX: 200 });
  const box = labEl(b, 'rl-box', [560, 156, 1000, 616]);   // 제목 아래 ~ 버튼 위 사이 가운데 (장소 고르기 2×2 · 약속 상자)
  const next = labBtn(b, '다음 ›', 'right:40px;bottom:46px;font-size:36px', 'y');

  /* 순서대로 (11/10): 집 → 학교 → 밖 → 나만의 약속(선택) → 카드 꾸미기. 하나 고르면 다음 장소로 넘어가요 */
  let step = Math.max(0, Math.min(3, p.step != null ? p.step | 0 : (PLACES.findIndex(pl => !done(pl)) + 1 || 4) - 1));
  const chip = labEl(b, 'px-chip quiz-step rl-step', null, '', 'div', 'top:46px');
  const say = () => {
    const k = RULE_TABS[step][0];
    if (k === 'mine') return bub.say(allPlaces() ? '내가 지킬 약속을<br>{{직접}} 적어도 좋아!' : '집 · 학교 · 밖에서<br>하나씩 먼저 정해 줘!', false);
    bub.say(done(k) ? '좋아! {{다음}}을 눌러<br>다른 장소로 가 보자!' : '여기서 꼭 지킬 것을<br>{{하나}} 정해 봐!', false);
  };
  const render = () => {
    const pl = RULE_TABS[step][0];
    chip.innerHTML = `<b class="lc">${step + 1}</b> / 4`;
    chip.style.left = (800 + $('.px-panel', b).offsetWidth / 2 + 18) + 'px';
    let body;
    if (pl !== 'mine') {
      body = window.RULES_DATA[pl].rules.map((r, n) =>
        `<button class="ti ${rules[pl][0] === r.id ? 'on' : ''}" data-id="${r.id}"><span class="tno">${n + 1}</span><span class="tt">${esc(r.text)}</span><i class="cb ${rules[pl][0] === r.id ? 'on' : ''}"></i></button>`).join('');
    } else {
      const d = window.RULES_DATA.mine;
      body = custom.mine.map((c, j) => `<div class="ti ${c.checked ? 'on' : ''}" data-c="${j}" role="button" tabindex="0"><span class="tno">${j + 1}</span><span class="tt">${esc(c.text)}</span><button class="del" data-d="${j}" aria-label="삭제">✕</button><i class="cb ${c.checked ? 'on' : ''}"></i></div>`).join('')
        + (custom.mine.length < MINE_MAX ? `<div class="rl-add"><p>${d.tip}</p><label class="name-px rl-in"><input id="cin" maxlength="${CUSTOM_MAX}" placeholder="${d.placeholder}" enterkeyhint="done" aria-label="나만의 약속"><span class="count" id="ccount">0/${CUSTOM_MAX}</span></label><button class="px-btn y rl-addbtn" id="cadd" type="button"><span>+ 추가</span></button></div>` : '')
        + `<p class="rl-note"><b>i</b>알레르기 종류나 병 이름 같은 건강 정보는 적지 않아요. 나만의 약속은 내 카드에만 나오고, 어디에도 보내지 않아요.</p>`;
    }
    /* 위: 장소 그림 띠 + 장소 이름, 아래: 약속 목록 */
    box.innerHTML = `<div class="tlist rl-list"><div class="rl-pic pl-${pl}"><span>${window.RULES_DATA[pl].icon} ${RULE_TABS[step][1]}</span>${pl === 'mine' ? `<em>안 적어도 돼요 · ${MINE_MAX}개까지</em>` : ''}</div>${body}</div>`;
    const cin = $('#cin', box);
    if (cin) {
      cin.addEventListener('input', () => { $('#ccount', box).textContent = `${[...cin.value].length}/${CUSTOM_MAX}`; });
      cin.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) add(); });
      onTap($('#cadd', box), add);
    }
    prev.hidden = step === 0;
    if (step > 0) $('span', prev).textContent = `‹ ${RULE_TABS[step - 1][1]}`;
    const last = pl === 'mine';
    $('span', next).textContent = last ? '카드 꾸미기로 ›' : '다음 ›';
    const ok = last ? allPlaces() : done(pl);
    next.classList.toggle('off', !ok); next.setAttribute('aria-disabled', String(!ok));
    say();
  };
  const prev = labBtn(b, '‹', 'left:560px;bottom:46px;font-size:30px', 'w');
  const add = () => {
    const cin = $('#cin', box), v = (cin.value || '').trim(); if (!v) { playSfx('full'); replay(cin.parentNode, 'shake'); return; }
    const all = [...custom.mine.map(c => c.text), ...PLACES.flatMap(pl => window.RULES_DATA[pl].rules.map(r => r.text))];
    if (all.includes(v)) return toast('이미 있는 약속이에요.');
    custom.mine.push({ id: 'c' + Date.now().toString(36), text: v, checked: true }); save(); playSfx('check'); render();
  };
  const go = n => { step = n; render(); replay(box, 'pop'); };
  box.addEventListener('click', e => {
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
    const pl = RULE_TABS[step][0];
    if (pl !== 'mine') {
      if (!done(pl)) { playSfx('full'); replay(next, 'shake'); return toast('약속을 하나 골라 주세요.'); }
      playSfx('next'); return go(step + 1);
    }
    if (!allPlaces()) { playSfx('full'); replay(next, 'shake'); go(PLACES.findIndex(x => !done(x))); return toast('집 · 학교 · 밖에서 하나씩 골라 주세요.'); }
    playSfx('next'); Router.go('S44');
  });
  render();
};

/* ===================== S44 카드 디자인 및 제작 ===================== */
let signatureImg = null; // 서명은 저장하지 않고 이 화면 메모리에만
Router.screens.S44 = (app) => {
  const st = { design: 'certificate', buddy: Store.get('buddy', 'pinky_01'), step: 1 };
  if (!BUDDIES[st.buddy]) st.buddy = 'pinky_01';   // 수호 친구는 4가지만 (11/9)
  const rules = selectedRules(), name = Store.get('name', '');
  /* 배치 (11/9): 헌혈 임명장처럼 — 오른쪽 크게 약속 카드, 왼쪽에 수호 친구 고르기 · 저장 · 인쇄 · 처음으로 */
  app.innerHTML = `
  <div class="sc outdoor s44 s44b">
    <header class="s44-top">
      <h1 class="title-banner">${pawSVG('#fff')} 나만의 알레르기 예방 <em>약속 카드</em> 만들기! ${pawSVG('#fff')}</h1>
    </header>
    <div class="s44b-body">
      <aside class="s44b-side">
        <section class="s44-box"><h3 class="box-tag">나의 수호 친구 고르기</h3><div class="buddies" id="buddies"></div></section>
        <div class="s44b-btns">
          <button class="btn pink" id="save">약속 카드 저장하기</button>
          <button class="btn white" id="print">인쇄하기</button>
          <button class="btn white" id="home">처음으로</button>
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

  /* 인쇄: 저장용과 같은 카드를 그려서 인쇄 전용 칸에 넣고 인쇄 창을 열어요 */
  onTap($('#print'), async () => {
    if (!Store.get('cardDate')) Store.set('cardDate', DateK.today());
    const out = document.createElement('canvas');
    await drawPromiseCard(out, { ...st, name, date: cardDay(), rules, sigImg: signatureImg, preview: false });
    let pa = document.getElementById('printArea');   // 화면 확대·축소의 영향을 받지 않게 body 바로 아래에
    if (!pa) { pa = document.createElement('div'); pa.id = 'printArea'; pa.className = 'print-only'; document.body.appendChild(pa); }
    pa.innerHTML = `<img src="${out.toDataURL('image/png')}" alt="알레르기 예방 약속 카드">`;
    playSfx('tap'); setTimeout(() => window.print(), 150);
  });
  onTap($('#save'), async () => {
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
    try { await saveCanvasPNG(out, `promise-card_${Store.get("cardNo")}.png`); }
    catch (e) { toast(e && e.name === 'AbortError' ? '카드 저장이 취소됐어요. 다시 눌러 주세요.' : '저장하지 못했어요. 다시 눌러 주세요.', 2500); return; }
    st.step = 4; playSfx('save'); render();
    Store.set('design', st.design); Store.set('buddy', st.buddy);
    Router.go('S46', { install: !isStandalone() });
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
  const guide = ios
    ? `<div class="ig-phone ios"><div class="ig-url"></div><div class="ig-sheet"><span>⧉ 복사</span><span class="hl">＋ 홈 화면에 추가</span><span>☆ 즐겨찾기</span></div><span class="ig-btn share">⇧</span></div>
       <div class="ig-steps"><span>① 공유 버튼 ⇧</span><span>② 홈 화면에 추가</span><span>③ 오른쪽 위 [추가]</span></div>
       <p class="ig-keep">홈 화면의 알레르기 약속 카드 아이콘으로 열어도 기록이 이어져요</p>`
    : `<div class="ig-phone android"><div class="ig-url"></div><span class="ig-btn menu">⋮</span><div class="ig-sheet"><span>↻ 새 탭</span><span class="hl">＋ 홈 화면에 추가</span><span>☆ 북마크</span></div></div>
       <div class="ig-steps"><span>① 메뉴 ⋮</span><span>② 홈 화면에 추가</span><span>③ [설치] 또는 [추가]</span></div>
       <p class="ig-keep">삼성 인터넷은 메뉴(≡) → 페이지 추가 → 홈 화면</p>`;
  const m = Modal.open(`
    <button class="pop-x" id="iX" aria-label="닫기">✕</button>
    <div class="install">
      <h2 class="title-banner sm">🎉 나만의 <em>약속 카드</em> 완성 및 저장 완료!</h2>
      <div class="install-grid">
        <div class="install-left">
          <div class="install-top"><img src="${CAT('pinky_03')}" data-anim="staff_guide" alt=""><p class="bubble sm">이제 챌린지를 시작해요!<br><mark>앱을 홈 화면에 추가</mark>해 두면 쉽게 열 수 있어요.</p></div>
          <span class="lab-pill">나의 카드 고유번호</span>
          <div class="cardno">${esc(Store.get('cardNo', ''))}</div>
          <p class="saved-ok">※ 카드 저장이 완료되었습니다!</p>
        </div>
        <div class="install-guide" id="iGuide"><h4><b>홈 화면에 추가</b> 하는 방법</h4>${guide}</div>
      </div>
      <button class="btn pink big" id="iMain">＋ 홈 화면에 추가하고 <em>시작하기</em> ›</button>
      <button class="link" id="iWeb">웹 브라우저로 그냥 볼래요</button>
    </div>`, { cls: 'install-dim', onBack: () => closeInstall(false) });
  let done = false;
  const closeInstall = (web) => {
    Modal.close();
    history.replaceState({ s: 'S46', p: {} }, '', location.pathname + location.search + location.hash);
    Router.current = { s: 'S46', p: {} };
    if (web && ios && !sessionStorage.getItem('sevenDayTip')) { sessionStorage.setItem('sevenDayTip', '1'); toast('브라우저에서는 7일 동안 열지 않으면 기록이 지워질 수 있어요. 매일 들어와 주세요!', 4000); }
  };
  const setDone = () => { done = true; m.classList.add('flash'); $('#iMain', m).innerHTML = '다 했어요, <em>시작하기</em> ›'; };
  onTap($('#iMain', m), async () => {
    if (done) return closeInstall(false);
    if (!ios && deferredInstall) {
      deferredInstall.prompt();
      const r = await deferredInstall.userChoice; deferredInstall = null;
      if (r && r.outcome === 'accepted') return closeInstall(false);
      return;
    }
    setDone();
  });
  onTap($('#iWeb', m), () => closeInstall(true));
  onTap($('#iX', m), () => closeInstall(true));
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
  lab:  [['S00', '처음'], ['S01', '이야기'], ['S05', '활동 고르기'], ['S06', '집 3-1'], ['S15', '급식실 3-2'], ['S24', '운동장 3-3'], ['S36-3', '증상 카드'], ['S37', '대처 방법'], ['S38A', '기억 체크']],
  card: [['S39', '시작'], ['S40', '이름'], ['RULES', '약속 고르기'], ['S44', '카드 꾸미기'], ['S46', '다이어리'], ['S47', '성공 메달'], ['S48', '완성']]
};
const T_FLOW = {
  class: ['연구소 · 알레르기 원인 12가지 찾기', '증상 카드 · 대처 방법 익히기', '나만의 예방 약속 카드 만들기', '챌린지 다이어리 꾸미기 → 매일 체크 → 메달'],
  event: ['나만의 예방 약속 카드 만들기', '챌린지 다이어리 꾸미기 → 매일 체크 → 메달']
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
  const query = () => '?mode=' + (d.mode === 'event' ? 'event' : 'class') + (okBoard() ? '&board=' + encodeURIComponent(d.board) : '') + (d.sound === 'off' ? '&sound=off' : '') + (d.bgm === 'off' ? '&bgm=off' : '') + dyQuery();
  const urlOf = () => base + query();
  const modeName = () => d.mode === 'event' ? '행사용' : '수업용';
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
    $('#steps').innerHTML = PREVIEW_STEPS[view].map(([k, n]) => `<button data-s="${k}" class="${k === step[view] ? 'on' : ''}">${n}</button>`).join('');
    $$('.tc-seg[data-k="view"] button').forEach(x => { x.disabled = x.dataset.v === 'lab' && d.mode === 'event'; });
    $('#pv').src = pvSrc(); fitFrame();
    $('#pvcap').textContent = view === 'lab' ? '수업용: 학생은 연구소 첫 화면에서 시작해요. 연구소를 마치면 약속 카드로 넘어가요.'
      : d.mode === 'event' ? '행사용: 학생은 QR을 찍으면 바로 이 약속 카드 화면에서 시작해요.' : '수업용: 연구소를 마친 학생이 이 약속 카드 화면으로 와요.';
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
    g.fillText(`${modeName()} · 태블릿 카메라로 찍어 들어와요`, W / 2, 200);
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
    $$('.tc-tab').forEach(b => { b.classList.toggle('on', +b.dataset.t === tab); b.setAttribute('aria-selected', +b.dataset.t === tab); });
    $('#panel').className = 'tc-panel t' + tab;
    if (tab === 1) {
      $('#panel').innerHTML = `
      <div class="tc-col tc-set">
        <section class="tc-sec">
          <h2 class="tc-h"><i>1</i>실행 모드</h2>
          <div class="tc-modes" id="modes">
            <button data-m="class" class="${d.mode !== 'event' ? 'on' : ''}"><span class="rd"></span><span><b>수업용</b><small>연구소 학습을 마친 뒤 약속 카드를 만들어요</small></span></button>
            <button data-m="event" class="${d.mode === 'event' ? 'on' : ''}"><span class="rd"></span><span><b>행사용</b><small>연구소를 건너뛰고 약속 카드부터 시작해요</small></span></button>
          </div>
        </section>
        <section class="tc-sec">
          <h2 class="tc-h"><i>2</i>소리 기본값</h2>
          <div class="tc-row"><span class="tc-lbl">효과음</span>${seg('sound', [['on', '켜기'], ['off', '끄기']], d.sound === 'off' ? 'off' : 'on')}</div>
          <div class="tc-row"><span class="tc-lbl">대기 음악</span>${seg('bgm', [['on', '켜기'], ['off', '끄기']], d.bgm === 'off' ? 'off' : 'on')}<small>첫 화면에서만 나와요</small></div>
        </section>
        <section class="tc-sec">
          <h2 class="tc-h"><i>3</i>결과 공유 게시판 <em>선택</em></h2>
          <label class="tc-url" id="uf"><span class="sr">게시판 주소</span><input type="url" inputmode="url" id="board" placeholder="예: https://padlet.com/…" value="${esc(d.board)}"></label>
          <p class="tc-help" id="err">챌린지 다이어리 이미지를 올릴 패들렛·띵커벨 보드 주소예요.</p>
        </section>
        <section class="tc-device">
          <button class="tc-btn sm danger" id="wipe">이 기기 기록 지우기</button>
          <p>학생 기록(이름·약속·다이어리 체크·사진)은 <b>이 기기에만</b> 저장되고 서버로 보내지 않아요. 공용 기기는 수업 뒤 지워 주세요.</p>
        </section>
      </div>
      <div class="tc-col tc-pv">
        <div class="tc-pvhead"><h2 class="tc-h">미리 보기</h2>
          ${seg('view', [['lab', '연구소'], ['card', '약속 카드']], view)}
          ${seg('dev', [['tablet', '태블릿'], ['phone', '휴대폰']], dev)}</div>
        <div class="tc-steps" id="steps" aria-label="열어 볼 화면"></div>
        <div class="tc-frame" id="frame"><iframe id="pv" title="학생 화면 미리 보기"></iframe></div>
        <p class="tc-help" id="pvcap"></p>
        <div class="tc-foot"><button class="tc-btn" id="reset">기본값으로</button><button class="tc-btn pri" id="toNext">다음 · 챌린지 다이어리 ›</button></div>
      </div>`;
      $('#modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; d.mode = b.dataset.m; Draft.set(d); view = d.mode === 'event' ? 'card' : 'lab';
        $$('#modes button').forEach(x => x.classList.toggle('on', x === b)); drawPrev(); });
      $('#board').addEventListener('change', e => { d.board = e.target.value.trim(); Draft.set(d);
        const bad = d.board && !isHttps(d.board); $('#uf').classList.toggle('bad', !!bad);
        $('#err').classList.toggle('bad', !!bad);
        $('#err').textContent = bad ? 'https로 시작하는 주소를 넣어 주세요.' : '챌린지 다이어리 이미지를 올릴 패들렛·띵커벨 보드 주소예요.'; });
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
      onTap($('#toNext'), () => { tab = 2; draw(); });
      onTap($('#reset'), () => { d = { mode: 'class', board: '', sound: 'on', bgm: 'on', dy: d.dy }; Draft.set(d); view = 'lab'; draw(); toast('기본값으로 되돌렸어요'); });
    } else if (tab === 2) {
      /* 02 챌린지 다이어리 (11/10 시안) */
      const y = dy();
      const step1 = (k, v, unit, min, max) => `<span class="tc-step" data-k="${k}"><button data-d="-1" ${v <= min ? 'disabled' : ''} aria-label="줄이기">−</button><b>${v}${unit}</b><button data-d="1" ${v >= max ? 'disabled' : ''} aria-label="늘리기">+</button></span>`;
      const txt = (k, max, ph, sample) => `<label class="tc-url tc-txt"><span class="sr">${ph}</span><input id="dy_${k}" maxlength="${max}" placeholder="${ph}" value="${esc(y[k])}"><span class="tc-cnt" id="cn_${k}">${[...y[k]].length}/${max}</span></label>
        <button class="tc-sample" data-fill="${k}" data-text="${esc(sample)}">예: ${esc(sample)}</button>`;
      $('#panel').innerHTML = `
      <div class="tc-col tc-set tc-dy">
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>1</i>챌린지 횟수</h2>${step1('count', y.count, '회', 1, 10)}<small>1~10회 · 기본 5회</small></section>
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>2</i>성공 메달</h2>${step1('min', Math.min(y.min, y.count), '일', 1, y.count)}<small>별을 이만큼 모으면 성공 메달</small></section>
        <section class="tc-sec"><h2 class="tc-h"><i>3</i>진행 방식</h2>
          <div class="tc-row">${seg('dmode', [['row', '이어서'], ['free', '자유롭게']], y.mode)}${y.mode === 'free' ? seg('weeks', [['1', '1주'], ['2', '2주'], ['3', '3주'], ['4', '4주']], String(y.weeks)) : ''}</div>
          <p class="tc-help">${y.mode === 'free' ? `오늘부터 ${y.weeks}주 안에 아무 날이나 ${y.count}번 (주말도 돼요, 하루 한 번)` : `시작한 다음 날부터 학교 가는 날 ${y.count}번 이어서`}</p></section>
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>4</i>사진 찍기</h2>${seg('dphoto', [['1', '켜기'], ['0', '끄기']], y.photo === false ? '0' : '1')}<small>끄면 수호냥 그림만 골라요</small></section>
        <section class="tc-sec"><h2 class="tc-h"><i>5</i>선생님 약속 <em>선택</em></h2>${txt('promise', 20, '다 완성하면 받을 약속을 입력하세요', '다 완성하면 선생님이 간식을 쏠게요!')}</section>
        <section class="tc-sec"><h2 class="tc-h"><i>6</i>선생님 칭찬</h2>
          <div class="tc-pr"><span>${Math.min(y.min, y.count)}일 성공</span><div>${txt('praiseMin', 40, '비워 두면 예시 문구가 나와요', DY_SAMPLE.min)}</div></div>
          <div class="tc-pr"><span>완성</span><div>${txt('praiseDone', 40, '비워 두면 예시 문구가 나와요', DY_SAMPLE.done)}</div></div></section>
        <section class="tc-sec tc-inl"><h2 class="tc-h"><i>7</i>인쇄 확인란</h2>${seg('dsign', [['t', '선생님 서명'], ['n', '냥박사 도장']], y.tsign === 'n' ? 'n' : 't')}<small>종이로 할 때 맨 아래</small></section>
      </div>
      <div class="tc-col tc-pv">
        <div class="tc-pvhead"><h2 class="tc-h">미리 보기</h2>${seg('dstep', [['S46', '매일 체크'], ['S47', '성공 메달'], ['S48', '완성']], step.dy || 'S46')}</div>
        <div class="tc-frame" id="frame"><iframe id="pv" title="챌린지 다이어리 미리 보기"></iframe></div>
        <p class="tc-help">학생은 약속 카드를 저장한 뒤 이 다이어리를 꾸미고 [챌린지 시작하기]를 눌러요.</p>
        <div class="tc-foot"><button class="tc-btn" id="reset2">기본값으로</button><button class="tc-btn pri" id="toNext2">다음 · QR 코드와 공유 ›</button></div>
      </div>`;
      const setY = (k, v, redraw = true) => { d.dy = Object.assign(dy(), { [k]: v }); if (d.dy.min > d.dy.count) d.dy.min = d.dy.count; Draft.set(d); if (redraw) draw(); };
      $$('.tc-step').forEach(g => g.addEventListener('click', e => { const x = e.target.closest('[data-d]'); if (!x || x.disabled) return; const k = g.dataset.k; setY(k, Math.max(1, Math.min(k === 'min' ? dy().count : 10, dy()[k] + +x.dataset.d))); }));
      $$('.tc-seg').forEach(g => g.addEventListener('click', e => {
        const x = e.target.closest('[data-v]'); if (!x) return; const k = g.dataset.k, v = x.dataset.v;
        if (k === 'dstep') { step.dy = v; paintSeg('dstep', v); drawPrev(); return; }
        if (k === 'dmode') setY('mode', v); else if (k === 'weeks') setY('weeks', +v); else if (k === 'dphoto') setY('photo', v === '1'); else if (k === 'dsign') setY('tsign', v);
      }));
      ['promise', 'praiseMin', 'praiseDone'].forEach(k => { const i = $('#dy_' + k);
        i.addEventListener('input', () => { $('#cn_' + k).textContent = `${[...i.value].length}/${i.maxLength}`; setY(k, i.value, false); });
        i.addEventListener('change', () => drawPrev()); });
      $$('[data-fill]').forEach(bt => onTap(bt, () => { const k = bt.dataset.fill, i = $('#dy_' + k); i.value = bt.dataset.text; setY(k, i.value, false); $('#cn_' + k).textContent = `${[...i.value].length}/${i.maxLength}`; drawPrev(); }));
      onTap($('#reset2'), () => { d.dy = Object.assign({}, DY_DEF); Draft.set(d); draw(); toast('기본값으로 되돌렸어요'); });
      onTap($('#toNext2'), () => { tab = 3; draw(); });
    } else {
      $('#panel').innerHTML = `
      <div class="tc-col tc-qrcol">
        <h2 class="tc-h">학생 접속 QR 코드</h2>
        <button class="tc-qr" id="qr" aria-label="QR 코드 크게 보기">${QR.toSVG(urlOf())}</button>
        <p class="tc-help">QR 코드를 누르면 전체 화면으로 크게 보여요.</p>
        <div class="tc-qrbtns"><button class="tc-btn" id="qrBig">크게 보기</button><button class="tc-btn" id="qrSave">QR 이미지 저장</button></div>
      </div>
      <div class="tc-col tc-share">
        <section class="tc-sum">
          <div class="tc-sumhead"><h2 class="tc-h">설정 요약</h2><button class="tc-btn sm" id="edit">수정</button></div>
          <p class="tc-mode"><b>${modeName()}</b> 학생은 이렇게 해요</p>
          <ol class="tc-flow">${T_FLOW[d.mode === 'event' ? 'event' : 'class'].map(s => `<li>${s}</li>`).join('')}</ol>
          <dl class="tc-facts">
            <div><dt>소리</dt><dd>효과음 ${d.sound === 'off' ? '끄기' : '켜기'} · 대기 음악 ${d.bgm === 'off' ? '끄기' : '켜기'}</dd></div>
            <div><dt>챌린지</dt><dd>${(() => { const y = dy(); return `${y.mode === 'free' ? `${y.weeks}주 안에 자유롭게` : '학교 가는 날 이어서'} ${y.count}회 · ${Math.min(y.min, y.count)}일 성공 메달${y.promise.trim() ? ' · 선생님 약속 있음' : ''}`; })()}</dd></div>
            <div><dt>결과 게시판</dt><dd>${okBoard() ? `<span class="ok">연결됨</span> ${esc(d.board)}` : '<span class="no">없음</span> 다이어리는 학생 기기에만 저장돼요'}</dd></div>
          </dl>
        </section>
        <section class="tc-sec">
          <h2 class="tc-h">접속 링크</h2>
          <div class="tc-linkrow"><div class="tc-link" id="lnk">${esc(urlOf())}</div><button class="tc-btn" id="copy">링크 복사</button></div>
          ${okBoard() ? '<button class="tc-btn sm" id="bqr">결과 게시판 QR 보기</button>' : ''}
          <p class="tc-help">설정을 바꾸면 링크와 QR도 바뀌어요. 학생은 <b>새 QR을 다시 찍어야</b> 해요.</p>
        </section>
        <div class="tc-foot"><button class="tc-btn" id="prev">‹ 이전</button><button class="tc-btn pri" id="done">설정 완료 · 학생 화면 열기 ›</button></div>
      </div>`;
      onTap($('#copy'), async () => { if (await copyText(urlOf(), $('#lnk'))) toast('링크를 복사했어요.', 1800); });
      onTap($('#bqr'), () => full('결과 게시판 QR (접속용 아님)', d.board, true));
      onTap($('#qr'), () => full('학생 접속 QR 코드', urlOf()));
      onTap($('#qrBig'), () => full('학생 접속 QR 코드', urlOf()));
      onTap($('#qrSave'), saveQR);
      onTap($('#edit'), () => { tab = 1; draw(); });
      onTap($('#prev'), () => { tab = 2; draw(); });
      onTap($('#done'), () => Router.go(returnTo));
    }
    drawPrev();
  };
  const full = (title, text, warn) => {
    const m = Modal.open(`<h3 class="${warn ? 'warn' : ''}">${title}</h3><div class="qr-big">${QR.toSVG(text)}</div><p>${warn ? '챌린지를 마친 뒤 다이어리 이미지를 올릴 때 쓰세요' : '태블릿 카메라로 찍어 주세요'}</p><button class="btn white" data-autofocus id="qc">✕ 닫기</button>`, { cls: 'qr-full', sfx: null });
    onTap($('#qc', m), () => Modal.close());
  };
  $('.tc-tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = +b.dataset.t; draw(); });
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
  if (view === 'S46' || view === 'S47' || view === 'S48') {
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
    const cfg = { mode: qs.get('mode') === 'event' ? 'event' : 'class', board: isHttps(board) ? board : '', bgm: qs.get('bgm') !== 'off' };
    /* 챌린지 다이어리 설정 (선생님 링크 dy · dp · dm · dd) */
    const dyv = (qs.get('dy') || '').split('.');
    if (dyv.length >= 6) cfg.diary = { count: Math.max(1, Math.min(10, +dyv[0] || 5)), mode: dyv[1] === 'f' ? 'free' : 'row', weeks: Math.max(1, Math.min(4, +dyv[2] || 2)), min: Math.max(1, +dyv[3] || 3), photo: dyv[4] !== '0', tsign: dyv[5] === 'n' ? 'n' : 't',
      promise: (qs.get('dp') || '').slice(0, 20), praiseMin: (qs.get('dm') || '').slice(0, 40), praiseDone: (qs.get('dd') || '').slice(0, 40) };
    Config.set(cfg);
    if (!PREVIEW) setSound(qs.get('sound') !== 'off');
    ['mode', 'board', 'sound', 'bgm', 'dy', 'dp', 'dm', 'dd'].forEach(k => qs.delete(k));
  }
  /* 선생님 설정은 전용 주소로만: 사이트 주소 뒤 ?teacher (학생 화면에는 들어가는 길 없음) */
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
  const first = st !== 'none' ? 'S46' : Config.get().mode === 'event' ? 'S39' : 'S00';
  /* 선생님 화면 먼저 (팀 점검 11/8): 주소만으로 연 기기(QR 설정·학생 기록 없음)는 선생님 설정부터.
     QR·공유 링크로 들어온 학생 기기는 바로 학생 화면. 선생님 기기에서 다시 열 때는 주소 뒤 ?teacher */
  const teacherFirst = !fromLink && !configured && !Store.hasRecord() && LabFound.total() === 0;
  if (teacher || teacherFirst) Router.go('T49', { returnTo: first }, { replace: true });
  else Router.go(first, {}, { replace: true });
  /* 5) 오프라인 실행 (https에서만) */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  /* 6) 자정이 지나면 다시 그리기 */
  let day = DateK.today();
  setInterval(() => { const n = DateK.today(); if (n !== day) { day = n; if (Router.current) Router.render(Router.current); } }, 60000);
})();
