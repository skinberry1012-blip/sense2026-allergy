/* =========================================================
   card.js — 약속 카드(S44)와 챌린지 메달(S48-2)를 canvas로 그리기
   미리보기와 저장 이미지는 같은 함수로 그려서 똑같이 나와요.
   ========================================================= */
'use strict';

const FONT = '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",system-ui,sans-serif';
const CARD_W = 1536, CARD_H = 1024;
const HEAD = '"Jua",' + FONT;

/* 카드 배경 3종 (확정 그림 1536×1024) — 칸 좌표는 그림의 빈 칸에 맞춤
   새 구도 (팀 점검 11/8): 큰 칸 왼쪽에 수호 친구 크게, 오른쪽에 예방 수칙
   아래 줄: 작성일 · 이름 · 서명 동그라미(선택). 고유번호·서명 줄은 넣지 않음 */
const CARD_TITLE = '알레르기 예방 약속 카드';
const DESIGNS = {
  certificate: { name: '인증서', bg: 'assets/card/bg_certificate.jpg', titleBox: [410, 116, 720, 128], titleSize: 54, titleColor: '#2F5A1F',
    box: [206, 312, 1118, 424], nameBox: [909, 804, 335, 88], seal: [1326, 846, 60] },
  lab: { name: '연구실', bg: 'assets/card/bg_lab.jpg', titleBox: [400, 92, 740, 152], titleSize: 56, titleColor: '#252E52',
    box: [172, 318, 1194, 418], nameBox: [970, 802, 400, 112], seal: [1434, 858, 56] },
  playground: { name: '운동장', bg: 'assets/card/bg_playground.jpg', titleBox: [410, 100, 712, 140], titleSize: 54, titleColor: '#2F5A1F',
    box: [146, 308, 1240, 436], nameBox: [974, 800, 386, 112], seal: [1428, 856, 56] }
};
/* 나의 수호 친구 = 수호냥 5동작 (저장 값은 예전 이름 pinky_01~05 그대로) */
const BUDDIES = { pinky_01: '인사', pinky_02: '하트', pinky_03: '안내', pinky_04: '엄지', pinky_05: '만세' };
const BUDDY_IMG = { pinky_01: 'staff_hello', pinky_02: 'staff_heart', pinky_03: 'staff_guide', pinky_04: 'staff_thumb', pinky_05: 'staff_cheer' };
const buddySrc = k => `assets/char/${BUDDY_IMG[k] || k}_t.png`;

/* 수칙 글씨 단계: 개수에 따라 시작하고, 넘치면 여백 → 줄 간격 → 글씨 순서로 줄임 */
const STEPS = [
  { fs: 40, lh: 1.42, gap: 26 }, { fs: 34, lh: 1.40, gap: 18 }, { fs: 34, lh: 1.40, gap: 10 },
  { fs: 34, lh: 1.28, gap: 8 }, { fs: 31, lh: 1.28, gap: 8 }, { fs: 28, lh: 1.26, gap: 6 },
  { fs: 26, lh: 1.24, gap: 5 }, { fs: 24, lh: 1.22, gap: 4 }, { fs: 22, lh: 1.2, gap: 3 } // 마지막 = 최소 글씨
];
const startStep = n => (n <= 3 ? 1 : n <= 5 ? 2 : 3);

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

/* 한글은 단어(띄어쓰기) 단위로 줄바꿈, 한 단어가 너무 길면 글자 단위 */
function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  const push = w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width <= maxW) { line = test; return; }
    if (line) lines.push(line);
    if (ctx.measureText(w).width <= maxW) { line = w; return; }
    let part = '';
    for (const ch of w) { if (ctx.measureText(part + ch).width > maxW) { lines.push(part); part = ch; } else part += ch; }
    line = part;
  };
  words.forEach(push); if (line) lines.push(line);
  return lines;
}

function drawPaw(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x + s * .5, y + s * .66, s * .25, s * .21, 0, 0, Math.PI * 2); ctx.fill();
  [[.2, .37], [.4, .2], [.6, .2], [.8, .37]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + s * a, y + s * b, s * .11, 0, Math.PI * 2); ctx.fill(); });
}

