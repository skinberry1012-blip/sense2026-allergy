/* =========================================================
   lab-items.js — 냥박사의 알레르기 연구소 (S00~S38A) 데이터
   ※ 화면은 1600×900 판 위에 배경·캐릭터·물건·글자를 따로 얹어 그려요(그림 안에 글자 없음).
   ※ 좌표는 1600×900 판 기준 픽셀 : [왼쪽, 위, 너비, 높이]
   ※ 글자 표시 규칙: [ ] = 파란 굵은 글씨, {{ }} = 코랄 굵은 글씨, <br> = 줄바꿈
   ※ 문구는 팀 시안 그대로 (샴푸 → 로션만 바꿈)
   ========================================================= */
'use strict';

window.LAB = {
  /* 그림 경로 */
  /* 장소 앞에 얹는 꾸밈 그림 (누를 수 없음): [그림, 왼쪽, 위, 너비, 높이] */
  deco: { ground: [['assets/bg/deco_bush.png', 1206, 736, 394, 176]], home: [['assets/bg/deco_frame.png', 640, 167, 320, 240]] },   // 집: 벽 보드판을 액자로 (팀 점검 11/10)

  bg: { entrance: 'assets/bg/bg_entrance.png', lab: 'assets/bg/bg_lab.png', home: 'assets/bg/bg_home.png', school: 'assets/bg/bg_cafeteria.png', ground: 'assets/bg/bg_playground.png' },

  /* S01~S04 이야기 */
  story: {
    S01: { pose: 'nyang_hello',   line: '안녕! 나는 알레르기 [연구원] 냥박사야.<br>오늘 나와 함께 특별한 [알레르기 연구]를<br>시작해 볼래?', go: 'S02' },
    S02: { pose: 'nyang_symptom', line: '어? 잠깐만!<br>갑자기 [눈이 가렵고],<br>피부에 [두드러기]까지 생겼어!', go: 'S03', syms: ['eye', 'hives'] },
    S03: { pose: 'nyang_worry',  line: '이상하다…<br>내 몸에 왜 이런 반응이<br>나타나는 걸까?', go: 'S04' },
    S04: { pose: 'nyang_explain', line: '혹시 내가 다녀온 장소에 [단서]가<br>있을지도 몰라!<br>나와 함께 원인을 찾아보자!', go: 'S05', label: '연구 활동 시작하기 ›' }
  },

  /* 장소 */
  places: {
    home: {
      scene: 'S06', name: '집', no: 1, done: 'S14A',
      points: [
        { item: 'mite',   r: [100, 536, 226, 170], go: 'S07', mite: true },   // 침대 이불 (점·꾸물거리는 선 효과) — '찾은 원인' 칸과 띄움 (11/9)
        { item: 'pet',    r: [640, 562, 150, 150], go: 'S09' },              // 바닥 — '찾은 원인' 칸과 띄움 (11/9)
        { item: 'drug',   r: [1392, 168, 120, 120], go: 'S11' },             // 책상 위 선반 상자 (팀 점검 11/8)
        { item: 'lotion', r: [1268, 372, 104, 104], go: 'S13' }              // 책상 위 필통과 연필꽂이 사이 (11/8)
      ]
    },
    school: {
      scene: 'S15', name: '급식실', no: 2, done: 'S23A',
      /* 게시판 '오늘의 급식' (11/10): 숫자는 학교 식단표처럼 알레르기 유발 식품 번호 */
      menu: { r: [600, 190, 432, 236], items: [['새우볶음밥', '1.5.9'], ['달걀국', '1'], ['김치전', '6.9'], ['땅콩조림', '4.5'], ['배추김치', '9'], ['우유', '2']],
              note: '① 달걀 ② 우유 ④ 땅콩 ⑤ 대두 ⑥ 밀 ⑨ 새우' },
      points: [
        { item: 'peanut', r: [182, 474, 112, 112], go: 'S16' },   // 왼쪽 식판 가운데 (11/10)
        { item: 'flour',  r: [1372, 296, 116, 116], go: 'S20' },  // 오른쪽 선반 아래, 정수기 옆 (11/10)
        { item: 'shrimp', r: [1238, 478, 112, 112], go: 'S22' },  // 오른쪽 식판
        { item: 'egg',    r: [1334, 474, 116, 116], go: 'S18' }   // 오른쪽 식판
      ]
    },
    ground: {
      scene: 'S24', name: '운동장', no: 3, done: 'S33',
      points: [
        { item: 'pollen', r: [1410, 690, 116, 116], go: 'S25' },  // 오른쪽 아래 풀 덤불 위 꽃 한 송이 (팀 점검 11/8) — 화면 끝에서 띄움 (11/10)
        { item: 'sun',    r: [990, 58, 112, 112], go: 'S27' },   // 오른쪽 위 하늘
        { item: 'dust',   r: [236, 578, 130, 130], go: 'S29' },   // 모래밭 — '찾은 원인' 칸과 띄움 (11/9)
        { item: 'insect', r: [560, 470, 110, 110], go: 'S31' }    // 하늘색 미끄럼틀 옆
      ]
    }
  },

  /* 물건 이름 */
  items: {
    mite: '집먼지진드기', pet: '반려동물', drug: '약물', lotion: '로션',
    peanut: '땅콩', egg: '달걀', flour: '밀가루', shrimp: '새우',
    pollen: '꽃가루', sun: '햇빛', dust: '먼지', insect: '곤충'
  },

  /* 관찰 화면 (S07…): 냥박사 말 */
  observe: {
    S07: { place: 'home',   item: 'mite',   next: 'S08', line: '[진드기]에 노출된다면?<br>진드기를 눌러 보세요.' },
    S09: { place: 'home',   item: 'pet',    next: 'S10', line: '동물의 털에는?<br>[강아지의 털]을 눌러 보세요.' },
    S11: { place: 'home',   item: 'drug',   next: 'S12', line: '약물을 눌러 보세요.<br>[약물도 알레르기]를 일으킬 수 있어요.' },
    S13: { place: 'home',   item: 'lotion', next: 'S14', line: '로션을 눌러 보세요.<br>[로션도 알레르기]를 일으킬 수 있어요.' },
    S16: { place: 'school', item: 'peanut', next: 'S17', line: '땅콩을 눌러 보세요.' },
    S18: { place: 'school', item: 'egg',    next: 'S19', line: '달걀을 눌러 보세요.' },
    S20: { place: 'school', item: 'flour',  next: 'S21', line: '밀가루를 눌러 보세요.' },
    S22: { place: 'school', item: 'shrimp', next: 'S23', line: '새우를 눌러 보세요.' },
    S25: { place: 'ground', item: 'pollen', next: 'S26', line: '꽃가루를 눌러 보세요.' },
    S27: { place: 'ground', item: 'sun',    next: 'S28', line: '햇빛을 눌러 보세요.' },
    S29: { place: 'ground', item: 'dust',   next: 'S30', line: '먼지를 눌러 보세요.' },
    S31: { place: 'ground', item: 'insect', next: 'S32', line: '곤충을 눌러 보세요.' }
  },

  /* 증상과 예방법 = 스캔 결과 창 (S08…) : syms = [증상 그림, 이름] 2개 */
  info: {
    S08: { place: 'home',   item: 'mite',   syms: [['eye', '눈 충혈·가려움'], ['nose', '콧물·재채기']], tips: ['침구는 2주마다 60℃ 이상의 뜨거운 물로 세탁해요.', '세탁한 침구는 햇볕에 널어 말려요.', '정기적으로 청소하고 환기해요.'] },
    S10: { place: 'home',   item: 'pet',    syms: [['eye', '눈 충혈·가려움'], ['cough', '기침']], tips: ['반려동물과 접촉하지 않아요.', '정기적으로 청소하고 환기해요.', '반려동물과 생활 공간(특히 침실)을 나눠요.'] },
    S12: { place: 'home',   item: 'drug',   syms: [['hives', '두드러기'], ['breath', '호흡곤란']], tips: ['알레르기 유발 물질을 파악하고 피해요.', '원인을 확인하고 철저히 피하는 것이 가장 중요해요.', '다른 사람의 약을 먹지 않아요.'] },
    S14: { place: 'home',   item: 'lotion', syms: [['eye', '눈 충혈·가려움'], ['hives', '두드러기·피부 가려움']], tips: ['로션을 쓰기 전에 성분을 꼼꼼히 확인해요.', '알레르기 유발 물질을 파악하고 피해요.'] },
    S17: { place: 'school', item: 'peanut', syms: [['hives', '두드러기·피부 가려움'], ['stomach', '복통·구토']], tips: ['알레르기 유발 물질을 파악하고 피해요.', '필요할 때 피해야 할 음식과 안전한 대체 식품을 확인해요.', '땅콩 성분이 들어간 모든 식품을 피해요.'] },
    S19: { place: 'school', item: 'egg',    syms: [['hives', '두드러기'], ['breath', '호흡곤란']], tips: ['달걀 성분이 들어간 모든 식품을 피해요.', '식품 포장지의 성분표를 꼼꼼히 확인해요.', '필요할 때 피해야 할 음식과 안전한 대체 식품을 확인해요.'] },
    S21: { place: 'school', item: 'flour',  syms: [['hives', '피부 가려움'], ['stomach', '복통']], tips: ['밀가루 성분이 들어간 모든 식품을 피해요.', '식품 포장지의 성분표를 꼼꼼히 확인해요.', '필요할 때 피해야 할 음식과 안전한 대체 식품을 확인해요.'] },
    S23: { place: 'school', item: 'shrimp', syms: [['hives', '두드러기·피부 가려움'], ['breath', '호흡곤란']], tips: ['알레르기 유발 물질을 파악하고 피해요.', '식품 포장지의 성분표를 꼼꼼히 확인해요.', '필요할 때 피해야 할 음식과 안전한 대체 식품을 확인해요.'] },
    S26: { place: 'ground', item: 'pollen', syms: [['nose', '콧물·재채기'], ['eye', '눈 충혈·가려움']], tips: ['꽃이 많은 곳에서는 마스크를 써요.', '외출 후 손과 얼굴을 씻어요.', '꽃가루가 많은 날은 외출을 줄여요.'] },
    S28: { place: 'ground', item: 'sun',    syms: [['rash', '피부가 붉어짐'], ['hives', '피부 가려움']], tips: ['햇빛이 강한 시간에는 모자를 써요.', '자외선 차단제를 사용해요.', '오랜 시간 햇빛에 노출되는 것을 피해요.'] },
    S30: { place: 'ground', item: 'dust',   syms: [['cough', '기침'], ['breath', '호흡곤란']], tips: ['먼지가 많은 날에는 마스크를 써요.', '실내에 들어가기 전에 옷을 털어요.', '먼지가 많은 날은 창문을 닫아요.'] },
    S32: { place: 'ground', item: 'insect', syms: [['swelling', '피부 부기·가려움'], ['hives', '두드러기']], tips: ['곤충이 많은 곳에서는 강한 향수를 사용하지 않아요.', '쏘였을 때는 바로 어른에게 알려요.'] }
  },

  /* 장소 완료 팝업 */
  done: {
    S14A: { place: 'home',   next: 'S15', label: '다음 장소로 ›' },
    S23A: { place: 'school', next: 'S24', label: '다음 장소로 ›' },
    S33:  { place: 'ground', next: 'S36-1', label: '연구 결과 보기 ›' }
  },

  /* 증상 카드 (S36-3) */
  cards: {
    list: [
      { id: 'eye', label: '눈 충혈·가려움' }, { id: 'hives', label: '두드러기·피부 가려움' },
      { id: 'nose', label: '콧물·재채기' }, { id: 'cough', label: '기침' },
      { id: 'stomach', label: '복통·구토' }, { id: 'breath', label: '호흡곤란' },
      { id: 'dizzy', label: '어지러움' }
    ],
    lines: {
      0: '그림을 보고 어떤 증상인지 {{말해 본 뒤}}<br>카드를 눌러 확인해 보세요!',
      1: '카드를 {{누르면}}<br>증상 이름을 확인할 수 있어요!',
      2: '모든 증상 카드를 눌러 보세요!',
      7: '모든 증상을 확인했어요!<br>이제 이런 증상이 나타날 때<br>{{어떻게 해야 하는지}} 알아볼까요?',
      lock: '카드 7개를 모두 확인하면 열려요!'
    }
  },

  /* 대처 방법 (S37 가벼운 · S38 위급한) — 수호냥은 나오지 않음 */
  cope: {
    S37: { type: 'light',  title: '가벼운 증상 대처법', other: 'S38', otherLabel: '위급한 증상 대처 방법 ›',
           steps: [['avoid', '원인물질 피하기'], ['tell', '어른에게 알리기'], ['clinic', '병원에서 진료받기']] },
    S38: { type: 'severe', title: '위급한 반응 대처법', other: 'S37', otherLabel: '가벼운 증상 대처 방법 ›',
           steps: [['call119', '119 신고하기'], ['epipen', '에피네프린 자가주사 돕기'], ['ambulance', '병원으로 이송하기']] }
  },

  /* 기억 체크 (S38A) */
  quiz: {
    pieces: [
      { id: 'severe-0', img: 'call119',   label: '119 신고하기' },
      { id: 'light-2',  img: 'clinic',    label: '병원에서 진료받기' },
      { id: 'light-0',  img: 'avoid',     label: '원인물질 피하기' },
      { id: 'severe-2', img: 'ambulance', label: '병원으로 이송하기' },
      { id: 'light-1',  img: 'tell',      label: '어른에게 알리기' },
      { id: 'severe-1', img: 'epipen',    label: '에피네프린 자가주사 돕기' }
    ],
    doneText: '모두 기억했어요! 최고예요!'
  }
};
