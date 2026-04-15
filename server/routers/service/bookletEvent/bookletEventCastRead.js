function sendCastRowsResponse(bookletdb, bid, res) {
  bookletdb.query(
    `SELECT id, bookletId, showOrder AS sortOrder, personName, roleName, note, postImage
     FROM eventProfile WHERE bookletId = ? ORDER BY CAST(showOrder AS UNSIGNED), id`,
    [bid],
    (err, rows) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          res.send(false);
          return res.end();
        }
        console.error('getdatacastpart:', err.message);
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

module.exports = { sendCastRowsResponse };