/* 수칙 영역 배치 계산 → { fit, step, items } */
function layoutRules(ctx, rules, box) {
  const [, , w, h] = box;
  for (let k = startStep(rules.length); k < STEPS.length; k++) {
    const s = STEPS[k]; ctx.font = `800 ${s.fs}px ${FONT}`;
    const textW = w - s.fs * 1.4 - 16;
    const items = rules.map(r => {
      const mineW = r.mine ? ctx.measureText('나만의 ').width * .7 + 14 : 0;
      const lines = wrapLines(ctx, r.text, textW - mineW);
      return { r, lines, h: lines.length * s.fs * s.lh + s.gap * 2, mineW };
    });
    const total = items.reduce((a, b) => a + b.h, 0);
    if (total <= h) return { fit: true, step: k, s, items, total };
    if (k === STEPS.length - 1) return { fit: false, step: k, s, items, total };
  }
}

/* 작성일 '2026년 11월 8일' */
const cardDate = iso => { const [y, m, d] = String(iso).split('-').map(Number); return `${y}년 ${m}월 ${d}일`; };

/* 약속 카드 그리기 — 반환값 seal: 서명 동그라미 위치(카드 좌표), 미리보기에서 누르면 서명 */
async function drawPromiseCard(canvas, { design = 'certificate', buddy = 'pinky_01', name = '', date = '', rules = [], sigImg = null, preview = false }) {
  const D = DESIGNS[design] || DESIGNS.certificate;
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const [bg, ch] = await Promise.all([loadImg(D.bg), loadImg(buddySrc(buddy))]);
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.drawImage(bg, 0, 0, CARD_W, CARD_H);

  /* 제목 */
  const [tx, ty, tw, th] = D.titleBox;
  ctx.fillStyle = D.titleColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `400 ${D.titleSize}px ${HEAD}`; ctx.fillText(CARD_TITLE, tx + tw / 2, ty + th / 2 + 2, tw - 30);

  /* 큰 칸 나누기: 왼쪽 수호 친구 · 오른쪽 수칙 */
  const [bx, by, bw, bh] = D.box, leftW = Math.round(bw * 0.25);
  const sc = Math.min((leftW - 40) / ch.width, (bh * 0.72) / ch.height);   // 수호 친구 크기 (사용자 요청: 조금 작게)
  const dw = ch.width * sc, dh = ch.height * sc;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ch, bx + (leftW - dw) / 2, by + (bh - dh) / 2, dw, dh); ctx.restore();
  ctx.strokeStyle = 'rgba(30,42,90,.22)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(bx + leftW + 6, by + 18); ctx.lineTo(bx + leftW + 6, by + bh - 18); ctx.stroke(); ctx.setLineDash([]);

  /* 아래 줄: 작성일 · 이름 · 서명 */
  const [nx, ny, nw, nh] = D.nameBox, midY = ny + nh / 2;
  ctx.textBaseline = 'middle';
  ctx.font = `800 30px ${FONT}`; ctx.fillStyle = '#2a1f1a'; ctx.textAlign = 'right';
  ctx.fillText(cardDate(date || DateK.today()), nx - 26, midY + 1);
  ctx.font = `800 20px ${FONT}`; const tagW = ctx.measureText('이름').width + 24;
  let nf = 34; ctx.font = `900 ${nf}px ${FONT}`;
  while (nf > 20 && tagW + 10 + ctx.measureText(name).width > nw - 24) { nf -= 2; ctx.font = `900 ${nf}px ${FONT}`; }
  const nmW = ctx.measureText(name).width, startX = nx + (nw - (tagW + 10 + nmW)) / 2;
  ctx.fillStyle = '#E0663F'; rr(ctx, startX, midY - 16, tagW, 32, 16); ctx.fill();
  ctx.font = `800 20px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('이름', startX + 12, midY + 1);
  ctx.font = `900 ${nf}px ${FONT}`; ctx.fillStyle = '#2a1f1a'; ctx.fillText(name, startX + tagW + 10, midY + 1);

  const [sx, sy, sr] = D.seal;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  if (sigImg) {
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#E0663F'; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr - 6, 0, Math.PI * 2); ctx.clip();
    const s2 = Math.min((sr * 1.7) / sigImg.width, (sr * 1.2) / sigImg.height);
    ctx.drawImage(sigImg, sx - sigImg.width * s2 / 2, sy - sigImg.height * s2 / 2, sigImg.width * s2, sigImg.height * s2); ctx.restore();
  } else {
    ctx.fillStyle = '#F07A5E'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#C9573A'; ctx.stroke();
    if (preview) {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.font = `900 24px ${FONT}`; ctx.fillText('서명', sx, sy - 11);
      ctx.font = `800 17px ${FONT}`; ctx.fillText('(선택)', sx, sy + 15);
    } else drawPaw(ctx, sx - sr * .45, sy - sr * .48, sr * .9, 'rgba(255,255,255,.9)');
  }
  ctx.textBaseline = 'alphabetic';

  /* 수칙 */
  const box = [bx + leftW + 30, by + 14, bw - leftW - 50, bh - 28]; const L = layoutRules(ctx, rules, box);
  let y = box[1] + (box[3] - L.total) / 2;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  L.items.forEach((it, i) => {
    const s = L.s, x = box[0] + 4; let ly = y + s.gap;
    ctx.fillStyle = '#3E5099'; ctx.fillRect(x + s.fs * .22, ly + s.fs * .36, s.fs * .42, s.fs * .42);
    const textX = x + s.fs * 1.4;
    it.lines.forEach((line, j) => {
      let lx = textX;
      if (j === 0 && it.r.mine) {
        ctx.font = `800 ${s.fs * .62}px ${FONT}`; const mw2 = ctx.measureText('나만의').width + 14;
        ctx.fillStyle = '#fff1c9'; rr(ctx, lx, ly + s.fs * .15, mw2, s.fs * .9, 8); ctx.fill();
        ctx.fillStyle = '#9a6a00'; ctx.fillText('나만의', lx + 7, ly + s.fs * .82); lx += mw2 + 8;
      }
      ctx.font = `800 ${s.fs}px ${FONT}`; ctx.fillStyle = '#2a1f1a';
      ctx.fillText(line, lx, ly + s.fs * .95); ly += s.fs * s.lh;
    });
    y += it.h;
    if (i < L.items.length - 1) { ctx.strokeStyle = 'rgba(30,42,90,.2)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(box[0], y); ctx.lineTo(box[0] + box[2], y); ctx.stroke(); ctx.setLineDash([]); }
  });

  ctx.textBaseline = 'alphabetic';
  return { fit: L.fit, step: L.step, seal: D.seal };
}

/* 챌린지 메달 이미지 (S48-2) — 이름은 넣지 않아요. color: pink | green | blue */
const MEDAL_COLORS = {
  blue:  { a: '#BFE0FA', b: '#3E5099', c: '#E9F2FC', label: '하늘' },
  green: { a: '#9ED39A', b: '#2F7A4F', c: '#E5F3E2', label: '초록' },
  coral: { a: '#EE8A6E', b: '#C9573A', c: '#FBE3D9', label: '코랄' }
};
async function drawMedal(canvas, { color = 'coral', stars = 0, cardNo = '' }) {
  /* 메달 그림: assets/medal/medal_{color}.png (수호냥 리본 메달, 아래 띠는 비어 있음)
     코드가 얹는 것: 아래 띠 "5일 챌린지 완료!" 글자만 */
  const W = 900, H = 860; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const M = MEDAL_COLORS[color] ? color : 'coral', img = await loadImg(`assets/medal/medal_${M}.png`);
  const k = Math.min((W - 120) / img.width, 820 / img.height), mw = img.width * k, mh = img.height * k;
  const ox = (W - mw) / 2, oy = 10, X = f => ox + mw * f, Y = f => oy + mh * f;
  ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, ox, oy, mw, mh); ctx.imageSmoothingEnabled = true;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = `400 ${Math.round(mw * 0.075)}px ${HEAD}`;
  ctx.lineWidth = mw * 0.016; ctx.strokeStyle = '#252E52'; ctx.strokeText('5일 챌린지 완료!', X(0.5), Y(0.905), mw * 0.56);
  ctx.fillStyle = '#fff'; ctx.fillText('5일 챌린지 완료!', X(0.5), Y(0.905), mw * 0.56);
  /* 별·고유번호 칸은 넣지 않음 — 메달 그림만 (팀 점검 11/8) */
  ctx.textBaseline = 'alphabetic';
}

/* (예전) 완료 이미지 — 지금은 쓰지 않음. 메달은 drawMedal 사용 */
async function drawCompleteImage(canvas, { days, states, stars, cardNo }) {
  const W = 1600, H = 1000; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const cat = await loadImg(buddySrc('pinky_05'));
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d9eefc'); g.addColorStop(.6, '#fff3f8'); g.addColorStop(1, '#FDEFEB');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#F2C7BA'; ctx.lineWidth = 6; rr(ctx, 30, 30, W - 60, H - 60, 40); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tg = ctx.createLinearGradient(0, 70, 0, 170); tg.addColorStop(0, '#F0714B'); tg.addColorStop(1, '#C9573A');
  ctx.fillStyle = tg; rr(ctx, W / 2 - 330, 70, 660, 100, 50); ctx.fill();
  ctx.font = `900 56px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('5일 챌린지 완료!', W / 2, 122);
  ctx.font = `800 30px ${FONT}`; ctx.fillStyle = '#35437A'; ctx.fillText('5일 동안 나의 예방 수칙을 실천했어요!', W / 2, 210);
  const cs = Math.min(300 / cat.width, 360 / cat.height); ctx.drawImage(cat, 70, 260, cat.width * cs, cat.height * cs);
  const cw = 170, gap = 18, sx = 400;
  days.forEach((d, i) => {
    const x = sx + i * (cw + gap), y = 270, st = states[i];
    ctx.fillStyle = st === 'star' ? '#f2fbea' : '#fff'; ctx.strokeStyle = st === 'star' ? '#bfe6a6' : '#F0E7E4'; ctx.lineWidth = 4;
    rr(ctx, x, y, cw, 200, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a5055'; ctx.font = `800 28px ${FONT}`; ctx.fillText(DateK.md(d), x + cw / 2, y + 40);
    ctx.font = `700 24px ${FONT}`; ctx.fillText(DateK.wd(d) + '요일', x + cw / 2, y + 76);
    ctx.font = `64px ${FONT}`;
    if (st === 'star') ctx.fillText('⭐', x + cw / 2, y + 145);
    else if (st === 'nostar') { ctx.globalAlpha = .35; ctx.fillText('⭐', x + cw / 2, y + 145); ctx.globalAlpha = 1; }
    else { ctx.font = `900 50px ${FONT}`; ctx.fillStyle = '#b8adb2'; ctx.fillText('–', x + cw / 2, y + 145); }
  });
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#FCE1D9'; ctx.lineWidth = 4; rr(ctx, 400, 510, 430, 150, 24); ctx.fill(); ctx.stroke();
  ctx.font = `800 28px ${FONT}`; ctx.fillStyle = '#C9573A'; ctx.fillText('⭐ 별 받은 날', 615, 550);
  ctx.font = `900 70px ${FONT}`; ctx.fillStyle = '#E0663F'; ctx.fillText(`${stars}`, 580, 612);
  ctx.font = `800 34px ${FONT}`; ctx.fillStyle = '#8a7f84'; ctx.fillText('/ 5일', 670, 618);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#FCE1D9'; rr(ctx, 860, 510, 430, 150, 24); ctx.fill(); ctx.stroke();
  ctx.font = `800 26px ${FONT}`; ctx.fillStyle = '#C9573A'; ctx.fillText('나의 카드 고유번호', 1075, 550);
  ctx.font = `900 40px ${FONT}`; ctx.fillStyle = '#2a1f1a'; ctx.fillText(cardNo || '', 1075, 612);
  ctx.save(); ctx.translate(W / 2, 760); ctx.rotate(-0.02);
  const yg = ctx.createLinearGradient(0, -60, 0, 60); yg.addColorStop(0, '#fff27a'); yg.addColorStop(1, '#ffd21f');
  ctx.fillStyle = yg; ctx.strokeStyle = '#f0a800'; ctx.lineWidth = 6; rr(ctx, -470, -60, 940, 120, 26); ctx.fill(); ctx.stroke();
  ctx.font = `900 58px ${FONT}`; ctx.fillStyle = '#E0663F'; ctx.fillText('축하합니다! 5일 챌린지 완료!', 0, 4); ctx.restore();
  ctx.font = `900 34px ${FONT}`; ctx.fillStyle = '#35437A';
  ctx.fillText(stars === 5 ? '별 5개! 완벽해요!' : stars >= 3 ? `별 ${stars}개! 잘했어요!` : `별 ${stars}개 · 다음에 다시 도전해요!`, W / 2, 870);
  ctx.font = `700 22px ${FONT}`; ctx.fillStyle = '#8a7f84'; ctx.fillText('건강한 오늘, 알레르기 없는 내일!', W / 2, 925);
}
