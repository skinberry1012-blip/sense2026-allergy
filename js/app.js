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
    const back = () => Router.go(Challenge.status() === 'ended' ? 'S47' : 'S46');
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
  labChar(b, 'staff_hello', 560, { left: 15, bottom: 10 });   // 수호냥 + 말풍선·이름 칸 묶음을 가운데로 (좌우 여백 같게)
  const bub = labBubble(b, { x: 755, y: 300, w: 590, fs: 42, tail: 'l', name: '수호냥', staff: true });
  bub.say('먼저 {{이름}}을 입력해 봐!');
  const field = labEl(b, 'name-px', [755, 480, 590, 112], `
    <input id="name" type="text" maxlength="12" placeholder="이름 (번호도 쓸 수 있어요)" autocomplete="off" enterkeyhint="done" aria-label="이름">
    <span class="count" id="count">0/${NAME_MAX}</span>`, 'label');
  const make = labBtn(b, '내 카드 만들기 ›', 'right:255px;top:672px;font-size:38px', 'y');   // 이름 칸과 떨어진 버튼, 오른쪽 끝 맞춤
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

/* ===================== S41 약속 고르기 (한 화면 · 탭 3개: S41-1 집 / S41-2 학교 / S41-3 밖) ===================== */
Router.screens.RULES = (app, p) => {
  let tab = Math.max(0, Math.min(2, p.tab | 0));
  const empty = () => ({ home: [], school: [], outside: [] });
  const load = () => ({ rules: Store.get('rules', empty()), custom: Store.get('custom', empty()) });
  const clone = o => JSON.parse(JSON.stringify(o));
  let saved = load(), draft = clone(saved);
  const cntPlace = pl => (draft.rules[pl] || []).length + (draft.custom[pl] || []).filter(c => c.checked).length;
  const total = () => PLACES.reduce((a, pl) => a + cntPlace(pl), 0);
  const savedTotal = () => PLACES.reduce((a, pl) => a + (saved.rules[pl] || []).length + (saved.custom[pl] || []).filter(c => c.checked).length, 0);
  const dirty = () => JSON.stringify(draft) !== JSON.stringify(saved);

  app.innerHTML = `
  <div class="sc outdoor rules-screen">
    <header class="rules-head">
      <h1 class="title-banner sm">${pawSVG('#fff')} 세 장소에서 지킬 수 있는 <em>너만의 약속</em>을 골라 보자! ${pawSVG('#fff')}</h1>
    </header>
    <div class="rules-sticky">
      <div class="countbox" id="countbox"></div>
      <div class="tabs" id="tabs" role="tablist"></div>
    </div>
    <img class="rules-cat bob" id="rcat" src="${CAT('pinky_03')}" data-anim="staff_guide" alt="">
    <div class="rules-body">
      <section class="rules-panel">
        <div id="list"></div>
        <div class="custom">
          <span class="custom-lab">✏️ 나만의 약속 직접 쓰기</span>
          <p class="custom-tip">💡 매일 실천할 수 있는 내용을 적어 보아요</p>
          <div class="custom-row">
            <input id="cin" maxlength="${CUSTOM_MAX}" enterkeyhint="done" aria-label="나만의 약속">
            <button class="btn pink" id="cadd" disabled>+ 추가</button>
          </div>
        </div>
        <p class="health-note"><b>i</b>알레르기 종류나 병 이름 같은 건강 정보는 적지 않아요. 나만의 약속은 내 카드에만 나오고, 어디에도 보내지 않아요.</p>
      </section>
    </div>
    <nav class="bottom-bar rules-bar two">
      <button class="btn pink" id="save">✓ 약속 고르기 완료 <small>(저장)</small></button>
      <button class="btn orange" id="next">카드 꾸미기로 이동 ›</button>
    </nav>
  </div>`;

  let lastTotal = total();
  const render = () => {
    const place = PLACES[tab], data = window.RULES_DATA[place], n = total(), ok = n >= MIN_RULES;
    const cb = $('#countbox');
    cb.className = 'countbox ' + (ok ? 'ok' : '');
    cb.innerHTML = `<div class="cb-main"><span class="cb-lab">전체 고른 약속</span><span class="cb-num">${n}<small> / ${MAX_RULES}</small></span>
      <span class="dots">${Array.from({ length: MAX_RULES }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>${i === 2 ? '<em></em>' : ''}`).join('')}</span></div>
      <p class="cb-note">세 장소를 합쳐 3~7개 골라요</p>`;
    if (n !== lastTotal) { replay(cb, 'pop'); if (lastTotal === 2 && n === 3) playSfx('star'); }
    lastTotal = n;
    $('#tabs').innerHTML = PLACES.map((pl, i) => { const d = window.RULES_DATA[pl], k = cntPlace(pl);
      return `<button class="tab ${i === tab ? 'cur' : ''}" role="tab" aria-selected="${i === tab}" data-t="${i}">${d.icon} ${d.name}${k ? `<span class="badge">${k}</span>` : ''}</button>`; }).join('');
    $('#list').innerHTML = data.rules.map(r => `<button class="rule ${draft.rules[place].includes(r.id) ? 'on' : ''}" data-id="${r.id}"><span class="box"></span><span class="txt">${esc(r.text)}</span></button>`).join('')
      + draft.custom[place].map((c, j) => `<div class="rule ${c.checked ? 'on' : ''}" data-c="${j}" role="button" tabindex="0"><span class="box"></span><span class="txt"><span class="mine">나만의</span>${esc(c.text)}</span><button class="del" data-d="${j}" aria-label="삭제">✕</button></div>`).join('');
    $('#cin').placeholder = data.placeholder;
    const v = $('#cin').value.trim();
    $('#cadd').disabled = !v || n >= MAX_RULES;
  };
  const full = () => { playSfx('full'); replay($('#countbox'), 'shake'); toast('집·학교·밖 합쳐서 7개까지 고를 수 있어요.'); };
  const cheer = () => replay($('#rcat'), 'hop');

  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b || +b.dataset.t === tab) return;
    tab = +b.dataset.t; $('#cin').value = ''; playSfx('tab'); replay($('#rcat'), 'nod'); render();
  });
  $('#list').addEventListener('click', e => {
    const place = PLACES[tab];
    const d = e.target.closest('[data-d]'); if (d) { e.stopPropagation(); draft.custom[place].splice(+d.dataset.d, 1); playSfx('uncheck'); return render(); }
    const row = e.target.closest('.rule'); if (!row) return;
    if (row.dataset.id) {
      const ids = draft.rules[place], id = row.dataset.id, k = ids.indexOf(id);
      if (k >= 0) { ids.splice(k, 1); playSfx('uncheck'); }
      else { if (total() >= MAX_RULES) return full(); ids.push(id); playSfx('check'); cheer(); }
    } else {
      const c = draft.custom[place][+row.dataset.c];
      if (!c.checked && total() >= MAX_RULES) return full();
      c.checked = !c.checked; playSfx(c.checked ? 'check' : 'uncheck'); if (c.checked) cheer();
    }
    render();
  });
  const add = () => {
    const place = PLACES[tab], v = $('#cin').value.trim(); if (!v) return;
    if (total() >= MAX_RULES) return full();
    const all = PLACES.flatMap(pl => [...draft.custom[pl].map(c => c.text), ...window.RULES_DATA[pl].rules.map(r => r.text)]);
    if (all.includes(v)) return toast('이미 있는 약속이에요.');
    draft.custom[place].push({ id: 'c' + Date.now().toString(36), text: v, checked: true }); $('#cin').value = '';
    playSfx('check'); cheer(); render();
  };
  $('#cin').addEventListener('input', render);
  $('#cin').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) add(); });
  $('#cin').addEventListener('focus', () => document.body.classList.add('kbd'));
  $('#cin').addEventListener('blur', () => setTimeout(() => document.body.classList.remove('kbd'), 150));
  onTap($('#cadd'), () => (total() >= MAX_RULES ? full() : add()));

  const save = silent => {
    Store.set('rules', clone(draft.rules)); Store.set('custom', clone(draft.custom));
    saved = load(); if (!silent) { playSfx('save'); toast('저장했어요!', 1500); } render();
  };
  onTap($('#save'), () => save());

  const leave = to => {
    if (!dirty()) return to();
    const m = Modal.open(`
      <div class="pop-head orange">고른 약속이 아직 저장되지 않았어요.</div>
      <p class="pop-body">저장하지 않고 이동하면 마지막으로 저장한 상태로 돌아가요.</p>
      <div class="pop-btns"><button class="btn white" id="mSkip">저장하지 않고 이동</button><button class="btn pink" data-autofocus id="mSave">저장하고 이동</button></div>`);
    onTap($('#mSave', m), () => { Modal.close(); save(true); playSfx('save'); to(); });
    onTap($('#mSkip', m), () => { Modal.close(); draft = clone(saved); playSfx('tap'); to(); });
  };
  const toCard = () => {
    if (savedTotal() < MIN_RULES) { playSfx('full'); replay($('#countbox'), 'shake'); return toast('집·학교·밖 합쳐서 3개 이상 골라 주세요.'); }
    playSfx('next'); Router.go('S44');
  };
  onTap($('#next'), () => leave(toCard));
  Router.guard = () => { if (!dirty()) return false; leave(() => Router.go('S40', {}, { replace: true })); return true; };
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
    if (!Challenge.get()) Challenge.create();
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
          <div class="install-top"><img src="${CAT('pinky_03')}" data-anim="staff_guide" alt=""><p class="bubble sm">내일부터 시작되는 5일 챌린지를 위해 <mark>앱을 홈 화면에 추가</mark>해 주세요.</p></div>
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

/* ===================== S46 일일 실천 체크 (S47 구도 + 체크 팝업) ===================== */
const isKept = v => v === 'O';
const markOf = v => v === 'O' ? ['o','⭕'] : v === 'X' ? ['x','❌'] : ['n',''];
Router.screens.S46 = (app, p) => {
  const c = Challenge.get();
  if (!c) return Router.go('S39', {}, { replace: true });
  const status = Challenge.status(c);
  if (status === 'ended') return Router.go('S47', {}, { replace: true });
  const rules = selectedRules(), t = DateK.today(), need = needCount(rules.length), name = Store.get('name', '');
  const locked = status !== 'active';
  app.innerHTML = `
  <div class="sc outdoor s47 s46n">
    <h1 class="title-banner sm s47-tb">오늘 <em>${esc(name)}${josaNeun(name)}</em> 몇 개나 지켰을까?</h1>
    <p class="sub-pill s47-sub">${locked ? '오늘은 체크하지 않는 날이에요' : '👆 약속 카드를 눌러 오늘 실천을 체크해요!'}</p>
    <div class="bubble sm s46-bubble">내가 정한 약속을<br>오늘도 잘 지켜볼까요?</div>
    <aside class="s47-left"><img class="s47-cat" src="${CAT('pinky_03')}" data-anim="staff_guide" alt=""><div class="selbox" id="todaybox"></div></aside>
    <section class="s47-center">
      <div class="days" id="days"></div>
      <p class="legend"><span>⭐ 별 받음</span><span class="gray">⭐ 했지만 별 없음</span><span>– 체크 안 함</span><span>빈칸 아직</span></p>
      <div class="list-card" id="list"></div>
    </section>
    <aside class="s47-side"><div class="statbox" id="stats"></div><div class="resultbox" id="result"></div></aside>
    <div class="s46n-foot">
      <div class="resbar"><button class="btn pink big" id="res"></button><p class="hint" id="resHint"></p></div>
    </div>
    <p class="footer-line s46n-line">🔒 내 기록은 이 기기에만 저장돼요 <span class="dot">·</span> <button class="link" id="restart">↺ 처음부터 다시 하기</button></p>
  </div>`;

  const render = () => {
    const cc = Challenge.get(), log = cc.log[t] || {};
    $('#days').innerHTML = cc.days.map(d => {
      const s = Challenge.dayState(cc, d), mk = { star: '⭐', nostar: '⭐', miss: '–' }[s] || '';
      return `<div class="day ${s} ${d === t ? 'is-today sel' : ''}"><div class="mark">${mk}</div>${DateK.md(d)}<br>${DateK.wd(d)}요일</div>`;
    }).join('');
    const states = cc.days.map(d => Challenge.dayState(cc, d));
    const done = states.filter(s => s === 'star' || s === 'nostar').length, stars = states.filter(s => s === 'star').length;
    $('#stats').innerHTML = `<h3>📋 나의 챌린지 현황</h3><p>✅ 완료한 날짜 <b>${done}<small> / 5일</small></b></p><p>⭐ 별 받은 날짜 <b>${stars}<small> / 5일</small></b></p>`;
    const o = rules.filter(r => isKept(log[r.id])).length, answered = rules.filter(r => log[r.id]).length, all = answered === rules.length;
    const ts = Challenge.dayState(cc, t), tm = { star: '⭐', nostar: '⭐', today: '📋' }[ts] || '🌙';
    $('#todaybox').innerHTML = `<h3>오늘</h3><p class="seld">${DateK.md(t)}<br>${DateK.wd(t)}요일</p><div class="selmark ${ts}">${tm}</div>`;
    if (locked) {
      const next = Challenge.nextCheckDay(cc);
      const msg = status === 'before' ? `<b>내일부터 시작해요!</b>첫 체크는 <em class="inl">${DateK.short(cc.days[0])}</em>에 만나요.`
        : `<b>오늘은 쉬는 날이에요</b>주말과 공휴일에는 체크하지 않아요.<br>다음 체크는 <em class="inl">${next ? DateK.short(next) : '-'}</em>에 만나요!`;
      $('#list').innerHTML = `<h2>📋 오늘 실천한 약속</h2><div class="empty">${msg}</div>`;
      $('#result').innerHTML = `<h3>오늘의 실천 결과</h3><div class="big dash">🌙</div><span class="msg soft">쉬는 날</span>`;
      $('#res').innerHTML = '📊 나의 <em>챌린지 기록</em> 보기 ›'; $('#res').disabled = false;
      $('#resHint').textContent = '지난 기록은 결과 화면에서 날짜를 눌러 볼 수 있어요';
      return;
    }
    $('#list').innerHTML = `<h2>📋 오늘 실천한 약속 <span class="ck-btn">✏️ ${answered ? '체크 고치기' : '눌러서 체크하기'}</span></h2><div class="scroll">` +
      rules.map(r => { const [k, m] = markOf(log[r.id]); return `<div class="rule-res"><p class="t">${r.mine ? '<span class="mine">나만의</span>' : ''}${esc(r.text)}</p><span class="res ${k}">${m}</span></div>`; }).join('') + '</div>';
    $('#list').classList.add('tapcard');
    $('#result').innerHTML = all
      ? `<h3>오늘의 실천 결과</h3><p class="n"><b>${o}</b> / ${rules.length}개 지켰어요!</p><div class="big ${o >= need ? '' : 'gray'}">⭐</div><span class="msg ${o >= need ? '' : 'soft'}">${o >= need ? '잘 실천했어요!' : '다음엔 조금 더!'}</span>`
      : `<h3>오늘의 실천 결과</h3><p class="goal-t">약속 ${rules.length}개 중 <b>${need}개</b> 지키면 ⭐</p><p class="now">지금 ⭕ ${o}개 · 남은 약속 ${rules.length - answered}개</p><div class="big gray">⭐</div><span class="msg soft">체크 중</span>`;
    $('#res').disabled = !all; $('#res').innerHTML = '📊 오늘의 <em>실천 결과</em> 보기 ›';
    $('#resHint').textContent = all ? '오늘 약속을 모두 체크했어요!' : `약속을 모두 체크하면 결과를 볼 수 있어요 (남은 약속 ${rules.length - answered}개)`;
  };

  const openCheck = () => {
    const cc = Challenge.get(), draft = { ...(cc.log[t] || {}) };
    const row = r => { const s = r.type === 'situ' && !r.mine, v = draft[r.id];
      return `<div class="ck-row"><p class="t">${r.mine ? '<span class="mine">나만의</span>' : ''}${esc(r.text)}${s ? `<button class="help" data-help="${r.id}" aria-label="도움말 보기" aria-expanded="false">?</button>` : ''}</p>
      <div class="ox"><button class="o ${v === 'O' ? 'on' : ''}" data-id="${r.id}" data-v="O"><i>⭕</i>지켰어요</button><button class="x ${v === 'X' ? 'on' : ''}" data-id="${r.id}" data-v="X"><i>❌</i>못 지켰어요</button></div></div>`; };
    const w = Modal.open(`<div class="ck-head"><img class="ck-cat" src="${CAT('pinky_02')}" data-anim="staff_heart" alt=""><h2>📋 오늘 실천한 <em>약속</em></h2><button class="ck-x" id="ckX" aria-label="닫기">✕</button></div>
      <p class="ck-sub">약속을 하나씩 읽고 오늘 실천한 대로 눌러요 <span id="ckN"></span></p>
      <div class="ck-list" id="ckList">${rules.map(row).join('')}</div>
      <div class="ck-foot"><button class="btn white" id="ckClose">취소</button><button class="btn pink big" id="ckSave">✔ 저장하기</button></div>`, { cls: 'check-dim' });
    const upd = () => { $('#ckN', w).textContent = `${rules.filter(r => draft[r.id]).length} / ${rules.length} 체크`; };
    const tip = document.createElement('div'); tip.className = 'help-tip'; tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<button class="tip-x" aria-label="닫기">✕</button>💡 오늘 이런 상황이 없었나요?<br>그런 일이 생기면 꼭 하겠다고 다짐했다면<br><b>[⭕ 지켰어요]</b>를 눌러요.';
    let openHelp = null;
    const closeTip = () => { if (!openHelp) return; const hb = $(`[data-help="${openHelp}"]`, w); if (hb) { hb.classList.remove('on'); hb.setAttribute('aria-expanded', 'false'); } tip.remove(); openHelp = null; };
    const showTip = hb => {
      closeTip(); openHelp = hb.dataset.help; hb.classList.add('on'); hb.setAttribute('aria-expanded', 'true');
      const modal = $('.modal', w); modal.appendChild(tip);
      const mr = modal.getBoundingClientRect(), br = hb.getBoundingClientRect(), sc = mr.width / modal.offsetWidth || 1;
      const x = (br.left + br.width / 2 - mr.left) / sc, y = (br.top - mr.top) / sc;
      tip.style.left = Math.max(16, x - 260) + 'px'; tip.style.top = Math.max(10, y - tip.offsetHeight - 14) + 'px';
      tip.style.setProperty('--tail', (x - Math.max(16, x - 260)) + 'px');
    };
    w.addEventListener('click', e => {
      const hb = e.target.closest('[data-help]');
      if (hb) { e.stopPropagation(); if (openHelp === hb.dataset.help) closeTip(); else { playSfx('tap'); showTip(hb); } return; }
      if (e.target.closest('.tip-x') || !e.target.closest('.help-tip')) closeTip();
      const b = e.target.closest('[data-v]'); if (!b) return;
      if (draft[b.dataset.id] !== b.dataset.v) { playSfx(b.dataset.v === 'O' ? 'check' : 'uncheck'); replay(b, 'pop'); if (b.dataset.v === 'O') replay($('.ck-cat', w), 'hop'); }
      draft[b.dataset.id] = b.dataset.v; b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); upd();
    });
    $('#ckList', w).addEventListener('scroll', closeTip);
    onTap($('#ckX', w), () => { playSfx('tap'); Modal.close(); });
    onTap($('#ckClose', w), () => { playSfx('tap'); Modal.close(); });
    onTap($('#ckSave', w), () => { const c2 = Challenge.get(); c2.log[t] = draft; Store.set('challenge', c2); Challenge.recompute(c2, t); Modal.close(); playSfx('save'); render(); $$('#list .res').forEach((r, i) => { r.style.animationDelay = i * .1 + 's'; replay(r, 'pop'); }); toast('저장했어요!'); if (TestMode.on) TestBar.update(); });
    upd();
  };
  $('#list').addEventListener('click', () => { if (!locked) openCheck(); });
  onTap($('#res'), () => { playSfx('next'); Router.go('S47', { sel: locked ? null : t }); });
  onTap($('#del'), () => openDeleteModal());
  onTap($('#restart'), () => Router.go('S39'));
  render();
  if (p.check && !locked) openCheck();
  if (p.install && !isStandalone()) openInstallModal();
};

/* ===================== S47 5일 실천 챌린지 결과 ===================== */
Router.screens.S47 = (app, p) => {
  const c = Challenge.get();
  if (!c) return Router.go('S39', {}, { replace: true });
  const status = Challenge.status(c), ended = status === 'ended', t = DateK.today();
  const rules = selectedRules(), need = needCount(rules.length);
  let sel = p.sel && c.days.includes(p.sel) ? p.sel : ended ? c.days[4] : (c.days.includes(t) ? t : ([...c.days].reverse().find(d => d < t) || c.days[0]));
  app.innerHTML = `
  <div class="sc outdoor s47">
    <h1 class="title-banner sm s47-tb">📊 5일 실천 <em>챌린지</em> 결과</h1>
    <p class="sub-pill s47-sub">나의 5일 실천 기록을 확인해요!</p>
    <aside class="s47-left">
      <img class="s47-cat" src="${CAT('pinky_03')}" data-anim="staff_guide" alt="">
      <div class="selbox" id="selbox"></div>
    </aside>
    <section class="s47-center">
      <div class="days" id="days"></div>
      <p class="legend"><span>⭐ 별 받음</span><span class="gray">⭐ 했지만 별 없음</span><span>– 체크 안 함</span><span>빈칸 아직</span></p>
      <div class="list-card" id="list"></div>
    </section>
    <aside class="s47-side"><div class="statbox" id="stats"></div><div class="resultbox" id="result"></div></aside>
    <nav class="s47-foot ${ended ? 'ended' : ''}">
      ${ended ? '' : '<button class="btn white big" id="back">‹ 오늘의 체크로 돌아가기</button>'}
      <button class="btn pink big" id="final" ${ended ? '' : 'disabled'}>${ended ? '🏆 5일 챌린지 <em>최종 결과</em> 보기 ›' : '🔒 5일 챌린지 최종 결과 보기'}</button>
    </nav>
    <p class="hint s47-hint">${ended ? '5일 챌린지가 끝났어요! 최종 결과를 확인해 보세요.' : `최종 결과는 5일 챌린지가 끝나면 볼 수 있어요 (마지막 날: ${DateK.short(c.days[4])})`}</p>
  </div>`;
  const render = () => {
    $('#days').innerHTML = c.days.map(d => {
      const s = Challenge.dayState(c, d), mk = { star: '⭐', nostar: '⭐', miss: '–' }[s] || '';
      return `<button class="day ${s} ${d === t ? 'is-today' : ''} ${d === sel ? 'sel' : ''}" data-d="${d}" ${s === 'future' ? 'disabled' : ''}><div class="mark">${mk}</div>${DateK.md(d)}<br>${DateK.wd(d)}요일</button>`;
    }).join('');
    const states = c.days.map(d => Challenge.dayState(c, d));
    const done = states.filter(s => s === 'star' || s === 'nostar').length, stars = states.filter(s => s === 'star').length;
    $('#stats').innerHTML = `<h3>📋 나의 챌린지 현황</h3><p>✅ 완료한 날짜 <b>${done}<small> / 5일</small></b></p><p>⭐ 별 받은 날짜 <b>${stars}<small> / 5일</small></b></p>`;
    const log = c.log[sel] || {}, label = DateK.short(sel), isT = sel === t;
    const ss = Challenge.dayState(c, sel);
    const mk = { star: '⭐', nostar: '⭐', miss: '–', today: '📋', future: '🕒' }[ss] || '';
    $('#selbox').innerHTML = `<h3>선택한 날짜</h3><p class="seld">${DateK.md(sel)}<br>${DateK.wd(sel)}요일</p><div class="selmark ${ss}">${mk}</div>`;
    const complete = Challenge.dayComplete(c, sel, rules);
    if (complete) {
      const o = rules.filter(r => isKept(log[r.id])).length, ok = o >= need;
      $('#list').innerHTML = `<h2>${isT ? '오늘' : label} 실천한 약속 <span>${label}</span></h2><div class="scroll">` +
        rules.map(r => `<div class="rule-res"><p class="t">${r.mine ? '<span class="mine">나만의</span>' : ''}${esc(r.text)}</p><span class="res ${markOf(log[r.id])[0]}">${markOf(log[r.id])[1]}</span></div>`).join('') + '</div>';
      $('#result').innerHTML = `<h3>${isT ? '오늘의' : label} 실천 결과</h3><p class="n"><b>${o}</b> / ${rules.length}개 지켰어요!</p><div class="big ${ok ? '' : 'gray'}">⭐</div><span class="msg ${ok ? '' : 'soft'}">${ok ? '잘 실천했어요!' : '다음엔 조금 더!'}</span><p class="need">${rules.length}개 중 ${need}개 지키면 별</p>`;
    } else if (sel > t) {
      $('#list').innerHTML = `<h2>${label} 실천한 약속 <span>${label}</span></h2><div class="empty"><b>아직 시작 전이에요</b><p>이날이 되면 약속을 체크할 수 있어요.<br>첫 체크는 <em class="inl">${DateK.short(c.days[0])}</em>에 만나요!</p></div>`;
      $('#result').innerHTML = `<h3>${label} 실천 결과</h3><div class="big dash">🕒</div><span class="msg soft">아직이에요</span>`;
    } else if (isT) {
      $('#list').innerHTML = `<h2>오늘 실천한 약속 <span>${label}</span></h2><div class="empty"><b>아직 체크 중이에요</b>오늘의 체크로 돌아가 약속을 모두 체크해 주세요.</div>`;
      $('#result').innerHTML = `<h3>오늘의 실천 결과</h3><div class="big gray">⭐</div><span class="msg soft">체크 중</span>`;
    } else {
      $('#list').innerHTML = `<h2>${label} 실천한 약속 <span>${label}</span></h2><div class="empty"><b>이날은 체크하지 않았어요</b>지난 날짜는 다시 체크할 수 없어요.<br>오늘의 약속을 꼭 체크해 주세요!</div>`;
      $('#result').innerHTML = `<h3>${label} 실천 결과</h3><div class="big dash">–</div><span class="msg soft">기록 없음</span>`;
    }
  };
  $('#days').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b || b.disabled) return; sel = b.dataset.d; playSfx('tap'); render(); });
  onTap($('#back'), () => { playSfx('tap'); Router.go('S46'); });
  onTap($('#final'), () => { if (ended) { playSfx('next'); Router.go('S48'); } });
  render();
  /* 오늘 별을 처음 받았으면 한 번만 별 연출 + 소리 (promiseCard.starShown) */
  const ts = Challenge.dayState(c, t), shown = Store.get('starShown', []);
  if (ts === 'star' && !shown.includes(t)) {
    Store.set('starShown', [...shown, t]); playSfx('star');
    [$(`#days [data-d="${t}"] .mark`), $('#result .big')].forEach(el => replay(el, 'star-pop'));
  } else if (ts === 'nostar') replay($('.s47-cat'), 'nod');
};

