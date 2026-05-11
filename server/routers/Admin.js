const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { commondb } = require('./dbdatas/commondb');
const { retreatmoredb, retreatdb } = require('./dbdatas/retreatdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");

const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');

const queryAsync = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

const getTableColumns = async (db, tableName) => {
  const columns = await queryAsync(db, `SHOW COLUMNS FROM ${tableName}`);
  return columns.map((column) => column.Field);
};


// 방문자 통계 조회 (일별 방문자 수)
router.get('/homeusercount/statistics', (req, res) => {
  commondb.query(
    `SELECT date, COUNT(DISTINCT ip) as uniqueVisitors, SUM(count) as totalVisits FROM homeusercount GROUP BY date ORDER BY date DESC LIMIT 30`,
    [],
    function (error, result) {
      if (error) { return res.status(500).send(error); }
      res.json(result);
    }
  );
});

// 방문자 통계 조회 (ip별, 전체 따로)
router.get('/homeusercount/statistics/all', (req, res) => {
  // ip별 방문자수 (homeusercount)
  commondb.query(
    `SELECT date, COUNT(DISTINCT ip) as uniqueVisitors, SUM(count) as totalVisits FROM homeusercount GROUP BY date ORDER BY date DESC LIMIT 30`,
    [],
    function (error, byIpResult) {
      if (error) { return res.status(500).send(error); }
      // 전체 방문자수 (countconnectall)
      commondb.query(
        `SELECT date, count as totalVisits FROM countconnectall ORDER BY date DESC LIMIT 30`,
        [],
        function (error2, byAllResult) {
          if (error2) { return res.status(500).send(error2); }
          res.json({ byIp: byIpResult, byAll: byAllResult });
        }
      );
    }
  );
});

// ip별 홈페이지 접속 수 증가 (homeusercount)
router.post('/homeusercount', (req, res) => {
  const { date, ip } = req.body;
  commondb.query(
    `SELECT * FROM homeusercount WHERE date = ? AND ip = ?`,
    [date, ip],
    function (error, result) {
      if (error) { return res.status(500).send(error); }
      if (result.length > 0) {
        res.end(); // 이미 카운트됨
      } else {
        commondb.query(
          `INSERT INTO homeusercount (date, ip, count) VALUES (?, ?, 1)`,
          [date, ip]
        );
        res.end();
      }
    }
  );
});

// 통합 카운트 증가 (메인화면, 상세조회 등)
router.post('/countup', (req, res) => {
  const { date, type } = req.body;
  if (!date || !type) return res.status(400).send('date, type required');
  commondb.query(
    `SELECT * FROM countall WHERE date = ? AND type = ?`,
    [date, type],
    function (error, result) {
      if (error) return res.status(500).send(error);
      if (result.length > 0) {
        commondb.query(
          `UPDATE countall SET count = count + 1 WHERE date = ? AND type = ?`,
          [date, type],
          () => res.end()
        );
      } else {
        commondb.query(
          `INSERT IGNORE INTO countall (date, type, count) VALUES (?, ?, 1)`,
          [date, type],
          () => res.end()
        );
      }
    }
  );
});

// countall 통계 조회 (type별)
router.get('/countall', (req, res) => {
  const { type } = req.query;
  if (!type) return res.status(400).send('type required');
  commondb.query(
    `SELECT date, count as totalVisits FROM countall WHERE type = ? ORDER BY date DESC LIMIT 30`,
    [type],
    function (error, result) {
      if (error) { return res.status(500).send(error); }
      res.json(Array.isArray(result) ? result : []);
    }
  );
});

// datacasting 백업 현황 조회
router.get('/retreat-casting-backup-status', async (req, res) => {
  try {
    const [sourceCountResult, targetCountResult] = await Promise.all([
      queryAsync(retreatmoredb, `SELECT COUNT(*) AS count FROM datacasting`),
      queryAsync(retreatdb, `SELECT COUNT(*) AS count FROM datacasting`)
    ]);

    res.json({
      success: true,
      sourceCount: sourceCountResult[0].count,
      targetCount: targetCountResult[0].count
    });
  } catch (error) {
    console.error('retreat-casting-backup-status error:', error);
    res.status(500).json({
      success: false,
      message: 'datacasting 백업 현황 조회 중 오류가 발생했습니다.'
    });
  }
});

// retreatmore datacasting 데이터를 retreat datacasting으로 복사
router.post('/backup-retreat-casting', async (req, res) => {
  try {
    const sourceColumns = await getTableColumns(retreatmoredb, 'datacasting');
    const targetColumns = await getTableColumns(retreatdb, 'datacasting');
    const copyColumns = sourceColumns.filter((column) => targetColumns.includes(column));

    if (copyColumns.length === 0) {
      return res.status(400).json({
        success: false,
        message: '복사 가능한 공통 컬럼이 없습니다.'
      });
    }

    const columnSql = copyColumns.map((column) => `\`${column}\``).join(', ');
    const sourceRows = await queryAsync(retreatmoredb, `SELECT ${columnSql} FROM datacasting`);

    if (sourceRows.length === 0) {
      return res.json({
        success: true,
        totalCount: 0,
        insertedCount: 0,
        skippedCount: 0,
        columns: copyColumns
      });
    }

    const values = sourceRows.map((row) => copyColumns.map((column) => row[column]));
    const placeholders = values.map(() => `(${copyColumns.map(() => '?').join(', ')})`).join(', ');
    const flatValues = values.flat();

    const insertResult = await queryAsync(
      retreatdb,
      `INSERT IGNORE INTO datacasting (${columnSql}) VALUES ${placeholders}`,
      flatValues
    );

    res.json({
      success: true,
      totalCount: sourceRows.length,
      insertedCount: insertResult.affectedRows,
      skippedCount: sourceRows.length - insertResult.affectedRows,
      columns: copyColumns
    });
  } catch (error) {
    console.error('backup-retreat-casting error:', error);
    res.status(500).json({
      success: false,
      message: 'datacasting 백업 중 오류가 발생했습니다.'
    });
  }
});



module.exports = router;
