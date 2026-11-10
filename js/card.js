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
const DESIGNS = {   /* 회의 결정 (11/9): 인증서 한 장만 — 아래 이름 칸·오른쪽 아래 장식 없는 깨끗한 배경 */
  certificate: { name: '인증서', bg: 'assets/card/bg_certificate_clean.jpg', titleBox: [410, 116, 720, 128], box: [206, 312, 1118, 424] }
};
/* 나의 수호 친구 = 수호냥 5동작 (저장 값은 예전 이름 pinky_01~05 그대로) */
const BUDDIES = { pinky_01: '인사', pinky_02: '하트', pinky_03: '안내', pinky_04: '엄지' };   // 카드 수호 친구 4가지 (11/9, 만세는 메달에서만)
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

/* 약속 카드 그리기 (새 디자인 · 회의 결정 11/9: 인증서 한 장)
   - 제목: 원래 칸 + 주아 / 칸 안 맨 위 "나 ○○○은 이렇게 약속해요"
   - 약속: 장소 배지(집에서·학교에서·밖에서)를 묶음 첫 줄에 맞추고, 옅은 띠 + 번호
   - 아래: 날짜 · 다짐한 사람(눌러서 서명, 선택) · 확인한 사람 냥박사 + 굵은 테두리 발바닥 도장
   - 수호냥은 칸 밖 오른쪽 아래에 기대 서고 "함께 지켜 줄게!" 말풍선
   반환값: { fit, sign: [x, y, w, h] } — sign은 서명 줄 자리(카드 좌표), 미리보기에서 누르면 서명 */
const CARD = { accent: '#3E6B2E', ink: '#22361A', soft: '#E3ECD5' };
const GOWUN = '"Gowun Dodum",' + FONT;
const SEAL_INK = '#C9573A', HILITE = 'rgba(245,200,66,.55)';
const RULE_STEPS = [{ fs: 44, lh: 1.26, gap: 12 }, { fs: 38, lh: 1.28, gap: 11 }, { fs: 36, lh: 1.26, gap: 10 }, { fs: 34, lh: 1.24, gap: 8 }, { fs: 32, lh: 1.2, gap: 7 }, { fs: 30, lh: 1.2, gap: 6 }, { fs: 28, lh: 1.18, gap: 5 }, { fs: 26, lh: 1.18, gap: 4 }, { fs: 24, lh: 1.16, gap: 3 }];
const PLACE_TAG = { home: { name: '집에서', fill: '#F7D667', soft: 'rgba(247,214,103,.18)' }, school: { name: '학교에서', fill: '#A9D3F5', soft: 'rgba(169,211,245,.24)' }, outside: { name: '밖에서', fill: '#B5DFA6', soft: 'rgba(181,223,166,.26)' }, mine: { name: '나만의', fill: '#D9C8F5', soft: 'rgba(217,200,245,.26)' } };
const hasJong = w => { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };

