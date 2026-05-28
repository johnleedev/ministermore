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
const path = require('path');

const CASTING_IMAGE_DIR = path.join(__dirname, '../../build/images/retreat/castingimage');
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const pickField = (body, query, key) => {
  if (body && body[key] != null && body[key] !== '') return body[key];
  if (query && query[key] != null && query[key] !== '') return query[key];
  return '';
};

const isRecentDuplicateRow = (rowDate) => {
  if (!rowDate) return false;
  const t = new Date(rowDate).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DUPLICATE_WINDOW_MS;
};
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
    try {
      fs.mkdirSync(CASTING_IMAGE_DIR, { recursive: true });
      done(null, CASTING_IMAGE_DIR);
    } catch (err) {
      done(err);
    }
  },
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const uploadCasting = multer({ storage: storageCasting });

// 강사 등록 요청 (multipart: 필드는 body, 파일은 img)
router.post('/postscasting', (req, res) => {
  uploadCasting.array('img')(req, res, (uploadErr) => {
    if (uploadErr) {
      console.error('postscasting image upload error:', uploadErr);
      res.status(500).send(false);
      return;
    }

    const sort = pickField(req.body, req.query, 'sort');
    const name = pickField(req.body, req.query, 'name');
    const phone = pickField(req.body, req.query, 'phone');
    const profile = pickField(req.body, req.query, 'profile');
    const images = pickField(req.body, req.query, 'images');
    const date = pickField(req.body, req.query, 'date');
    const userContact = pickField(req.body, req.query, 'userContact');

    retreatdb.query(
      `SELECT id, date FROM datacasting WHERE name = ? AND sort = ? AND userContact = ? ORDER BY id DESC LIMIT 1`,
      [name, sort, userContact],
      (dupErr, dupRows) => {
        if (dupErr) {
          console.error(dupErr);
          res.send(false);
          return;
        }
        if (dupRows && dupRows.length > 0 && isRecentDuplicateRow(dupRows[0].date)) {
          res.send(true);
          return;
        }

        retreatdb.query(
          `INSERT INTO datacasting (isView, sort, name, phone, profile, images, date, userContact) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          ['false', sort, name, phone, profile, images, date, userContact],
          function (error, result) {
            if (error) {
              console.error(error);
              res.send(false);
              return;
            }
            res.send(result.affectedRows > 0);
          }
        );
      }
    );
  });
});

const parseImageList = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [String(images)];
  }
};

const unlinkImageFiles = (dir, fileNames) => {
  fileNames.forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error(unlinkErr);
      }
    }
  });
};

// 관리자 — 강사 전체 목록
router.post('/admingetall', (req, res) => {
  retreatdb.query('SELECT * FROM datacasting ORDER BY id DESC', (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json({ ok: false, data: [] });
      return;
    }
    res.json({ ok: true, data: result || [] });
  });
});

// 관리자 — 노출 여부 변경
router.post('/adminupdateisview', (req, res) => {
  const { id, isView } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }
  const viewValue = isView === true || isView === 'true' || isView === 1 || isView === '1' ? 'true' : 'false';
  retreatdb.query('UPDATE datacasting SET isView = ? WHERE id = ?', [viewValue, id], (error, result) => {
    if (error) {
      console.error(error);
      res.send(false);
      return;
    }
    res.send(result.affectedRows > 0);
  });
});

// 관리자 — 강사 정보 수정
router.post('/adminupdate', (req, res) => {
  const { id, sort, name, phone, profile, userContact, images } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }

  const imagesJson = images ?? '[]';
  retreatdb.query('SELECT images FROM datacasting WHERE id = ?', [id], (selectErr, rows) => {
    if (selectErr) {
      console.error(selectErr);
      res.send(false);
      return;
    }

    const previousNames = rows.length > 0 ? parseImageList(rows[0].images) : [];
    const nextNames = parseImageList(imagesJson);
    const removedNames = previousNames.filter((name) => !nextNames.includes(name));

    retreatdb.query(
      'UPDATE datacasting SET sort = ?, name = ?, phone = ?, profile = ?, userContact = ?, images = ? WHERE id = ?',
      [sort, name, phone, profile, userContact, imagesJson, id],
      (error, result) => {
        if (error) {
          console.error(error);
          res.send(false);
          return;
        }
        if (result.affectedRows > 0 && removedNames.length > 0) {
          unlinkImageFiles(CASTING_IMAGE_DIR, removedNames);
        }
        res.send(result.affectedRows > 0);
      }
    );
  });
});

// 관리자 — 강사 삭제
router.post('/admindelete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }

  retreatdb.query('SELECT images FROM datacasting WHERE id = ?', [id], (selectErr, rows) => {
    if (selectErr) {
      console.error(selectErr);
      res.send(false);
      return;
    }

    const imageNames = rows.length > 0 ? parseImageList(rows[0].images) : [];
    unlinkImageFiles(CASTING_IMAGE_DIR, imageNames);

    retreatdb.query('DELETE FROM datacasting WHERE id = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error(deleteErr);
        res.send(false);
        return;
      }
      res.send(result.affectedRows > 0);
    });
  });
});

module.exports = router;
