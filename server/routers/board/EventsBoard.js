const express = require('express');
const router = express.Router()
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { boarddb } = require('../dbdatas/boarddb');
var cors = require('cors');
router.use(cors());
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");

const escapeQuotes = (str) => {
  if (!str) return '';
  return str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');
};

const { handleBoardPostSearch } = require('./boardSearchHelpers');

// 게시글 검색 API (구분/지역 칩 클릭 시 즉시 필터)
router.post('/eventsgetpostssearch', async (req, res) => {
  await handleBoardPostSearch(req, res, boarddb, {
    postsTable: 'eventsPosts',
    commentsTable: 'eventsComments',
    withRegions: true,
  });
});

// 게시글 전체 목록 조회 API
router.get('/eventsgetposts/:page', async (req, res) => {
  var page = parseInt(req.params.page) || 1;
  var pageSize = 10;
  var offset = (page - 1) * pageSize;

  const dataQuery = `ORDER BY p.id DESC LIMIT ? OFFSET ?`;

  const query = `
    SELECT p.*, COUNT(c.id) AS commentCount FROM eventsPosts p
    LEFT JOIN eventsComments c ON p.id = c.post_id
    GROUP BY p.id
    ${dataQuery}
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount FROM eventsPosts p
  `;

  const queryParams = [pageSize, offset];
  const countParams = [];

  try {
    const [dataResult, countResult] = await Promise.all([
      new Promise((resolve, reject) => {
        boarddb.query(query, queryParams, (error, result) => {
          if (error) reject(error);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        boarddb.query(countQuery, countParams, (error, result) => {
          if (error) reject(error);
          resolve(result);
        });
      })
    ]);

    const totalCount = countResult[0].totalCount;
    res.send({
      resultData: dataResult,
      totalCount: totalCount
    });
    res.end();
  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});



// 게시글 조회시, 조회수 증가시키기
router.post('/eventspostsviews', (req, res) => {
  const { postId } = req.body;
  boarddb.query(`
    UPDATE eventsPosts SET views = views + 1 WHERE id = ${postId}
  `,function(error, result){
  if (error) {throw error}
  if (result.affectedRows > 0) {
    res.send(true);
    res.end();
  } else {
    res.send(false);
    res.end();
  }})
}); 



// 게시글 사진 파일 저장 미들웨어
const storage = multer.diskStorage({
  destination(req, file, done) { 
    done(null, 'build/images/postimage/events');
  }, 
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const upload_default = multer({ storage });

// 이미지 업로드 미들웨어를 조건부로 실행
const conditionalUpload = (req, res, next) => {
  if (req.query.postImage) {
    upload_default.array('img')(req, res, next);
  } else {
    next();
  }
};


// 게시글 생성하기
router.post('/eventspost', conditionalUpload, (req, res) => {
  const { title, content, userAccount, userNickName, date, postImage, sort, region } = req.query;
  
  if (!title || !content || !userAccount || !userNickName || !date || !sort) {
    return res.status(400).send({ error: 'Missing required fields' });
  }
  
  const titleCopy = escapeQuotes(title);
  const contentCopy = escapeQuotes(content);
  const sortCopy = escapeQuotes(sort);
  const regionCopy = escapeQuotes(region || '');

  boarddb.query(`
    INSERT IGNORE INTO eventsPosts (sort, region, title, content, userAccount, userNickName, date, images) VALUES
     ('${sortCopy}', '${regionCopy}', '${titleCopy}', '${contentCopy}', '${userAccount}', '${userNickName}', '${date}', '${postImage || ''}');
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


// 게시글 수정하기
router.post('/eventspostedit', upload_default.array('img'), (req, res) => {
  const { postId, title, content, date, postImage, sort, region } = req.query;
  if (!postId || !title || !content) {
    return res.status(400).send(false);
  }
  const titleCopy = escapeQuotes(title);
  const contentCopy = escapeQuotes(content);
  const dateCopy = escapeQuotes(date || '');
  const postImageCopy = escapeQuotes(postImage || '');
  const sortCopy = sort ? escapeQuotes(sort) : '';
  const regionCopy = region != null ? escapeQuotes(region) : '';
  const sortSet = sortCopy ? `, sort = '${sortCopy}'` : '';
  const regionSet = region != null ? `, region = '${regionCopy}'` : '';
  boarddb.query(`
  UPDATE eventsPosts SET 
    title = '${titleCopy}', 
    content = '${contentCopy}',
    date = '${dateCopy}',
    images = '${postImageCopy}'${sortSet}${regionSet}
  WHERE id = ${postId}
  `,function(error, result){
  if (error) {throw error}
  if (result.affectedRows > 0) {            
    res.send(true);
    res.end();
  } else {
    res.send(false);  
    res.end();
  }})
});


// 게시글 첨부사진 전체 삭제하기
router.post('/eventsdeleteimages', async (req, res) => {
  const { postId, userAccount, images } = req.body;
  try {
    // 각 이미지를 삭제하는 비동기 함수
    const deleteImage = (image) => {
      return new Promise((resolve, reject) => {
        const imagePath = `build/images/postimage/events/${image}`;
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) reject(err);
            else resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    };

    // 모든 이미지 삭제
    const deletePromises = images.map(deleteImage);
    await Promise.all(deletePromises);

    boarddb.query(`
      UPDATE eventsPosts SET images = NULL WHERE id = '${postId}' AND userAccount = '${userAccount}';
      `,function(error, result){
      if (error) {throw error}
      if (result.affectedRows > 0) {
        res.send(true);
        res.end();
      } else {
        res.send(false);  
        res.end();
      }})

    } catch (error) {
    res.send(error);
    res.end();
  }
});


// 게시글 삭제하기
router.post('/eventsdeletepost', async (req, res) => {
  
  const { postId, userAccount, images } = req.body;

  boarddb.query(`DELETE FROM eventsComments WHERE post_id = '${postId}' AND userAccount = '${userAccount}';`);
  boarddb.query(`DELETE FROM eventsIsliked WHERE post_id = '${postId}' AND userAccount = '${userAccount}';`);

  try {
   
    // 각 이미지를 삭제하는 비동기 함수
    const deleteImage = (image) => {
      return new Promise((resolve, reject) => {
        const imagePath = `build/images/postimage/events/${image}`;
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) reject(err);
            else resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    };

    // 모든 이미지 삭제
    const deletePromises = images.map(deleteImage);
    await Promise.all(deletePromises);

    boarddb.query(`
      DELETE FROM eventsPosts WHERE id = '${postId}' AND userAccount = '${userAccount}';
      `,function(error, result){
      if (error) {throw error}
      if (result.affectedRows > 0) {
        res.send(true);
        res.end();
      } else {
        res.send(false);  
        res.end();
      }})

    } catch (error) {
    res.send(error);
    res.end();
  }
 
});




// 좋아요 ----------------------------------------------------------------------------------------------------

// 좋아요 데이터 가져오기
router.get('/eventsgetisliked/:postID', (req, res) => {
  var postId = parseInt(req.params.postID);
  boarddb.query(`
    SELECT * FROM eventsIsliked WHERE post_id = '${postId}';
  `, function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.send(result);
      res.end();
    } else {              
      res.send(false);
      res.end();
    }            
  });
});



// 게시글 좋아요 버튼, 토글 관리
router.post('/eventsislikedtoggle', (req, res) => {
  
  const { isLiked, postId, userAccount } = req.body;

  if (isLiked === false) {
    boarddb.query(`
    UPDATE eventsPosts SET isLiked = isLiked + 1 WHERE id = ${postId};
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {
      boarddb.query(`
      INSERT IGNORE INTO eventsIsliked (post_id, isliked, userAccount) VALUES 
          ('${postId}', 'true', '${userAccount}');
      `,function(error, result){
      if (error) {throw error}
      if (result.affectedRows > 0) {
        res.send(true); res.end();
      } else {
        res.send(false); res.end();
      }})
    } else {
      res.send(false); res.end();
    }})
  } else if (isLiked === true) {
    boarddb.query(`
    UPDATE eventsPosts SET isLiked = isLiked - 1 WHERE id = ${postId};
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {
      boarddb.query(`
      DELETE FROM eventsIsliked WHERE post_id = ${postId} AND userAccount = '${userAccount}';
      `,function(error, result){
      if (error) {throw error}
      if (result.affectedRows > 0) {
        res.send(true); res.end();
      } else {
        res.send(false); res.end();
      }})
    } else {
      res.send(false); res.end();
    }})
  }
  
});


// 댓글 ----------------------------------------------------------------------------------------------------

// 특정 게시물의 댓글 목록 가져오기
router.get('/eventsgetallcomments/:postId', (req, res) => {
  var postId = parseInt(req.params.postId);
  boarddb.query(`
  SELECT * FROM eventsComments WHERE post_id = '${postId}'
  `, function(error, result){
  if (error) {throw error}
  if (result.length > 0) {
    res.send(result);
    res.end();
  } else {
    res.send(false);  
    res.end();
  }})
});

// 댓글 입력하기
router.post('/eventscommentsinput', (req, res) => {
  const { postId, commentText, date, userAccount, userNickName} = req.body;
  
  boarddb.query(`
  INSERT IGNORE INTO eventsComments (post_id, content, userAccount, userNickName, date) VALUES 
   ('${postId}', '${commentText}', '${userAccount}', '${userNickName}', '${date}');
  `, function(error, result){
  if (error) {throw error}
  if (result.affectedRows > 0) {
    res.send(true);
    res.end();
  } else {
    res.send(false);  
    res.end();
  }})
});


// 댓글 삭제하기
router.post('/eventscommentdelete', (req, res) => {
  const { commentId, postId, userAccount } = req.body;

  boarddb.query(`
  DELETE FROM eventsComments WHERE id = '${commentId}' AND post_id = '${postId}' AND userAccount = '${userAccount}';
  `,function(error, result){
  if (error) {throw error}
  if (result.affectedRows > 0) {
    res.send(true);
    res.end();
  } else {
    res.send(false);  
    res.end();
  }})
});


// 특정 유저 댓글 작성 여부 확인하기
router.post('/checkeventsisposting', (req, res) => {
  const { userAccount } = req.body;
  boarddb.query(`
  SELECT * FROM user WHERE userAccount = '${userAccount}' AND isPosting = 'true';
  `, function(error, result){
  if (error) {throw error}
  if (result.length > 0) {
    res.send(true);
    res.end();
  } else {
    res.send(false);  
    res.end();
  }})
});


module.exports = router;

