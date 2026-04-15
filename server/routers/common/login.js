const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { commondb } = require('../dbdatas/commondb');
const { navermail } = require('../common/naver_mail');
const axios = require('axios');
var jwt = require("jsonwebtoken");
const secretKey = require('../../secretKey');
const argon2 = require('argon2');
const nodemailer = require('nodemailer');


// 카카오 & 네이버 홈페이지 로그인에서 토큰 요청시 발행 함수
router.post('/loginsnstoken', async (req, res) => {
  
  const { sort, client_id, code, redirect_uri, secret, state } = req.body;
  
  if (sort === 'kakao') {
    const apiURL = "https://kauth.kakao.com/oauth/token";
    await axios({
      method: 'POST', url: apiURL,
      headers: {  "Content-Type": "application/x-www-form-urlencoded" },
      params: {
        grant_type: "authorization_code",
        client_id: client_id,
        redirect_uri: redirect_uri,
        code: code,
      }
    })
    .then((resdata) => {
      res.send(resdata.data.access_token);
      res.end();
    }).catch((err) => {
      res.send(err);
      res.end();
    });
  } else {
    const api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${secret}&code=${code}&state=${state}`;
    axios
      .get(api_url, {
        headers: {
          'X-Naver-Client-Id': client_id,
          'X-Naver-Client-Secret': secret
        }
      })
      .then((resdata) => {
        res.send(resdata.data.access_token);
        res.end();
      }).catch((err) => {
        res.send(err);
        res.end();
      });
  }
  
})

// 카카오 & 네이버 로그인 로직
router.post('/login', async (req, res) => {
  var { url, AccessToken } = req.body;

  try {
    const apiURL = url.includes('kakao') ?
      'https://kapi.kakao.com/v2/user/me' :
      'https://openapi.naver.com/v1/nid/me';

    const result = await axios({
      method: 'GET', url: apiURL,
      headers: { Authorization: `Bearer ${AccessToken}` }
    });

    const userEmail = url.includes('kakao') ? result.data.kakao_account.email : result.data.response.email;
    const userName = url.includes('kakao') ? result.data.kakao_account.name : result.data.response.name;
    const SECRET_KEY = secretKey.key;
    const userURL = url.includes('kakao') ? 'kakao' : 'naver';

    // refreshToken 만들기
    const refreshToken = jwt.sign({ type: 'JWT', USER_ID: userEmail }, SECRET_KEY, {
      expiresIn: '30d',
      issuer: 'churchbooklet'
    });

    // 회원인지 파악하기
    commondb.query(`SELECT * FROM user WHERE userAccount = '${userEmail}';
    `, function(error, result){
      if (error) {throw error}
      if (result.length === 0) {  
        const userData = {}
        userData.email = userEmail;
        userData.name = userName;
        userData.userURL = userURL;
        userData.refreshToken = refreshToken;
        userData.isUser = false;
        res.json(userData);
        res.end();
      } else {
        var json = JSON.stringify(result[0]);
        const userData = JSON.parse(json);
        userData.refreshToken = refreshToken;
        userData.isUser = true;
        if ( userData.userURL === userURL ) {
          res.json(userData);
          res.end();
        } else {
          commondb.query(
            `UPDATE user SET userURL = '${userURL}' WHERE userAccount = '${userData.userAccount}'`
          );
          userData.userURL = userURL
          res.json(userData);
          res.end();
        }
    }})
  } catch (error) {
    res.status(500).json({ error: '카카오 & 네이버 로그인 에러' });
  }
});

// 애플 로그인
router.post('/loginsocial/apple', async (req, res) => {
  
  const { userInfo } = req.body;
  const { userFullName } = req.body;

  const userEmail = userInfo.email;
  const familyName = userFullName.familyName;
  const givenName = userFullName.givenName;
  
  try {
    const userName = `${familyName}${givenName}`;
    const SECRET_KEY = secretKey.key;
    const userURL = 'apple';

    // refreshToken 만들기
    const refreshToken = jwt.sign({ type: 'JWT', USER_ID: userEmail }, SECRET_KEY, {
      expiresIn: '30d',
      issuer: 'churchbooklet'
    });

    // 회원인지 파악하기
    commondb.query(`SELECT * FROM user WHERE userAccount = '${userEmail}';
    `, function(error, result){
      if (error) {throw error}
      if (result.length === 0) {  
        const userData = {}
        userData.email = userEmail;
        userData.name = userName;
        userData.userURL = userURL;
        userData.refreshToken = refreshToken;
        userData.isUser = false;
        res.json(userData);
        res.end();

      } else {

        var json = JSON.stringify(result[0]);
        const userData = JSON.parse(json);
        userData.refreshToken = refreshToken;
        userData.isUser = true;

        if ( userData.userURL === userURL ) {
          res.json(userData);
          res.end();
        } else {
          commondb.query(
            `UPDATE user SET userURL = '${userURL}' WHERE userAccount = '${userData.userAccount}'`
          );
          userData.userURL = userURL
          res.json(userData);
          res.end();
        }
    }})
  } catch (error) {
    res.status(500).json({ error: '애플 로그인 에러' });
  }
});


// 구글 로그인
router.post('/loginsocial/google', async (req, res) => {

  const { user } = req.body;

  try {
    const userEmail = user.email;
    const userURL = 'google';
    const SECRET_KEY = secretKey.key;

    // refreshToken 만들기
    const refreshToken = jwt.sign({ type: 'JWT', USER_ID: userEmail }, SECRET_KEY, {
      expiresIn: '30d',
      issuer: 'churchbooklet'
    });

    // 회원인지 파악하기
    commondb.query(`SELECT * FROM user WHERE userAccount = '${userEmail}';
    `, function(error, result){
      if (error) {throw error}
      if (result.length === 0) {  
        const userData = {}
        userData.email = userEmail;
        userData.userURL = userURL;
        userData.refreshToken = refreshToken;
        userData.isUser = false;
        res.json(userData);
        res.end();
      } else {
        var json = JSON.stringify(result[0]);
        const userData = JSON.parse(json);
        userData.refreshToken = refreshToken;
        userData.isUser = true;

        if ( userData.userURL === userURL ) {
          res.json(userData);
          res.end();
        } else {
          commondb.query(
            `UPDATE user SET userURL = '${userURL}' WHERE userAccount = '${userData.userAccount}'`
          );
          userData.userURL = userURL
          res.json(userData);
          res.end();
        }
    }})
  } catch (error) {
    res.status(500).json({ error: '구글 로그인 에러' });
  }
});


// 이메일 로그인
router.post('/loginemail', async (req, res) => {
  const { loginAccount, loginPasswd, userURL } = req.body;
  const resultData = {};
  const SECRET_KEY = secretKey.key;
  // refreshToken 만들기
  const refreshToken = jwt.sign({ type: 'JWT', USER_ID: loginAccount }, SECRET_KEY, {
    expiresIn: '30d',
    issuer: 'churchbooklet'
  });
  try {
    commondb.query(`
      SELECT * FROM user WHERE userAccount = '${loginAccount}';
      `, async function(error, result){
      if (error) {throw error}
      if (result.length === 0) {  
        resultData.isUser = false;
        resultData.which = 'email'
        res.json(resultData);
        res.end();
      } else {
        var json = JSON.stringify(result[0]);
        const userData = JSON.parse(json);
        try {
          if (await argon2.verify(userData.password, loginPasswd)) {
            if ( userData.userURL === userURL ) {
              userData.isUser = true;
              userData.refreshToken = refreshToken;
              res.json(userData);
              res.end();
            } else {
              commondb.query(
                `UPDATE user SET userURL = '${userURL}' WHERE userAccount = '${userData.userAccount}'`
              );
              userData.isUser = true;
              userData.refreshToken = refreshToken;
              userData.userURL = userURL;
              res.json(userData);
              res.end();
            }
          } else {
            resultData.success = false;
            resultData.which = 'passwd'
            res.json(resultData);
            res.end();
          }
        } catch (err) {
          throw err
        }
      }   
    });
  } catch (error) {
    console.error(error);
    res.send(false);
    res.end();
  }
});


// 토큰 검증하기
router.post('/verifytoken', (req,res)=>{
  const token = req.body.verifyToken;
  const copy = jwt.decode(token);
  const userAccount = copy.USER_ID;
  const SECRET_KEY = secretKey.key;
  const userData = {}
  jwt.verify(token, SECRET_KEY, (error, decoded)=>{
    // torken기한이 만료되었을때
    if(error) {
      if(error.name === 'TokenExpiredError'){
        // user찾아보기
        commondb.query(`SELECT * FROM user WHERE userAccount = '${userAccount}';
        `,function(error, result){
          if (error) {throw error}
          if (result.length === 0) {  
            userData.isRightToken = false;
            userData.isUser = false;
            res.send(userData);
            res.end();
          } else {
            // 다시 발급해주기
            var refreshToken = jwt.sign({type: 'JWT', USER_ID : userAccount}, SECRET_KEY, {
              expiresIn: '30d', issuer: 'churchbooklet'
            });
            userData.resultData = result[0];
            userData.refreshToken = refreshToken;
            userData.isRightToken = false;
            userData.isUser = true;
            res.json(userData);
            res.end();
        }})
      };  
    } else if (decoded.USER_ID === userAccount) {
      commondb.query(`SELECT * FROM user WHERE userAccount = '${userAccount}';
        `,function(error, result){
          if (error) {throw error}
          if (result.length === 0) {  
            userData.isRightToken = false;
            userData.isUser = false;
            res.send(userData);
            res.end();
          } else {
            userData.resultData = result[0];
            userData.isUser = true;
            userData.isRightToken = true;
            res.send(userData);
            res.end();
        }})
    }
  })
 
}) 


// logister 회원 가입하기
router.post('/logisterdo', async function(req, res, next){
  const { email, password, userNickname, userChurch, userSort, userDetail, userURL,
          checkUsingPolicy, checkPersonalInfo, checkContentsRestrict, checkInfoToOthers, checkServiceNotifi } = req.body.userData;
  
  const hashedtext = await argon2.hash(password);
  commondb.query(`
    INSERT IGNORE INTO user (userAccount, password, userNickName, userChurch, userSort, userDetail, userURL, 
      checkUsingPolicy, checkPersonalInfo, checkContentsRestrict, checkInfoToOthers, checkServiceNotifi) VALUES 
    ('${email}', '${hashedtext}', '${userNickname}', '${userChurch}', '${userSort}', '${userDetail}', '${userURL}',
    '${checkUsingPolicy}', '${checkPersonalInfo}', '${checkContentsRestrict}', '${checkInfoToOthers}', '${checkServiceNotifi}');
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {  
      res.send(email);
      res.end();
    } else {
      res.send("");  
      res.end();
    }})
});