/* ===================== S48 5일 챌린지 완료 ===================== */
let savedCompleteThisSession = false;
Router.screens.S48 = (app) => {
  const c = Challenge.get();
  if (!c) return Router.go('S39', {}, { replace: true });
  if (Challenge.status(c) !== 'ended') return Router.go('S47', {}, { replace: true });
  const name = Store.get('name', '');
  const states = c.days.map(d => Challenge.dayState(c, d)), stars = states.filter(s => s === 'star').length;
  const line = stars === 5 ? '⭐ 별 5개! <b>완벽해요!</b>' : stars >= 3 ? `⭐ 별 ${stars}개! <b>잘했어요!</b>` : `별 ${stars}개 · <b>다음에 다시 도전해요!</b>`;
  const first = !sessionStorage.getItem('s48Shown');
  app.innerHTML = `
  <div class="sc outdoor s48">
    <h2 class="title-banner sm s48-tb">🏆 5일 챌린지 <em>완료!</em></h2>
    <p class="sub-pill s48-sub">5일 동안 나의 예방 <em class="pk">약속</em>을 실천했어요!</p>
    <img class="s48-cat" src="assets/char/staff_cheer_m.png" alt="" data-anim="staff_cheer">
    <div class="days s48-days">${c.days.map((d, i) => `<div class="day ${states[i]}">${DateK.md(d)}<br>${DateK.wd(d)}요일<div class="mark ${states[i] === 'star' && first ? 'star-pop' : ''}" style="animation-delay:${i * .15}s">${{ star: '⭐', nostar: '⭐', miss: '–' }[states[i]] || ''}</div></div>`).join('')}</div>
    <aside class="s48-box"><h3>⭐ 나의 챌린지 결과 ⭐</h3><p class="starn"><span class="bigstar">⭐</span><span>별 획득<br><b>${stars}</b> <small>/ 5일</small></span></p></aside>
    <div class="ribbon ${first ? 'pop' : ''}">축하합니다! 5일 챌린지 완료!</div>
    <p class="ribbon-line">${line}</p>
    <div class="s48-btns ${stars >= 3 ? '' : 'one'}">
      <button class="btn white big" id="del">↻ 새로 도전하기</button>
      ${stars >= 3 ? '<button class="btn blue big pulse" id="medal">🏅 챌린지 성공 메달 받기 ›</button>' : ''}
    </div>
    <p class="warn">${stars >= 3 ? '새로 도전하면 지금 기록은 지워져요. 메달을 먼저 저장해 두세요!' : '별 3일 이상이면 메달을 받을 수 있어요. 다시 도전해 볼까요?'}</p>
  </div>`;
  if (first) { sessionStorage.setItem('s48Shown', '1'); playSfx('fanfare'); confetti(); }
  onTap($('#medal'), () => openMedalModal({ stars }));
  onTap($('#del'), () => { playSfx('tap'); openDeleteModal(); });
};

