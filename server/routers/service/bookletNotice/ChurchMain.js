/**
 * 마운트: `app.use('/bookletnoticemain', ChurchMain)` (server/app.js)
 * — 전단지 목록·검색·사용자별 목록 등 (편집 API는 NoticeCreateBooklet → `/bookletnoticecreate`)
 */
const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
router.use(express.json());
const { bookletnoticedb } = require('../../dbdatas/bookletdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// 팜플렛 ----------------------------------------------------------------------------------------

// 팜플렛 데이터 리스트 보내기 (churchMain + churchInfo JOIN)
router.post('/getdatabooklets', async (req, res) => {
  const query = `
    SELECT m.id, m.userAccount, m.templateId, m.created_at, m.updated_at,
           i.title, i.type, i.categoryOrder, i.churchName, i.mainPastor, i.religiousbody,
           i.address, i.quiry, i.youtube, i.blog, i.instar, i.facebook,
           i.mainPastorMessage, i.mainPastorCareer, i.worshipTimes,
           i.placeNaver, i.placeKakao, i.placeHomepage, i.imageMainName, i.mainLogo,
           i.mainPastorImage, i.worshipImage, i.youtubeNoticeImage, i.youtubeNoticeUrl
    FROM churchMain m
    LEFT JOIN churchInfo i ON m.id = i.churchMainId
  `;
  bookletnoticedb.query(query, function (error, result) {
    if (error) {
      throw error;
    }
    if (result.length > 0) {
      const data = result.map((r) => ({ ...r }));
      res.json({ count: data.length, data });
    } else {
      res.json({ count: 0, data: false });
    }
  });
});

// 사용자별 모바일 서비스(전단지) 목록 조회 (마이페이지 서비스 관리용)
router.get('/getUserBooklets/:userAccount', (req, res) => {
  const { userAccount } = req.params;
  if (!userAccount) {
    return res.status(400).json({ success: false, data: [] });
  }
  const query = `
    SELECT m.id, i.title, i.type, i.churchName, i.mainPastor, i.imageMainName
    FROM churchMain m
    LEFT JOIN churchInfo i ON m.id = i.churchMainId
    WHERE m.userAccount = ?
    ORDER BY m.id DESC
  `;
  bookletnoticedb.query(query, [userAccount], (error, result) => {
    if (error) {
      return res.status(500).json({ success: false, data: [] });
    }
    res.json({ success: true, data: result || [] });
  });
});

// 특정 사역 데이터 보내기
router.post('/getdataministrypart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM churchMinistry WHERE bookletId = '${id}';
  `;
  bookletnoticedb.query(query, function (error, result) {
    if (error) {
      throw error;
    }
    if (result.length > 0) {
      res.json(result);
    } else {
      res.send(false);
    }
    res.end();
  });
});

// 특정 행사 데이터 보내기
router.post('/getdataeventspart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM churchEvents WHERE bookletId = '${id}';
  `;
  bookletnoticedb.query(query, function (error, result) {
    if (error) {
      throw error;
    }
    if (result.length > 0) {
      res.json(result);
    } else {
      res.send(false);
    }
    res.end();
  });
});

// 팜플렛 데이터 검색하기 (churchInfo.title 기준)
router.post('/getdatabookletsearch', async (req, res) => {
  var { word, type } = req.body;
  const whereType = type === 'all' ? '' : `AND i.type = '${type}'`;

  const query = `
    SELECT m.id, m.userAccount, m.templateId,
           i.title, i.type, i.churchName, i.mainPastor, i.imageMainName
    FROM churchMain m
    LEFT JOIN churchInfo i ON m.id = i.churchMainId
    WHERE (i.title LIKE '%${word}%' OR i.churchName LIKE '%${word}%')
    ${whereType}
  `;
  bookletnoticedb.query(query, function (error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({ count: result.length, data: result });
    } else {
      res.json({ count: 0, data: false });
    }
  });
});

module.exports = router;
