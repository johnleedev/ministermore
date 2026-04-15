const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { ministerdb } = require('../dbdatas/ministerdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");

const escapeQuotes = (str) => {
  if (str === null || str === undefined) {
    return '';
  }
  return str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');
};
// 팜플렛 ----------------------------------------------------------------------------------------

// 팜플렛 데이터 리스트 보내기
router.get('/getdataministers', async (req, res) => {
  
  const query = `SELECT * FROM ministerMain`;
  
  ministerdb.query(query, function (error, result) {
    if (error) { throw error; }
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


// 특정 데이터 가져오기
router.post('/getdataministerspart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM ministerMain WHERE id = '${id}';
  `;
  ministerdb.query(query, function (error, result) {
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


// 게시글 사진 파일 저장 미들웨어
const storage = multer.diskStorage({
  destination(req, file, done) { 
    done(null, 'build/images/minister');
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
router.post('/post', conditionalUpload, (req, res) => {
  const { userAccount, sort, name, personInfo, profile, images, youtube, contact, date } = req.query;

  const personInfoCopy = escapeQuotes(personInfo || '');
  const profileCopy = escapeQuotes(profile || '');
  const imagesCopy = escapeQuotes(images || '');
  const youtubeCopy = escapeQuotes(youtube || '');
  const contactCopy = escapeQuotes(contact || '');
  
  
  ministerdb.query(`
    INSERT IGNORE INTO ministerMain 
    (userAccount, sort, name, personInfo, profile, images, youtube, contact, date) VALUES
     ('${userAccount}', '${sort}', '${name}', '${personInfoCopy}', '${profileCopy}', '${imagesCopy}',
      '${youtubeCopy}', '${contactCopy}', '${date}');
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
router.post('/edit', upload_default.array('img'), (req, res) => {
  const { postId, userAccount, sort, name, personInfo, profile, images, youtube, contact, date } = req.query;

console.log(postId, userAccount, sort, name, personInfo, profile, images, youtube, contact, date);

  const personInfoCopy = escapeQuotes(personInfo || '');
  const profileCopy = escapeQuotes(profile || '');
  const imagesCopy = escapeQuotes(images || '');
  const youtubeCopy = escapeQuotes(youtube || '');
  const contactCopy = escapeQuotes(contact || '');

  ministerdb.query(`
    UPDATE ministerMain SET 
    userAccount = '${userAccount}',
    sort = '${sort}',
    name = '${name}', 
    personInfo = '${personInfoCopy}',
    profile = '${profileCopy}',
    images = '${imagesCopy}',
    youtube = '${youtubeCopy}',
    contact = '${contactCopy}',
    date = '${date}'
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



module.exports = router;
