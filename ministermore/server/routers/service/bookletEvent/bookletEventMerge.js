/**
 * eventMain + eventInfo 병합 (bookleteventmain / bookleteventcreate 공통)
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

module.exports = {
  normalizeVisibleTabsArray,
};
