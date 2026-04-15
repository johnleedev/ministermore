const express = require('express');
const router = express.Router()
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { commondb } = require('../dbdatas/commondb');
const { recruitdb } = require('../dbdatas/recruitdb');
const multer  = require('multer')
var fs = require("fs");
const argon2 = require('argon2');
var cors = require('cors');
router.use(cors());
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));


// 프로필 데이터 가져오기 ////
router.get('/getprofile/:user', (req, res) => {
  var userAccount = req.params.user;
  commondb.query(`
  select grade, userAccount, userNickName, userSort, userDetail, userURL from user WHERE userAccount = '${userAccount}';
  `, function(error, result){
  if (error) {throw error}
  if (result.length > 0) {
      res.send(result);
      res.end();
  } else {
      res.send(error);  
      res.end();
  }})
});

// 프로필 정보 변경
router.post('/changeprofile', (req, res) => {
  const { userAccount, userNickName, userSort, userDetail } = req.body;
  commondb.query(`
  UPDATE user SET 
  userNickName = '${userNickName}', 
  userSort = '${userSort}', 
  userDetail = '${userDetail}'
  WHERE userAccount = '${userAccount}'
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



// 비밀번호 변경하기
router.post('/profilechangepassword', async (req, res) => {
  const { userAccount, userNickName, passwordCurrent, passwordChange } = req.body;
  commondb.query(`
    SELECT * FROM user WHERE userAccount = '${userAccount}' AND userNickName = '${userNickName}';
    `, async function(error, result){
    if (error) {throw error}
    if (result.length === 0) {  
      res.send('해당 계정이 없습니다.');
      res.end();
    } else {
      var json = JSON.stringify(result[0]);
      const userData = JSON.parse(json);
      try {
        if (await argon2.verify(userData.password, passwordCurrent)) {
          const hashedtext = await argon2.hash(passwordChange);
          commondb.query(`
            UPDATE user SET password = '${hashedtext}' WHERE userAccount = '${userData.userAccount}'
            `,function(error, result){
          if (error) {throw error}
          if (result.affectedRows > 0) {            
            res.send(true);
            res.end();
          } else {
            res.send('다시 시도해주세요.');  
            res.end();
          }})
        } else {
          res.send('현재 비밀번호가 올바르지 않습니다.');  
          res.end();
        }
      } catch (err) {
        throw err
      }
    }   
  });
});


// 프로필 계정 삭제
router.post('/deleteaccount', (req, res) => {
  const { userAccount, userNickName, userSort, userDetail } = req.body;
  commondb.query(`
    DELETE FROM user WHERE userAccount = '${userAccount}'
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

// 사용자가 작성한 채용글 가져오기
router.get('/getuserposts/:userAccount', (req, res) => {
  var userAccount = req.params.userAccount;
  
  // recruitMinister, recruitChurch, recruitInstitute 세 테이블에서 모두 조회
  const query = `
    SELECT id, title, writer, date, church,
    religiousbody, location, sort, recruitNum, customInput, 'minister' as tableType
    FROM recruitMinister 
    WHERE userAccount = ?
    UNION ALL
    SELECT id, title, writer, date, church,
    religiousbody, location, sort, recruitNum, customInput, 'church' as tableType
    FROM recruitChurch 
    WHERE userAccount = ?
    UNION ALL
    SELECT id, title, writer, date, church,
    religiousbody, location, sort, recruitNum, customInput, 'institute' as tableType
    FROM recruitInstitute 
    WHERE userAccount = ?
    ORDER BY id DESC
  `;
  
  recruitdb.query(query, [userAccount, userAccount, userAccount], function(error, result){
    if (error) {
      console.error('getuserposts error:', error);
      return res.status(500).send([]);
    }
    if (result.length > 0) {
      res.send(result);
      res.end();
    } else {
      res.send([]);  
      res.end();
    }
  })
});

// 사용자가 작성한 글 수정하기
router.get('/getuserpostrevise/:id', (req, res) => {
  var id = req.params.id;
  const tableType = req.query.tableType || 'minister'; // 기본값은 'minister'
  
  // tableType에 따라 적절한 테이블 선택
  let tableName;
  if (tableType === 'church') {
    tableName = 'recruitChurch';
  } else if (tableType === 'institute') {
    tableName = 'recruitInstitute';
  } else {
    // 'minister' 또는 기본값
    tableName = 'recruitMinister';
  }
  
  recruitdb.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id], function(error, result){
    if (error) {
      console.error('getuserpostrevise error:', error);
      return res.status(500).send([]);
    }
    if (result.length > 0) {
      res.send(result);
      res.end();
    } else {
      res.send([]);  
      res.end();
    }
  })
});

// 사용자가 작성한 글 삭제하기
router.post('/deletepost', (req, res) => {
  const { postId, userAccount, tableType } = req.body;
  
  // tableType에 따라 적절한 테이블에서 삭제
  let tableName;
  if (tableType === 'church') {
    tableName = 'recruitChurch';
  } else if (tableType === 'institute') {
    tableName = 'recruitInstitute';
  } else {
    // 'minister' 또는 기본값
    tableName = 'recruitMinister';
  }
  
  recruitdb.query(`DELETE FROM ${tableName} WHERE id = ? AND userAccount = ?`, [postId, userAccount], function(error, result){
    if (error) {
      console.error('deletepost error:', error);
      return res.status(500).send(false);
    }
    if (result.affectedRows > 0) {
      res.send(true);
      res.end();
    } else {
      res.send(false);
      res.end();
    }
  })
});

module.exports = router;