/* ===================== S48-2 챌린지 성공 메달 받기 (S48 위 팝업) ===================== */
function openMedalModal({ stars }) {
  const cardNo = Store.get('cardNo', ''), board = Config.get().board;
  let color = 'coral', savedColor = null;
  const m = Modal.open(`
    <h2 class="md-title">🏅 5일 챌린지 성공 메달 받기!</h2>
    <button class="md-x" id="mdX" aria-label="닫기">✕</button>
    <div class="md-talk"><img src="assets/char/staff_cheer_m.png" alt="" data-anim="staff_cheer"><p>5일 동안 약속을 잘 지킨 나에게 주는 메달이에요.<br>마음에 드는 색을 골라 저장해 보세요!</p></div>
    <div class="md-list" id="mdList">${Object.keys(MEDAL_COLORS).map(k => `<button class="md-card ${k === color ? 'on' : ''}" data-k="${k}" aria-label="${MEDAL_COLORS[k].label} 메달"><span class="md-chk"></span><canvas data-c="${k}"></canvas></button>`).join('')}</div>
    <button class="btn pink big md-save" id="mdSave">⬇ 선택한 메달 이미지로 저장하기 ›</button>
    <button class="link md-later" id="mdLater">다음에 저장할래요</button>`, { cls: 'medal-dim' });
  $$('canvas[data-c]', m).forEach(cv => drawMedal(cv, { color: cv.dataset.c, stars, cardNo }));
  const paintBtn = () => {
    const b = $('#mdSave', m);
    if (savedColor === color) b.innerHTML = board ? '📌 선생님 게시판에 올리기 ›' : '✔ 저장 완료! 다른 색도 저장하기';
    else b.innerHTML = '⬇ 선택한 메달 이미지로 저장하기 ›';
    b.classList.toggle('green', savedColor === color && !!board);
  };
  $('#mdList', m).addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b || b.dataset.k === color) return;
    color = b.dataset.k; playSfx('tab');
    $$('.md-card', m).forEach(x => x.classList.toggle('on', x === b)); replay(b, 'pop'); paintBtn();
  });
  const save = async () => {
    const cv = document.createElement('canvas');
    await drawMedal(cv, { color, stars, cardNo });
    try {
      await saveCanvasPNG(cv, `challenge-medal_${cardNo}.png`);
      savedColor = color; playSfx('save'); replay($(`.md-card[data-k="${color}"]`, m), 'shine-once');
      toast('메달을 저장했어요! 기록을 지워도 이 이미지는 남아요.', 2200); paintBtn();
    } catch (e) { toast(e && e.name === 'AbortError' ? '저장이 취소됐어요.' : '저장하지 못했어요. 다시 눌러 주세요.'); }
  };
  onTap($('#mdSave', m), async () => {
    if (savedColor === color && board) { playSfx('next'); return window.open(board, '_blank', 'noopener'); }
    if (savedColor === color && !board) { savedColor = null; paintBtn(); }
    await save();
  });
  const close = () => { playSfx('tap'); Modal.close(); };
  onTap($('#mdX', m), close); onTap($('#mdLater', m), close);
  m.addEventListener('click', e => { if (e.target === m) close(); });
}

