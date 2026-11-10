/* 예방 수칙 데이터 (S41~S43)
   - 문구를 고치려면 text만 바꾸세요. id는 기록과 연결되므로 바꾸지 마세요.
   - placeholder: 나만의 수칙 입력칸 예시 문구 */
window.RULES_DATA = {
  /* 11/10 확정 문구 (집 3 · 학교 3 · 밖 3): 장소마다 1가지씩 고르고, 나만의 약속은 네 번째 칸에서 직접 써요 */
  home: {
    name: '집에서', icon: '🏠',
    rules: [
      { id: 'home-1', text: '이불과 베개를 자주 빨고, 햇볕에 말려요.', type: 'daily' },
      { id: 'home-2', text: '외부 공기가 좋은 날에는 창문을 열어 환기해요.', type: 'daily' },
      { id: 'home-4', text: '방을 깨끗이 청소해요.', type: 'daily' }
    ]
  },
  school: {
    name: '학교에서', icon: '🏫',
    rules: [
      { id: 'school-1', text: '급식을 먹기 전에 식단표의 알레르기 표시를 확인해요.', type: 'daily' },
      { id: 'school-2', text: '알레르기가 있는 친구를 놀리지 않아요.', type: 'daily' },
      { id: 'school-3', text: '알레르기로 힘든 친구를 도와줘요.', type: 'daily' }
    ]
  },
  outside: {
    name: '밖에서', icon: '🌳',
    rules: [
      { id: 'outside-1', text: '꽃가루나 미세먼지가 많은 날에는 마스크를 써요.', type: 'daily' },
      { id: 'outside-2', text: '밖에서 놀고 들어오면 손을 깨끗이 씻어요.', type: 'daily' },
      { id: 'outside-3', text: '벌이나 벌집을 보면 건드리지 말고 피해요.', type: 'daily' }
    ]
  },
  mine: {
    name: '나만의 약속', icon: '⭐',
    placeholder: '예) 미세먼지가 심한 날에는 바깥 놀이를 하지 않아요.',
    tip: '내가 지킬 수 있는 약속을 짧게 적어 보아요.'
  }
};