/* 도장: 따로 그려 투명도만 낮춰 얹어요 (배경이 비치고 잉크 색은 그대로) */
function drawSeal(ctx, cx, cy, r, color) {
  const S = Math.ceil(r * 2 + 30), c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2;
  g.translate(m, m); g.rotate(-0.16);
  g.strokeStyle = color; g.fillStyle = color; g.lineJoin = 'round';
  g.lineWidth = r * 0.17; g.beginPath(); g.arc(0, 0, r * 0.9, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.05; g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.stroke();
  const word = [...'약속 확인'], fs = r * 0.3, span = 1.5;
  g.font = `400 ${fs}px ${HEAD}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  word.forEach((ch, i) => { g.save(); g.rotate(-span / 2 + span * i / (word.length - 1)); g.translate(0, -r * 0.5);
    g.lineWidth = fs * 0.12; g.strokeText(ch, 0, 0); g.fillText(ch, 0, 0); g.restore(); });
  drawPaw(g, -r * 0.31, -r * 0.12, r * 0.62, color);
  /* 잉크 결: 군데군데 빠진 자국 (늘 같은 모양) */
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) { g.globalAlpha = 0.25 + rnd() * 0.5; g.beginPath(); g.arc(rnd() * S, rnd() * S, 0.6 + rnd() * 2.2, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 5; i++) { g.globalAlpha = 0.18; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 6 + rnd() * 10, 3 + rnd() * 5, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(c, cx - m, cy - m); ctx.restore();
}

async function drawPromiseCard(canvas, { buddy = 'pinky_01', name = '', date = '', rules = [], sigImg = null, preview = false }) {
  const D = DESIGNS.certificate, A = CARD;
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const [bg, ch] = await Promise.all([loadImg(D.bg), loadImg(buddySrc(buddy))]);
  ctx.clearRect(0, 0, CARD_W, CARD_H); ctx.drawImage(bg, 0, 0, CARD_W, CARD_H);

  /* 제목 */
  const [tx, ty, tw, th] = D.titleBox;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = A.accent;
  ctx.font = `400 58px ${HEAD}`; ctx.fillText(CARD_TITLE, tx + tw / 2, ty + th / 2 + 3, tw - 40);

  const [bx, by, bw, bh] = D.box;
  /* 수호냥 자리: 칸 밖 오른쪽 아래 */
  const bH = 316, bW = ch.width * bH / ch.height, footY = 948, bLeft = 1432 - bW;
  const ruleRight = Math.min(bx + bw - 40, bLeft - 18);

  /* 칸 안 맨 위: 나 ○○○은 이렇게 약속해요 */
  const nm = name || '○○○', a = '나 ', c = (hasJong(nm) ? '은' : '는') + ' 이렇게 약속해요';
  ctx.font = `400 42px ${HEAD}`;
  const wa = ctx.measureText(a).width, wb = ctx.measureText(nm).width, wc = ctx.measureText(c).width;
  const lx0 = bx + bw / 2 - (wa + wb + wc) / 2;
  const drawLead = ly0 => {
    ctx.font = `400 42px ${HEAD}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.strokeStyle = HILITE; ctx.lineCap = 'round'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(lx0 + wa + 8, ly0 + 15); ctx.lineTo(lx0 + wa + wb - 2, ly0 + 11); ctx.stroke(); ctx.restore();
    ctx.fillStyle = A.ink; ctx.fillText(a, lx0, ly0); ctx.fillStyle = A.accent; ctx.fillText(nm, lx0 + wa, ly0); ctx.fillStyle = A.ink; ctx.fillText(c, lx0 + wa + wb, ly0);
  };

  /* 약속 배치: 개수에 맞는 글씨 크기에서 시작, 수호냥 머리 높이에 걸리는 약속만 좁게 */
  const rx = bx + 48, rw = bx + bw - 48 - rx, rwCat = ruleRight - rx, catTop = footY - bH, rh = bh - 114, n = rules.length;
  const colOf = s => Math.max(s.fs * 3.3, 140);
  let L, fallback = null;
  for (let k = n <= 3 ? 0 : n <= 5 ? 2 : 3; k < RULE_STEPS.length; k++) {
    const s = RULE_STEPS[k], mk = colOf(s) + s.fs * 1.5;
    const lay = (r, width) => {
      ctx.font = `400 ${s.fs * .62}px ${HEAD}`; const tagW = r.mine ? ctx.measureText('나만의').width + 18 : 0;
      ctx.font = `400 ${s.fs}px ${GOWUN}`;
      const maxW = width - mk - tagW; let lines = wrapLines(ctx, r.text, maxW);
      if (lines.length > 1) { for (let w = maxW - 10; w > maxW * 0.45; w -= 10) { const t = wrapLines(ctx, r.text, w); if (t.length > lines.length) break; lines = t; } }   // 줄 길이 고르게
      return { r, lines, tagW, h: lines.length * s.fs * s.lh + s.gap * 2 };
    };
    let narrow = rules.map(() => false), items, total;
    for (let pass = 0; pass < 4; pass++) {
      items = rules.map((r, i) => lay(r, narrow[i] ? rwCat : rw));
      total = items.reduce((p, q) => p + q.h, 0);
      let yy = by + Math.max(24, (bh - (44 + 26 + total)) / 2) + 44 + 26, changed = false;
      items.forEach((it, i) => { if (yy + it.h > catTop + 6 && !narrow[i]) { narrow[i] = true; changed = true; } yy += it.h; });
      if (!changed) break;
    }
    const cur = { s, items, total, mk };
    if (total <= rh) {
      if (!fallback) fallback = cur;
      if (!items.some((it, i) => it.lines.length > 1 && !narrow[i])) { L = cur; break; }
      if (s.fs <= 34) { L = fallback; break; }
    }
    L = cur;
  }
  if (L.total > rh && fallback) L = fallback;
  const fit = L.total <= rh + 40;

  /* 약속 문장 + 약속 묶음을 한 덩어리로 칸 안 위아래 가운데 */
  const LEAD = 44, GAP = 26, top = by + Math.max(24, (bh - (LEAD + GAP + L.total)) / 2);
  drawLead(top + LEAD / 2);
  let y = top + LEAD + GAP;
  /* 장소 배지 + 옅은 띠 */
  let gy = y;
  L.items.forEach((it, i) => {
    if (i === 0 || L.items[i - 1].r.place !== it.r.place) {
      let gh = 0; for (let j = i; j < L.items.length && L.items[j].r.place === it.r.place; j++) gh += L.items[j].h;
      const s = L.s, col = colOf(s), bandX = rx + col - 4, P = PLACE_TAG[it.r.place] || PLACE_TAG.home;
      ctx.fillStyle = P.soft; rr(ctx, bandX, gy + 3, rx + rw + 4 - bandX, gh - 6, 12); ctx.fill();
      const firstY = gy + s.gap + s.fs * .62, fz = Math.max(26, s.fs * .7), chW = col - 16, chH = fz * 1.5;
      ctx.fillStyle = P.fill; rr(ctx, rx, firstY - chH / 2, chW, chH, chH / 2); ctx.fill();
      ctx.fillStyle = A.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 ${fz}px ${HEAD}`;
      ctx.fillText(P.name, rx + chW / 2, firstY + 2);
    }
    gy += it.h;
  });
  /* 번호 + 약속 글씨 */
  L.items.forEach((it, i) => {
    const s = L.s, mx = rx + colOf(s) + 6 + s.fs * .55, my = y + s.gap + s.fs * .62;
    ctx.fillStyle = A.accent; ctx.beginPath(); ctx.arc(mx, my, s.fs * .5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 ${s.fs * .64}px ${HEAD}`; ctx.fillText(String(i + 1), mx, my + 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    let yy = y + s.gap;
    it.lines.forEach((line, j) => {
      let lx = rx + L.mk;
      if (j === 0 && it.r.mine) {
        ctx.font = `400 ${s.fs * .62}px ${HEAD}`; rr(ctx, lx, yy + s.fs * .2, it.tagW - 8, s.fs * .86, 6); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = A.accent; ctx.stroke();
        ctx.fillStyle = A.ink; ctx.fillText('나만의', lx + 5, yy + s.fs * .84); lx += it.tagW;
      }
      ctx.font = `400 ${s.fs}px ${GOWUN}`; ctx.fillStyle = A.ink; ctx.fillText(line, lx, yy + s.fs * .95); yy += s.fs * s.lh;
    });
    y += it.h;
    if (i < L.items.length - 1 && L.items[i + 1].r.place === it.r.place) { ctx.fillStyle = 'rgba(30,42,90,.08)'; ctx.fillRect(rx + L.mk, y - 1, rw - L.mk, 2); }
  });

  /* 아래: 날짜 한 줄, 그 아래 다짐한 사람(서명) · 확인한 사람(냥박사 + 도장) */
  const midX = bx + bw / 2 - 24, dateY = 806, rowY = 878, lineW = 250, sr = 60;   // 두 줄 사이 좁히고 위로 (11/9)
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  ctx.font = `400 32px ${GOWUN}`; ctx.fillStyle = A.ink; ctx.fillText(cardDate(date || DateK.today()), midX, dateY);
  ctx.font = `400 26px ${HEAD}`; const wA = ctx.measureText('다짐한 사람').width, wB = ctx.measureText('확인한 사람').width;
  ctx.font = `400 32px ${HEAD}`; const wN = ctx.measureText('냥박사').width;
  let cx = midX - (wA + 12 + lineW + 56 + wB + 12 + wN + sr * 1.9) / 2; ctx.textAlign = 'left';
  ctx.font = `400 26px ${HEAD}`; ctx.fillStyle = A.accent; ctx.fillText('다짐한 사람', cx, rowY); cx += wA + 12;
  ctx.fillRect(cx, rowY + 8, lineW, 3);
  const sign = [cx - 10, rowY - 70, lineW + 20, 96];
  if (sigImg) {
    const s2 = Math.min((lineW - 10) / sigImg.width, 84 / sigImg.height), w2 = sigImg.width * s2, h2 = sigImg.height * s2;
    ctx.drawImage(sigImg, cx + (lineW - w2) / 2, rowY + 4 - h2, w2, h2);
  } else if (preview) {   /* 미리보기에만: 점선 상자 + ✍️ 안내 (저장·인쇄 카드에는 안 나와요) */
    ctx.save(); ctx.setLineDash([10, 7]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(62,107,46,.55)'; rr(ctx, cx - 2, rowY - 52, lineW + 10, 66, 12); ctx.stroke(); ctx.restore();
    ctx.font = `400 25px ${GOWUN}`; ctx.fillStyle = A.ink; ctx.globalAlpha = .7; ctx.fillText('✍️ 눌러서 서명해요', cx + 14, rowY - 10); ctx.globalAlpha = 1;
  }
  cx += lineW + 56;
  ctx.font = `400 26px ${HEAD}`; ctx.fillStyle = A.accent; ctx.fillText('확인한 사람', cx, rowY); cx += wB + 12;
  ctx.font = `400 32px ${HEAD}`; ctx.fillStyle = A.ink; ctx.fillText('냥박사', cx, rowY);
  drawSeal(ctx, cx + wN + sr * 1.12, rowY - 12, sr, SEAL_INK);   // 이름 끝 글자에 살짝만 걸치게 (11/9)

  /* 수호냥 (맨 마지막에 얹어 칸 모서리를 살짝 덮어요) + 말풍선 */
  ctx.fillStyle = 'rgba(30,42,90,.12)'; ctx.beginPath(); ctx.ellipse(bLeft + bW / 2, footY - 4, bW * .42, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(ch, bLeft, footY - bH, bW, bH); ctx.restore();
  const msg = '함께 지켜 줄게!'; ctx.font = `400 27px ${HEAD}`;
  const mw = ctx.measureText(msg).width, X0 = bLeft - (mw + 36) + 6, Y0 = by + bh + 14, X1 = X0 + mw + 36, Y1 = Y0 + 52, R = 16;
  ctx.save(); ctx.beginPath();
  ctx.moveTo(X0 + R, Y0); ctx.lineTo(X1 - R, Y0); ctx.quadraticCurveTo(X1, Y0, X1, Y0 + R);
  ctx.lineTo(X1, Y0 + 18); ctx.lineTo(X1 + 20, Y0 + 10); ctx.lineTo(X1, Y0 + 32);
  ctx.lineTo(X1, Y1 - R); ctx.quadraticCurveTo(X1, Y1, X1 - R, Y1);
  ctx.lineTo(X0 + R, Y1); ctx.quadraticCurveTo(X0, Y1, X0, Y1 - R);
  ctx.lineTo(X0, Y0 + R); ctx.quadraticCurveTo(X0, Y0, X0 + R, Y0); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = A.accent; ctx.stroke();
  ctx.fillStyle = A.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, X0 + (mw + 36) / 2, Y0 + 28);
  ctx.restore(); ctx.textBaseline = 'alphabetic';
  return { fit, sign };
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
