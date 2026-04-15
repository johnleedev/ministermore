const { EVENT_ORDER_TABLE } = require('./bookletEventOrderShared');

/**
 * 순서 탭 — `eventOrder` (프로필 eventProfile와 별도)
 * 컬럼: id, bookletId, showOrder, subTitle, title, charger, notice
 */
function sendWorshipRowsResponse(bookletdb, bid, res) {
  bookletdb.query(
    `SELECT id, bookletId, showOrder AS sortOrder,
            IFNULL(subTitle, '') AS subTitle,
            IFNULL(title, '') AS title,
            IFNULL(charger, '') AS charger,
            IFNULL(notice, '') AS notice,
            IFNULL(orderStyle, 'worship') AS orderStyle
     FROM ${EVENT_ORDER_TABLE} WHERE bookletId = ? ORDER BY CAST(showOrder AS UNSIGNED), id`,
    [bid],
    (err, rows) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          res.send(false);
          return res.end();
        }
        console.error('getdataworshippart:', err.message);
        res.send(false);
        return res.end();
      }
      if (rows && rows.length > 0) {
        res.json(rows);
      } else {
        res.send(false);
      }
      res.end();
    }
  );
}

module.exports = { sendWorshipRowsResponse };
