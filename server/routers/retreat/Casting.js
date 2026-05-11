const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { retreatdb } = require('../dbdatas/retreatdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer = require('multer');
const fs = require('fs');
// 강사 데이터 리스트 보내기
router.post('/getdatacasting', async (req, res) => {
  const query = `
    SELECT id, isView, sort, name, images
    FROM datacasting;
  `;

  retreatdb.query(query, function (error, result) {
    if (error) {
      console.error(error);
      res.status(500).json({ count: 0, data: false });
      return;
    }

    if (result.length > 0) {
      res.json({
        count: result.length,
        data: result
      });
    } else {
      res.json({
        count: 0,
        data: false
      });
    }
  });
});

// 강사 데이터 검색하기
router.post('/getdatacastingsearch', async (req, res) => {
  const { word = '' } = req.body;
  const query = `
    SELECT id, isView, sort, name, images
    FROM datacasting
    WHERE name LIKE ?;
  `;

  retreatdb.query(query, [`%${word}%`], function (error, result) {
    if (error) {
      console.error(error);
      res.status(500).json({ count: 0, data: false });
      return;
    }

    if (result.length > 0) {
      res.json({
        count: result.length,
        data: result
      });
    } else {
      res.json({
        count: 0,
        data: false
      });
    }
  });
});

// 특정 강사 데이터 보내기
router.post('/getdatacastingpart', async (req, res) => {
  const { id } = req.body;
  const query = `
    SELECT *
    FROM datacasting
    WHERE id = ?;
  `;

  retreatdb.query(query, [id], function (error, result) {
    if (error) {
      console.error(error);
      res.status(500).send(false);
      return;
    }

    if (result.length > 0) {
      res.json(result);
    } else {
      res.send(false);
    }
  });
});

// 강사 사진 파일 저장 미들웨어
const storageCasting = multer.diskStorage({
  destination(req, file, done) {
    const uploadPath = 'build/images/retreat/castingimage';
    fs.mkdirSync(uploadPath, { recursive: true });
    done(null, uploadPath);
  },
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const uploadCasting = multer({ storage: storageCasting });

const conditionalUploadCasting = (req, res, next) => {
  if (req.query.images) {
    uploadCasting.array('img')(req, res, next);
  } else {
    next();
  }
};

// 강사 등록 요청
router.post('/postscasting', conditionalUploadCasting, (req, res) => {
  const { sort, name, phone, profile, images, date, userContact } = req.query;

  retreatdb.query(
    `INSERT IGNORE INTO datacasting (isView, sort, name, phone, profile, images, date, userContact) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    ['false', sort, name, phone, profile, images, date, userContact],
    function (error, result) {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows > 0) {
        res.send(true);
      } else {
        res.send(false);
      }
    }
  );
});

module.exports = router;
