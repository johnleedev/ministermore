const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { commondb } = require('../dbdatas/commondb');
const { retreatmoredb, retreatdb } = require('../dbdatas/retreatdb');
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

const COUNT_METRIC_TYPES = [
  'mainconnect',
  'recruitview',
  'retreatmenu',
  'servicemenu',
  'praisewordclick',
];

const webVisitorWhere = "ip NOT LIKE 'app:%'";
const appVisitorWhere = "ip LIKE 'app:%'";

const fetchVisitorStats = (whereClause) =>
  queryAsync(
    commondb,
    `SELECT date, COUNT(DISTINCT ip) AS uniqueVisitors, SUM(count) AS totalVisits
       FROM homeusercount
      WHERE ${whereClause}
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30`,
    []
  );

const fetchCountallByType = (type) =>
  queryAsync(
    commondb,
    `SELECT date, count AS totalVisits FROM countall WHERE type = ? ORDER BY date DESC LIMIT 30`,
    [type]
  );

// 방문자 통계 조회 (일별 방문자 수, 웹만)
router.get('/homeusercount/statistics', (req, res) => {
  commondb.query(
    `SELECT date, COUNT(DISTINCT ip) as uniqueVisitors, SUM(count) as totalVisits FROM homeusercount WHERE ${webVisitorWhere} GROUP BY date ORDER BY date DESC LIMIT 30`,
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
    `SELECT date, COUNT(DISTINCT ip) as uniqueVisitors, SUM(count) as totalVisits FROM homeusercount WHERE ${webVisitorWhere} GROUP BY date ORDER BY date DESC LIMIT 30`,
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

// 웹·앱 통합 대시보드 (관리자 통계 화면)
router.get('/statistics/dashboard', async (req, res) => {
  try {
    const [webVisitors, appVisitors, webMetrics, appMetrics] = await Promise.all([
      fetchVisitorStats(webVisitorWhere),
      fetchVisitorStats(appVisitorWhere),
      Promise.all(COUNT_METRIC_TYPES.map((type) => fetchCountallByType(type))),
      Promise.all(COUNT_METRIC_TYPES.map((type) => fetchCountallByType(`app_${type}`))),
    ]);

    const metricMap = (rowsList) =>
      COUNT_METRIC_TYPES.reduce((acc, type, index) => {
        acc[type] = rowsList[index] || [];
        return acc;
      }, {});

    return res.json({
      web: {
        visitors: webVisitors,
        metrics: metricMap(webMetrics),
      },
      app: {
        visitors: appVisitors,
        metrics: metricMap(appMetrics),
      },
    });
  } catch (error) {
    console.error('statistics/dashboard error:', error);
    return res.status(500).json({ message: 'failed to fetch statistics dashboard' });
  }
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

// 수련회강사(datacasting) 백업: retreatmore → retreat
router.get('/retreat-casting-backup-status', async (req, res) => {
  try {
    const sourceRows = await queryAsync(retreatmoredb, 'SELECT COUNT(*) AS cnt FROM datacasting');
    const targetRows = await queryAsync(retreatdb, 'SELECT COUNT(*) AS cnt FROM datacasting');
    return res.json({
      success: true,
      sourceCount: Number(sourceRows?.[0]?.cnt || 0),
      targetCount: Number(targetRows?.[0]?.cnt || 0),
    });
  } catch (error) {
    console.error('retreat-casting-backup-status error:', error);
    return res.status(500).json({
      success: false,
      message: '백업 현황 조회 실패',
      error: error?.message || 'unknown error',
    });
  }
});

router.post('/backup-retreat-casting', async (req, res) => {
  try {
    const sourceColumns = await getTableColumns(retreatmoredb, 'datacasting');
    const targetColumns = await getTableColumns(retreatdb, 'datacasting');
    const copyColumns = sourceColumns.filter((col) => targetColumns.includes(col) && col !== 'id');

    if (!copyColumns.length) {
      return res.status(400).json({
        success: false,
        message: '복사할 공통 컬럼이 없습니다.',
      });
    }

    const countRows = await queryAsync(retreatmoredb, 'SELECT COUNT(*) AS total FROM datacasting');
    const totalCount = Number(countRows?.[0]?.total || 0);
    const columnSql = copyColumns.map((col) => `\`${col}\``).join(', ');

    const insertResult = await queryAsync(
      retreatdb,
      `INSERT IGNORE INTO datacasting (${columnSql})
       SELECT ${columnSql} FROM retreatmore.datacasting`,
    );

    const insertedCount = Number(insertResult?.affectedRows || 0);
    const skippedCount = Math.max(0, totalCount - insertedCount);

    return res.json({
      success: true,
      totalCount,
      insertedCount,
      skippedCount,
      columns: copyColumns,
    });
  } catch (error) {
    console.error('backup-retreat-casting error:', error);
    return res.status(500).json({
      success: false,
      message: '수련회강사 백업 실패',
      error: error?.message || 'unknown error',
    });
  }
});


module.exports = router;
