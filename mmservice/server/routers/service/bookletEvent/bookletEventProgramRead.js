/**
 * eventProgram(통합) 우선 조회 → 없으면 eventProgramConcert / eventProgramWorship / 구 eventPrograms 폴백
 */
const { getLegacyEventProgramsOrderParts } = require('./bookletEventShared');

function sendProgramRowsResponse(bookletdb, bid, res) {
  bookletdb.query(
    `SELECT id, bookletId, showOrder AS sortOrder, subTitle, title, dateTime, career, postImage,
     IFNULL(showDateTime, 1) AS showDateTime
     FROM eventProgram WHERE bookletId = ? ORDER BY CAST(showOrder AS UNSIGNED), id`,
    [bid],
    (errUnified, unifiedRows) => {
      if (!errUnified && unifiedRows && unifiedRows.length > 0) {
        res.json(unifiedRows);
        return res.end();
      }
      if (errUnified && errUnified.code !== 'ER_NO_SUCH_TABLE') {
        console.error('getdataprogramspart eventProgram:', errUnified.message);
        res.send(false);
        return res.end();
      }
      sendProgramRowsLegacy(bookletdb, bid, res);
    }
  );
}

function sendProgramRowsLegacy(bookletdb, bid, res) {
  bookletdb.query(
    'SELECT programType FROM eventInfo WHERE bookletId = ? LIMIT 1',
    [bid],
    (e0, infoRows) => {
      if (e0) {
        console.error('getdataprogramspart programType:', e0.message);
      }
      const programType =
        infoRows && infoRows[0] && infoRows[0].programType === 'worship'
          ? 'worship'
          : 'concert';

      if (programType === 'worship') {
        bookletdb.query(
          `SELECT id, bookletId, showOrder AS sortOrder, subTitle, title, dateTime, career,
           IFNULL(showDateTime, 1) AS showDateTime,
           '[]' AS postImage
           FROM eventProgramWorship WHERE bookletId = ? ORDER BY CAST(showOrder AS UNSIGNED), id`,
          [bid],
          (error, result) => {
            if (error) {
              if (error.code === 'ER_NO_SUCH_TABLE') {
                tryLegacyEventProgramsOnly(bookletdb, bid, res);
                return;
              }
              console.error('getdataprogramspart worship:', error.message);
              res.send(false);
              return res.end();
            }
            if (result && result.length > 0) {
              res.json(result);
            } else {
              res.send(false);
            }
            res.end();
          }
        );
        return;
      }

      bookletdb.query(
        `SELECT id, bookletId, showOrder AS sortOrder, subTitle, title, dateTime, career, postImage,
         IFNULL(showDateTime, 1) AS showDateTime
         FROM eventProgramConcert WHERE bookletId = ? ORDER BY CAST(showOrder AS UNSIGNED), id`,
        [bid],
        (error, result) => {
          if (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
              tryLegacyEventProgramsOnly(bookletdb, bid, res);
              return;
            }
            console.error('getdataprogramspart concert:', error.message);
            res.send(false);
            return res.end();
          }
          if (result && result.length > 0) {
            res.json(result);
            return res.end();
          }
          tryLegacyEventProgramsOnly(bookletdb, bid, res);
        }
      );
    }
  );
}

function tryLegacyEventProgramsOnly(bookletdb, bid, res) {
  getLegacyEventProgramsOrderParts(bookletdb, (eCols, parts) => {
    if (eCols) {
      console.error('getdataprogramspart legacy cols:', eCols.message);
      res.send(false);
      return res.end();
    }
    if (!parts) {
      res.send(false);
      return res.end();
    }
    const legacySql = `SELECT id, bookletId, ${parts.legacySelectSort}, subTitle, title, dateTime, career, postImage,
     1 AS showDateTime
     FROM eventPrograms WHERE bookletId = ? ORDER BY ${parts.legacyOrderBy}`;
    bookletdb.query(legacySql, [bid], (e2, legacy) => {
      if (e2) {
        if (e2.code === 'ER_NO_SUCH_TABLE') {
          res.send(false);
          return res.end();
        }
        console.error('getdataprogramspart legacy:', e2.message);
        res.send(false);
        return res.end();
      }
      if (legacy && legacy.length > 0) {
        res.json(legacy);
      } else {
        res.send(false);
      }
      res.end();
    });
  });
}

module.exports = { sendProgramRowsResponse };
