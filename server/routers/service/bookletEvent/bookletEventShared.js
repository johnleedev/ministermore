/**
 * EventCreate / 행사 전단지(bookleteventcreate 등) 라우트에서 쓰는 id 변환·레거시 보조 함수
 */
const { toChurchMainIdInt } = require('../bookletNotice/bookletNoticeShared');

/** eventMain.id — Notice의 churchMainId와 동일한 정수 파싱 */
function toEventMainIdInt(v) {
  return toChurchMainIdInt(v);
}

/**
 * 구 DB의 eventPrograms(복수) 이관용 — 정식 프로그램 테이블은 eventProgram.
 * eventPrograms는 sortOrder 또는 showOrder 중 하나만 있을 수 있어 INFORMATION_SCHEMA로 분기합니다.
 */
function computeLegacyEventProgramsOrderParts(rows) {
  const cols = new Set((rows || []).map((r) => r.c));
  if (cols.has('sortOrder')) {
    return {
      insertOrderExpr: 'CAST(sortOrder AS CHAR)',
      legacySelectSort: 'sortOrder AS sortOrder',
      legacyOrderBy: 'sortOrder, id',
    };
  }
  if (cols.has('showOrder')) {
    return {
      insertOrderExpr: 'CAST(showOrder AS CHAR)',
      legacySelectSort: 'showOrder AS sortOrder',
      legacyOrderBy: 'CAST(showOrder AS UNSIGNED), id',
    };
  }
  return {
    insertOrderExpr: "'0'",
    legacySelectSort: '0 AS sortOrder',
    legacyOrderBy: 'id',
  };
}

/** null = 미조회, false = 테이블 없음, 배열 = eventPrograms 컬럼 목록 */
let _legacyEventProgramsColRowsCache = null;

/** 구 eventPrograms 테이블 컬럼을 한 번 조회해 캐시(프로세스당). 테이블이 없으면 callback(null, null). */
function getLegacyEventProgramsOrderParts(bookletdb, callback) {
  if (_legacyEventProgramsColRowsCache === false) {
    return callback(null, null);
  }
  if (_legacyEventProgramsColRowsCache !== null) {
    return callback(null, computeLegacyEventProgramsOrderParts(_legacyEventProgramsColRowsCache));
  }
  bookletdb.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'eventPrograms'`,
    (e0, trows) => {
      if (e0) return callback(e0);
      const exists = trows && trows[0] && Number(trows[0].c) > 0;
      if (!exists) {
        _legacyEventProgramsColRowsCache = false;
        return callback(null, null);
      }
      bookletdb.query(
        `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventPrograms'`,
        (err, rows) => {
          if (err) return callback(err);
          _legacyEventProgramsColRowsCache = rows || [];
          callback(null, computeLegacyEventProgramsOrderParts(_legacyEventProgramsColRowsCache));
        }
      );
    }
  );
}

module.exports = {
  toEventMainIdInt,
  computeLegacyEventProgramsOrderParts,
  getLegacyEventProgramsOrderParts,
};
