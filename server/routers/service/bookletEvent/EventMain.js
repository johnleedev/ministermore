/**
 * 마운트: `app.use('/bookleteventmain', EventMain)` (server/app.js) — 목록·검색·공개 조회 등
 */
const express = require('express');
const router = express.Router();
var cors = require('cors');
router.use(cors());
router.use(express.json());
const { bookleteventdb } = require('../../dbdatas/bookletdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const { toEventMainIdInt } = require('./bookletEventShared');
const { mergeEventMainRow } = require('./bookletEventMerge');
const { sendProgramRowsResponse } = require('./bookletEventProgramRead');
const { sendCastRowsResponse } = require('./bookletEventCastRead');
const { sendWorshipRowsResponse } = require('./bookletEventWorshipRead');

// 팜플렛 ----------------------------------------------------------------------------------------

// 팜플렛 데이터 리스트 보내기
router.get('/getdatabooklets', async (req, res) => {
  const query = `SELECT * FROM eventMain`;
  bookleteventdb.query(query, function (error, result) {
    if (error) {
      throw error;
    }
    if (result.length > 0) {
      res.json({
        count: result.length,
        data: result,
      });
    } else {
      res.json({
        count: 0,
        data: false,
      });
    }
  });
});

// 팜플렛 데이터 검색하기 (eventMain + eventInfo.eventName)
router.post('/getdatabookletsearch', async (req, res) => {
  var { word, type } = req.body;
  const w = typeof word === 'string' ? word : '';
  const like = `%${w}%`;
  /** 레거시 eventMain.title / eventMain.type 이 있으면 사용 */
  bookleteventdb.query(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventMain'`,
    (colErr, colRows) => {
      if (colErr) {
        console.error('getdatabookletsearch columns:', colErr.message);
        return res.status(500).json({ count: 0, data: false });
      }
      const mainCols = new Set((colRows || []).map((r) => r.c));
      const hasTitle = mainCols.has('title');
      const hasType = mainCols.has('type');
      const typeClause =
        hasType && type && type !== 'all' ? 'AND m.type = ?' : '';
      const titleClause = hasTitle ? 'OR m.title LIKE ?' : '';

      const params = [like, like, like];
      if (hasTitle) params.push(like);
      if (typeClause) params.push(type);

      const sql = `
        SELECT DISTINCT m.*
        FROM eventMain m
        LEFT JOIN eventInfo i ON i.bookletId = CAST(m.id AS CHAR)
        WHERE (
          i.eventName LIKE ?
          OR m.ordererName LIKE ?
          OR m.ordererPhone LIKE ?
          ${titleClause}
        )
        ${typeClause}`;

      bookleteventdb.query(sql, params, function (error, result) {
        if (error) {
          console.error('getdatabookletsearch:', error.message);
          return res.json({ count: 0, data: false });
        }
        if (result.length > 0) {
          res.json({
            count: result.length,
            data: result,
          });
        } else {
          res.json({
            count: 0,
            data: false,
          });
        }
      });
    }
  );
});

// 특정 행사 전단지 데이터 보내기 (eventMain.id + eventInfo 병합)
router.post('/getdatabookletspart', async (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  bookleteventdb.query('SELECT * FROM eventMain WHERE id = ? LIMIT 1', [id], (error, result) => {
    if (error) {
      console.error('getdatabookletspart:', error.message);
      res.send(false);
      return res.end();
    }
    if (!result || result.length === 0) {
      res.send(false);
      return res.end();
    }
    const m = result[0];
    bookleteventdb.query('SELECT * FROM eventInfo WHERE bookletId = ? LIMIT 1', [String(id)], (e2, infoRows) => {
      if (e2) {
        console.error('getdatabookletspart eventInfo:', e2.message);
        res.json([mergeEventMainRow(m, null)]);
        return res.end();
      }
      const info = infoRows && infoRows[0] ? infoRows[0] : null;
      res.json([mergeEventMainRow(m, info)]);
      res.end();
    });
  });
});

router.post('/getdataprogramspart', async (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendProgramRowsResponse(bookleteventdb, String(id), res);
});

router.post('/getdatacastpart', async (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendCastRowsResponse(bookleteventdb, String(id), res);
});

router.post('/getdataworshippart', async (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendWorshipRowsResponse(bookleteventdb, String(id), res);
});

module.exports = router;
