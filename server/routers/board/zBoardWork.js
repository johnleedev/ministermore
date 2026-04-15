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

const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');


// 관리자용 게시글 작성 API
router.post('/writepost', (req, res) => {
  const { sort, title, content, userAccount, userNickName, date } = req.body;
  const titleCopy = escapeQuotes(title);
  const contentCopy = escapeQuotes(content);
  const postDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
  
  boarddb.query(`
    INSERT INTO posts (sort, title, content, userAccount, userNickName, date, images, views, isLiked) VALUES
     ('${sort}', '${titleCopy}', '${contentCopy}', '${userAccount}', '${userNickName}', '${postDate}', '', 0, 0);
    `,function(error, result){
    if (error) {
      console.error('Database error:', error);
      res.status(500).send({ error: 'Database error' });
      res.end();
    } else if (result.affectedRows > 0) {
      // 익명게시판이면 다른 글들의 조회수 랜덤 증가
      if (sort === 'nickname') {
        boarddb.query(`
          SELECT id FROM posts WHERE sort = 'nickname' AND id != ${result.insertId}
        `, function(error2, result2) {
          if (!error2 && result2.length > 0) {
            result2.forEach(post => {
              const randomIncrease = Math.floor(Math.random() * 4) + 2; // 2~5 랜덤 증가
              boarddb.query(`
                UPDATE posts SET views = views + ${randomIncrease} WHERE id = ${post.id}
              `, function(error3, result3) {
                if (error3) {
                  console.error('조회수 증가 중 오류:', error3);
                }
              });
            });
          }
        });
      }
      
      res.send({ success: true, insertId: result.insertId });
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});




// 댓글 입력하기
router.post('/commentsinput', (req, res) => {
  const { postId, commentText, date, userAccount, userNickName} = req.body;
  
  boarddb.query(`
  INSERT IGNORE INTO comments (post_id, content, userAccount, userNickName, date) VALUES 
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


router.get('/getallnicknameposts', (req, res) => {
  boarddb.query(`
  SELECT * FROM posts WHERE sort = 'nickname';
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




// 게시글 삭제하기
router.post('/deletepost', async (req, res) => {
  
  const { postId, userAccount, images } = req.body;

  boarddb.query(`DELETE FROM comments WHERE post_id = '${postId}' AND userAccount = '${userAccount}';`);
  boarddb.query(`DELETE FROM isliked WHERE post_id = '${postId}' AND userAccount = '${userAccount}';`);

  try {
   
    boarddb.query(`
      DELETE FROM posts WHERE id = '${postId}' AND userAccount = '${userAccount}';
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

module.exports = router;