// 이메일 계정 중복 체크
router.get('/logincheckaccount/:account', (req, res) => {
  var userAccount = req.params.account;
  commondb.query(`
  SELECT * FROM user WHERE userAccount = '${userAccount}';
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

// 이메일 인증하기
router.post('/loginaccountauth', async function(req, res){
  const { email } = req.body;
  
  const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

  if (!emailRule.test(email)){
    res.send(false);  
    res.end();
  } else {
    const transporter = nodemailer.createTransport({
      service: 'naver',
      host: 'smtp.naver.com',  // SMTP 서버명
      port: 587,  // SMTP 포트
      auth: {
          user: navermail.NAVER_USER,  // 네이버 아이디
          pass: navermail.NAVER_PASS,  // 발급하여 저장한 비밀 번호
      },
    });
  
    const random_code = Math.floor(Math.random() * 1000000)// 6자기 인증코드 랜덤 추출
    const SECRET_KEY = secretKey.key;
    // refreshToken 만들기
    const refreshTokenCopy = jwt.sign({ type: 'JWT', USER_ID: email }, SECRET_KEY, {
      expiresIn: '30d',
      issuer: 'churchbooklet'
    });
    const resultData = {num : random_code, refreshToken : refreshTokenCopy};

    await transporter.sendMail({
      from: 'yeplat@naver.com',//인증코드 발급자 이메일 
      to: email,// 인증코드 받을 이메일 주소
      subject: '[사역자모아] 인증코드 안내',
      html: `
          <html lang="kr">
          <body>
              <div>
                  <div style="margin-top: 30px;">
                    <p style="font-size: 16px; color: #333;"> 이메일 인증코드를 발급해드립니다.</p>
                    <p style="font-size: 16px; color: #333;">인증코드를 확인해주세요.</p>
                    <h3 style="font-size: 22px;">${random_code}</h3>
                    <p style="font-size: 16px; color: #333;"> 위 인증코드를 입력해주세요.</p>
                  </div>
              </div>
          </body>
          </html>
      `
    })
    res.json(resultData);
    res.end();
  }
});


// 비밀번호 찾기 및 변경
router.post('/changepassword', async function(req, res){
  const { email, userNickname } = req.body;
  const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

  commondb.query(`
    SELECT * FROM user WHERE userAccount = '${email}' AND userNickname = '${userNickname}';
    `, async function(error, result){
    if (error) {throw error}
    if (result.length > 0) {

      if (!emailRule.test(email)){
        res.send(false);  
        res.end();
      } else {
        const transporter = nodemailer.createTransport({
          service: 'naver',
          host: 'smtp.naver.com',  // SMTP 서버명
          port: 465,  // SMTP 포트
          auth: {
              user: navermail.NAVER_USER,  // 네이버 아이디
              pass: navermail.NAVER_PASS,  // 발급하여 저장한 비밀 번호
          },
        });
      
        let resultramdom = '';
        const characters = 'abcdefghijklmnopqrstuvwxyz1234567890';
        for (let i = 0; i < 8; i++) {
            resultramdom += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    
        await transporter.sendMail({
          from: 'yeplat@naver.com',//인증코드 발급자 이메일 
          to: email,// 인증코드 받을 이메일 주소
          subject: '[사역자모아] 비밀번호 변경 안내',
          html: `
              <html lang="kr">
              <body>
                  <div>
                      <div style="margin-top: 30px;">
                        <p style="font-size: 16px; color: #333;">변경된 비밀번호를 발급해드립니다.</p>
                        <p style="font-size: 16px; color: #333;">소문자or숫자 랜덤으로 8자리입니다.</p>
                        <h3 style="font-size: 22px;">${resultramdom}</h3>
                        <p style="font-size: 16px; color: #333;"> 위 번호를 로그인해주세요.</p>
                      </div>
                  </div>
              </body>
              </html>
          `
        })
        const hashedtext = await argon2.hash(resultramdom);
        commondb.query(`
          UPDATE user SET password = '${hashedtext}' WHERE userAccount = '${email}' AND userName = '${userName}';
          `,function(error, result){
          if (error) {throw error}
          if (result.affectedRows > 0) {            
            res.send(true);
            res.end();
          } else {
            res.send(false);  
            res.end();
          }})
      }

    } else {
      res.send(false);  
      res.end();
    }})
});


// 회원 정보 삭제
router.post('/deleteaccount', function(req, res, next){
  const { userAccount, userNickname } = req.body;
  commondb.query(`
  DELETE FROM user WHERE userAccount = '${userAccount}' and userNickname = '${userNickname}';
  `,function(error, result){
  if (error) {throw error}
  if (result.affectedRows > 0) {  
    res.send(true);
    res.end();
  } else {
    res.send("");  
    res.end();
  }})
});


// 관리자 로그인
router.post('/loginadmin', function(req, res){
  const { username, password } = req.body;
  if (username === 'johnleedev' && password === 'gksksla0303!') {
    res.send(true);
    res.end();
  } else {
    res.send(false);
    res.end();
  }
});

module.exports = router;