/* 색종이 (S48 진입 때 한 번) */
function confetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#E05429', '#ffd43b', '#4fa0ff', '#4fcf6a', '#899AE1'];
  for (let i = 0; i < 36; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * .6 + 's'; s.style.transform = `rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
  $('#app').appendChild(box); setTimeout(() => box.remove(), 3200);
}

/* ===================== S48-2 기록 삭제 확인 팝업 (S46·S48 공통) ===================== */
function openDeleteModal() {
  const m = Modal.open(`
    <div class="pop-head redbar">↻ 새로 도전할까요?</div>
    <div class="del-grid">
      <div class="del-art"><img src="assets/char/staff_hello_m.png" alt="" data-anim="staff_hello"></div>
      <div>
        <p class="pop-box pink">지금까지의 <strong>약속 카드와 5일 기록이 지워지고</strong> 처음부터 다시 시작해요.</p>
        <p class="pop-box yellow">이미 저장한 <strong>카드·메달 이미지</strong>는 지워지지 않아요.</p>
      </div>
    </div>
    <div class="pop-btns"><button class="btn blue" data-autofocus id="dNo">아니오, 그대로 둘래요</button><button class="btn red" id="dYes">네, 새로 도전할래요</button></div>`,
    { cls: 'delete', onBack: () => {}, sfx: 'full' });
  onTap($('#dNo', m), () => { playSfx('tap'); Modal.close(); });
  onTap($('#dYes', m), () => {
    $('#dYes', m).disabled = true; playSfx('delete');
    Store.clearAll(); signatureImg = null; savedCompleteThisSession = false;
    Modal.close();
    Router.go('S39', {}, { replace: true });   // 새로 도전하기 → 약속 카드 만들기부터 (팀 점검 11/8)
  });
}

/* ===================== S49 선생님 설정 (탭 2개 · 큰 미리 보기) — 2026-11-09 새 구도 =====================
   참고: 확정 그림 모음 16쪽 시안 (한 줄 제목 · 접는 탭 · 번호 붙은 칸)
   버튼은 세 가지만: .tc-btn.pri(주 버튼, 화면에 하나) · .tc-btn(보조) · .tc-seg(고르기)
   스타일은 css/teacher.css */
const isHttps = s => /^https:\/\/\S+$/i.test(s);
const DEMO_BASE = 'https://skinberry1012-blip.github.io/sense2026-allergy/';   // 내 컴퓨터에서 열 때 보여 줄 예시 주소
/* 미리 보기에서 열어 볼 화면 (연구소 · 약속 카드) */
const PREVIEW_STEPS = {
  lab:  [['S00', '처음'], ['S01', '이야기'], ['S05', '활동 고르기'], ['S06', '집 3-1'], ['S15', '급식실 3-2'], ['S24', '운동장 3-3'], ['S36-3', '증상 카드'], ['S37', '대처 방법'], ['S38A', '기억 체크']],
  card: [['S39', '시작'], ['S40', '이름'], ['RULES', '약속 고르기'], ['S44', '카드 꾸미기'], ['S46', '5일 체크'], ['S47', '결과'], ['S48', '완료']]
};
const T_FLOW = {
  class: ['연구소 · 알레르기 원인 12가지 찾기', '증상 카드 · 대처 방법 익히기', '나만의 예방 약속 카드 만들기', '5일 실천 체크 → 메달 받기'],
  event: ['나만의 예방 약속 카드 만들기', '5일 실천 체크 → 메달 받기']
};
Router.screens.T49 = (app, p) => {
  const returnTo = p.returnTo || 'S00';
  let tab = p.tab || 1, d = Draft.get(), dev = 'tablet', view = Draft.get().mode === 'event' ? 'card' : 'lab';
  const step = { lab: 'S00', card: 'S39' };   // 부분마다 마지막으로 연 화면
  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const base = local ? DEMO_BASE : location.origin + location.pathname;
  const okBoard = () => d.board && isHttps(d.board);
  const query = () => '?mode=' + (d.mode === 'event' ? 'event' : 'class') + (okBoard() ? '&board=' + encodeURIComponent(d.board) : '') + (d.sound === 'off' ? '&sound=off' : '') + (d.bgm === 'off' ? '&bgm=off' : '');
  const urlOf = () => base + query();
  const modeName = () => d.mode === 'event' ? '행사용' : '수업용';
  app.innerHTML = `<div class="sc tgx">
    <header class="tc-head">
      <h1 class="tc-title">냥박사의 알레르기 연구소 <span>선생님 설정</span></h1>
      <p class="tc-sub">학생에게 QR을 나눠 주기 전에 정해 주세요</p>
    </header>
    <nav class="tc-tabs" role="tablist"><button class="tc-tab" data-t="1" role="tab"><b>01</b> 기본 설정</button><button class="tc-tab" data-t="2" role="tab"><b>02</b> QR 코드와 공유</button></nav>
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
          <p class="tc-help" id="err">5일 챌린지 메달 이미지를 올릴 패들렛·띵커벨 보드 주소예요.</p>
        </section>
        <section class="tc-device">
          <button class="tc-btn sm danger" id="wipe">이 기기 기록 지우기</button>
          <p>학생 기록(이름·약속·5일 체크)은 <b>이 기기에만</b> 저장되고 서버로 보내지 않아요. 공용 기기는 수업 뒤 지워 주세요.</p>
        </section>
      </div>
      <div class="tc-col tc-pv">
        <div class="tc-pvhead"><h2 class="tc-h">미리 보기</h2>
          ${seg('view', [['lab', '연구소'], ['card', '약속 카드']], view)}
          ${seg('dev', [['tablet', '태블릿'], ['phone', '휴대폰']], dev)}</div>
        <div class="tc-steps" id="steps" aria-label="열어 볼 화면"></div>
        <div class="tc-frame" id="frame"><iframe id="pv" title="학생 화면 미리 보기"></iframe></div>
        <p class="tc-help" id="pvcap"></p>
        <div class="tc-foot"><button class="tc-btn" id="reset">기본값으로</button><button class="tc-btn pri" id="toNext">다음 · QR 만들기 ›</button></div>
      </div>`;
      $('#modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; d.mode = b.dataset.m; Draft.set(d); view = d.mode === 'event' ? 'card' : 'lab';
        $$('#modes button').forEach(x => x.classList.toggle('on', x === b)); drawPrev(); });
      $('#board').addEventListener('change', e => { d.board = e.target.value.trim(); Draft.set(d);
        const bad = d.board && !isHttps(d.board); $('#uf').classList.toggle('bad', !!bad);
        $('#err').classList.toggle('bad', !!bad);
        $('#err').textContent = bad ? 'https로 시작하는 주소를 넣어 주세요.' : '5일 챌린지 메달 이미지를 올릴 패들렛·띵커벨 보드 주소예요.'; });
      $('#steps').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; step[view] = b.dataset.s; drawPrev(); });
      $$('.tc-seg').forEach(g => g.addEventListener('click', e => {
        const x = e.target.closest('[data-v]'); if (!x || x.disabled) return; const k = g.dataset.k;
        if (k === 'view') { view = x.dataset.v; drawPrev(); return; }
        if (k === 'dev') { dev = x.dataset.v; paintSeg('dev', dev); fitFrame(); return; }
        d[k] = x.dataset.v; Draft.set(d); paintSeg(k, x.dataset.v); drawPrev();
      }));
      onTap($('#wipe'), () => {
        const m = Modal.open(`<div class="pop-head redbar">이 기기의 기록을 모두 지울까요?</div>
          <p class="pop-body">이 기기에 저장된 <b class="red">약속 카드·5일 기록·연구소 진행</b>이 모두 지워져요.<br>다음 학생이 처음부터 시작할 수 있어요.</p>
          <div class="pop-btns"><button class="btn blue" data-autofocus id="wNo">취소</button><button class="btn red" id="wYes">모두 지우기</button></div>`, { sfx: 'full' });
        onTap($('#wNo', m), () => Modal.close());
        onTap($('#wYes', m), () => { playSfx('delete'); Store.clearAll(); try { sessionStorage.clear(); } catch (e) {} Modal.close(); toast('이 기기의 기록을 모두 지웠어요.'); });
      });
      onTap($('#toNext'), () => { tab = 2; draw(); });
      onTap($('#reset'), () => { d = { mode: 'class', board: '', sound: 'on', bgm: 'on' }; Draft.set(d); view = 'lab'; draw(); toast('기본값으로 되돌렸어요'); });
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
            <div><dt>결과 게시판</dt><dd>${okBoard() ? `<span class="ok">연결됨</span> ${esc(d.board)}` : '<span class="no">없음</span> 메달은 학생 기기에만 저장돼요'}</dd></div>
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
      onTap($('#prev'), () => { tab = 1; draw(); });
      onTap($('#done'), () => Router.go(returnTo));
    }
    drawPrev();
  };
  const full = (title, text, warn) => {
    const m = Modal.open(`<h3 class="${warn ? 'warn' : ''}">${title}</h3><div class="qr-big">${QR.toSVG(text)}</div><p>${warn ? '5일 챌린지를 마친 뒤 메달 이미지를 올릴 때 쓰세요' : '태블릿 카메라로 찍어 주세요'}</p><button class="btn white" data-autofocus id="qc">✕ 닫기</button>`, { cls: 'qr-full', sfx: null });
    onTap($('#qc', m), () => Modal.close());
  };
  $('.tc-tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = +b.dataset.t; draw(); });
  window.addEventListener('resize', fitFrame);
  draw();
};
Router.screens.T50 = (app, p) => Router.screens.T49(app, { ...p, tab: 2 });

/* 미리 보기용 예시 기록 (preview 키에만 저장) */
function seedPreview(view) {
  Store.clearAll();
  Store.set('name', '김건강'); Store.set('cardNo', 'AL-PREVIEW');
  Store.set('rules', { home: ['home-1', 'home-2'], school: ['school-1', 'school-3'], outside: ['outside-2'] });
  Store.set('custom', { home: [], school: [], outside: [] });
  /* 연구소 뒤쪽 화면은 앞 단계를 마친 것처럼 (미리 보기 기기에만) */
  if (['S36-3', 'S37', 'S38', 'S38A'].includes(view) && window.LAB) {
    Store.set('labFound', Object.fromEntries(Object.entries(LAB.places).map(([k, pl]) => [k, pl.points.map(pt => pt.item)])));
    if (view !== 'S36-3') LabState.cardsSeen = LAB.cards.list.map(c => c.id);
    if (view === 'S38A') LabState.copeSeen = { light: true, severe: true };
  }
  if (view === 'S46' || view === 'S47' || view === 'S48') {
    const real = DateK.override; DateK.override = '2026-11-04';
    const c = Challenge.create ? Challenge.create() : null;
    const cc = Challenge.get(), ids = selectedRules().map(r => r.id);
    const upto = view === 'S48' ? 5 : 2;
    cc.days.slice(0, upto).forEach((d, i) => { cc.log[d] = {}; ids.forEach((id, j) => cc.log[d][id] = (i === 1 && j === 1) ? 'X' : 'O'); });
    Store.set('challenge', cc); cc.days.slice(0, upto).forEach(d => Challenge.recompute(Challenge.get(), d));
    DateK.override = view === 'S48' ? '2026-11-20' : cc.days[2]; void c; void real;
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
        Router.go(s === 'ended' ? 'S47' : 'S46', {}, { replace: true });
      });
    }
    const c = Challenge.get();
    if (!c) { TestBar.el.innerHTML = '🧪 점검 모드 · 약속 카드를 만들면 챌린지를 바로 시작해요'; return; }
    const i = TestMode.idx(c), n = c.days.length, ended = Challenge.status(c) === 'ended';
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
  const fromLink = qs.has('mode') || qs.has('board') || qs.has('sound') || qs.has('bgm');   // QR·공유 링크로 들어온 학생 기기
  let configured = false; try { configured = localStorage.getItem(CFG_KEY) !== null; } catch (e) {}
  if (qs.has('mode') || qs.has('board') || qs.has('sound') || qs.has('bgm')) {
    const board = qs.get('board') || '';
    Config.set({ mode: qs.get('mode') === 'event' ? 'event' : 'class', board: isHttps(board) ? board : '', bgm: qs.get('bgm') !== 'off' });
    if (!PREVIEW) setSound(qs.get('sound') !== 'off');
    qs.delete('mode'); qs.delete('board'); qs.delete('sound'); qs.delete('bgm');
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
  const first = st === 'ended' ? 'S47' : st !== 'none' ? 'S46' : Config.get().mode === 'event' ? 'S39' : 'S00';
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
