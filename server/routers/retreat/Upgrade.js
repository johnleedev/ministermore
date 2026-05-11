
const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { retreatdb } = require('../dbdatas/retreatdb');
const { commondb } = require('../dbdatas/commondb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));

// 등업신청 목록 조회
router.get('/getposts/:page', async (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT *
    FROM gradeRequest
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM gradeRequest;
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      new Promise((resolve, reject) => {
        retreatdb.query(dataQuery, [pageSize, offset], (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        retreatdb.query(countQuery, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      })
    ]);

    res.send({
      resultData: dataResult,
      totalCount: countResult[0].totalCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Database query failed' });
  }
});

// 등업신청 작성 가능 여부 확인
router.post('/checkisposting', (req, res) => {
  const { userAccount } = req.body;

  commondb.query(
    `SELECT isPosting FROM user WHERE userAccount = ? LIMIT 1;`,
    [userAccount],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.length === 0) {
        res.send(false);
        return;
      }
      res.send(result[0].isPosting === 'true');
    }
  );
});

// 등업신청 작성
router.post('/posts', (req, res) => {
  const { title, content, userAccount, userNickName, date } = req.body;

  retreatdb.query(
    `INSERT IGNORE INTO gradeRequest (title, content, userAccount, userNickName, date) VALUES (?, ?, ?, ?, ?);`,
    [title, content, userAccount, userNickName, date],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows > 0) {
        commondb.query(`UPDATE user SET grade = '정회원' WHERE userAccount = ?;`, [userAccount]);
        res.send(true);
      } else {
        res.send(false);
      }
    }
  );
});

// 등업신청 삭제
router.post('/postdelete', (req, res) => {
  const { postId, userAccount } = req.body;

  retreatdb.query(
    `DELETE FROM gradeRequest WHERE id = ? AND userAccount = ?;`,
    [postId, userAccount],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      res.send(result.affectedRows > 0);
    }
  );
});

// 등업신청 조회수 증가
router.post('/postsviews', (req, res) => {
  const { postId } = req.body;

  retreatdb.query(
    `UPDATE gradeRequest SET views = views + 1 WHERE id = ?;`,
    [postId],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      res.send(result.affectedRows > 0);
    }
  );
});



module.exports = router;
