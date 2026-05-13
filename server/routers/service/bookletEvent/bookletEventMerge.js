/**
 * eventMain + eventInfo 병합 (bookleteventmain / bookleteventcreate 공통)
 * 프로그램 행은 eventProgramConcert / eventProgramWorship — getdataprogramspart / saveProgram 참고.
 */

function normalizeVisibleTabIdStr(id) {
  const s = String(id);
  if (s === 'cast') return 'profile';
  if (s === 'worship') return 'order';
  return s;
}

/** 클라이언트·DB JSON 배열 — 레거시 탭 id 치환 후 info 포함 규칙 적용 */
function normalizeVisibleTabsArray(p) {
  if (!Array.isArray(p) || p.length === 0) return null;
  const mapped = p.map(normalizeVisibleTabIdStr);
  return mapped.includes('info') ? mapped : ['info', ...mapped];
}

/** MySQL TEXT/BLOB 등이 Buffer로 올 때 JSON·파일명 문자열로 통일 */
function coerceImageMainField(v) {
  if (v == null || v === '') return '';
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) return v.toString('utf8');
  if (typeof v === 'string') return v;
  return String(v);
}

/** VARCHAR 등이 mysql2에서 Buffer로 올 때 — res.json 전에 UTF-8 문자열로 통일 */
function coerceUtf8Text(v) {
  if (v == null || v === '') return '';
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) return v.toString('utf8');
  if (typeof v === 'string') return v;
  return String(v);
}

/**
 * eventMain 한 행 + eventInfo 한 행(없으면 null) → 클라이언트용 객체
 */
function mergeEventMainRow(m, info) {
  if (!m) return null;
  const fromInfo =
    info &&
    (info.imageMain != null && String(info.imageMain).trim() !== ''
      ? coerceImageMainField(info.imageMain)
      : info.imageMainName != null && String(info.imageMainName).trim() !== ''
        ? coerceImageMainField(info.imageMainName)
        : '');
  const fromMain =
    m.imageMainName != null && String(m.imageMainName).trim() !== '' ? coerceImageMainField(m.imageMainName) : '';
  const fromMainLegacy =
    m.imageMain != null && String(m.imageMain).trim() !== '' ? coerceImageMainField(m.imageMain) : '';
  const imageMainStr = fromInfo || fromMain || fromMainLegacy || '';
  const defaultTabs = ['info', 'program', 'profile', 'order'];
  let visibleTabs = defaultTabs;
  if (info && info.visibleTabs != null && String(info.visibleTabs).trim() !== '') {
    try {
      const raw = typeof info.visibleTabs === 'string' ? info.visibleTabs : String(info.visibleTabs);
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length) {
        const n = normalizeVisibleTabsArray(p);
        if (n) visibleTabs = n;
      }
    } catch (_) {
      /* keep default */
    }
  } else if (!info) {
    visibleTabs = defaultTabs;
  }
  return {
    id: m.id,
    userAccount: m.userAccount || '',
    ordererName: m.ordererName || '',
    ordererPhone: m.ordererPhone || '',
    orderTitle: m.orderTitle != null && String(m.orderTitle).trim() !== '' ? String(m.orderTitle).trim() : '',
    link: m.link != null && String(m.link).trim() !== '' ? String(m.link).trim() : '',
    /** info.eventName 이 빈 문자열이면 eventMain 폴백 — Buffer·비문자 mysql2 값은 UTF-8 문자열로 */
    eventName: (info && coerceUtf8Text(info.eventName)) || coerceUtf8Text(m.eventName) || '',
    eventNameEn: (() => {
      const fromInfo = info ? coerceUtf8Text(info.eventNameEn).trim() : '';
      const fromMain = coerceUtf8Text(m.eventNameEn).trim();
      return fromInfo || fromMain || '';
    })(),
    date: (info && info.date) || m.date || '',
    place: (info && info.place) || m.place || '',
    superViser: (info && info.superViser) || m.superViser || '',
    address: (info && info.address) || m.address || '',
    quiry: (info && info.quiry) || m.quiry || '',
    placeNaver: (info && info.placeNaver) || m.placeNaver || '',
    placeKakao: (info && info.placeKakao) || m.placeKakao || '',
    imageMainName: imageMainStr,
    imageMain: imageMainStr,
    programType:
      info && info.programType === 'worship' ? 'worship' : 'concert',
    visibleTabs,
    applyNote: (info && info.applyNote != null && String(info.applyNote).trim() !== '' ? String(info.applyNote) : '') || '',
    /** 템플릿 선택 단계 유형 — DB 컬럼은 `eventBookletType`(VARCHAR). 응답 필드명은 클라이언트와 맞춰 `bookletType` */
    bookletType:
      m.eventBookletType != null && String(m.eventBookletType).trim() !== ''
        ? String(m.eventBookletType).trim()
        : '',
    eventGreeting:
      (info && info.eventGreeting != null && String(info.eventGreeting).trim() !== ''
        ? coerceImageMainField(info.eventGreeting)
        : m.eventGreeting != null
          ? coerceImageMainField(m.eventGreeting)
          : ''),
  };
}

module.exports = {
  mergeEventMainRow,
  normalizeVisibleTabsArray,
};
