
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
const multer  = require('multer');
const fs = require('fs');

// 장소후기 목록 조회
router.get('/getposts/:page', async (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const query = `
    SELECT
      p.*,
      (
        SELECT COUNT(*)
        FROM reviewComments c
        WHERE c.post_id = p.id
      ) AS commentCount
    FROM review p
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM review;
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      new Promise((resolve, reject) => {
        retreatdb.query(query, [pageSize, offset], (error, result) => {
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

// 장소후기 상세 조회
router.get('/getpost/:postId', (req, res) => {
  const postId = parseInt(req.params.postId);

  retreatdb.query(
    `SELECT * FROM review WHERE id = ?;`,
    [postId],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).send(false);
        return;
      }

      res.send(result.length > 0 ? result[0] : false);
    }
  );
});

// 장소후기 조회수 증가
router.post('/postsviews', (req, res) => {
  const { postId } = req.body;

  retreatdb.query(
    `UPDATE review SET views = views + 1 WHERE id = ?;`,
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

// 댓글 목록 조회
router.get('/getallcomments/:postId', (req, res) => {
  const postId = parseInt(req.params.postId);

  retreatdb.query(
    `SELECT * FROM reviewComments WHERE post_id = ? ORDER BY id DESC;`,
    [postId],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).send(false);
        return;
      }

      res.send(result.length > 0 ? result : false);
    }
  );
});

// 댓글 입력
router.post('/commentsinput', (req, res) => {
  const { postId, commentText, date, userAccount, userNickName } = req.body;

  retreatdb.query(
    `INSERT IGNORE INTO reviewComments (post_id, content, userAccount, userNickName, date) VALUES (?, ?, ?, ?, ?);`,
    [postId, commentText, userAccount, userNickName, date],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows > 0) {
        commondb.query(`UPDATE user SET isPosting = 'true' WHERE userAccount = ?;`, [userAccount]);
        res.send(true);
      } else {
        res.send(false);
      }
    }
  );
});

// 댓글 삭제
router.post('/commentdelete', (req, res) => {
  const { commentId, postId, userAccount } = req.body;

  retreatdb.query(
    `DELETE FROM reviewComments WHERE id = ? AND post_id = ? AND userAccount = ?;`,
    [commentId, postId, userAccount],
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

// 장소후기 삭제
router.post('/postdelete', (req, res) => {
  const { postId, userAccount, images } = req.body;

  retreatdb.query(
    `DELETE FROM review WHERE id = ? AND userAccount = ?;`,
    [postId, userAccount],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows === 0) {
        res.send(false);
        return;
      }

      retreatdb.query(`DELETE FROM reviewComments WHERE post_id = ?;`, [postId]);
      retreatdb.query(`DELETE FROM reviewIsliked WHERE post_id = ?;`, [postId]);

      try {
        const parsedImages = images ? JSON.parse(images) : [];
        if (Array.isArray(parsedImages)) {
          parsedImages.forEach((image) => {
            const imagePath = `build/images/retreat/postimage/${image}`;
            if (fs.existsSync(imagePath)) {
              fs.unlink(imagePath, () => {});
            }
          });
        }
      } catch (parseError) {
        console.error(parseError);
      }

      res.send(true);
    }
  );
});

// 좋아요 데이터 조회
router.get('/getisliked/:postId', (req, res) => {
  const postId = parseInt(req.params.postId);

  retreatdb.query(
    `SELECT * FROM reviewIsliked WHERE post_id = ?;`,
    [postId],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).send(false);
        return;
      }

      res.send(result.length > 0 ? result : false);
    }
  );
});

// 좋아요 토글
router.post('/islikedtoggle', (req, res) => {
  const { isLiked, postId, userAccount } = req.body;
  const isAdd = isLiked === false;

  retreatdb.query(
    `UPDATE review SET isLiked = isLiked ${isAdd ? '+' : '-'} 1 WHERE id = ?;`,
    [postId],
    (error, result) => {
      if (error || result.affectedRows === 0) {
        if (error) console.error(error);
        res.send(false);
        return;
      }

      const query = isAdd
        ? `INSERT IGNORE INTO reviewIsliked (post_id, isliked, userAccount) VALUES (?, 'true', ?);`
        : `DELETE FROM reviewIsliked WHERE post_id = ? AND userAccount = ?;`;

      retreatdb.query(query, [postId, userAccount], (toggleError, toggleResult) => {
        if (toggleError) {
          console.error(toggleError);
          res.send(false);
          return;
        }

        res.send(toggleResult.affectedRows > 0);
      });
    }
  );
});

// 장소후기 사진 파일 저장 미들웨어
const storage = multer.diskStorage({
  destination(req, file, done) {
    const uploadPath = 'build/images/retreat/postimage';
    fs.mkdirSync(uploadPath, { recursive: true });
    done(null, uploadPath);
  },
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const uploadDefault = multer({ storage });

const conditionalUpload = (req, res, next) => {
  if (req.query.postImage) {
    uploadDefault.array('img')(req, res, next);
  } else {
    next();
  }
};

// 장소후기 작성
router.post('/posts', conditionalUpload, (req, res) => {
  const { title, content, userAccount, userNickName, date, postImage } = req.query;

  retreatdb.query(
    `INSERT IGNORE INTO review (title, content, userAccount, userNickName, date, images) VALUES (?, ?, ?, ?, ?, ?);`,
    [title, content, userAccount, userNickName, date, postImage],
    (error, result) => {
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows > 0) {
        commondb.query(`UPDATE user SET grade = '정회원', isPosting = 'true' WHERE userAccount = ?;`, [userAccount]);
        res.send(true);
      } else {
        res.send(false);
      }
    }
  );
});


module.exports = router;
