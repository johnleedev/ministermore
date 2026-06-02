const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { recruitdb } = require('../dbdatas/recruitdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");
const axios = require('axios');

const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');

// 네이버 지오코딩 API 설정
const NAVER_CLIENT_ID = 'lk228kw5ry'; // 실제 클라이언트 ID로 변경 필요
const NAVER_CLIENT_SECRET = 'bWtDkaiNg8Vf27V8pyHPnlyrxGPnK0X245C9UlWM'; // 실제 클라이언트 시크릿으로 변경 필요

// 주소를 좌표로 변환하는 함수
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.apigw.ntruss.com/map-geocode/v2/geocode', {
      params: {
        query: address
      },
      headers: {
        'x-ncp-apigw-api-key-id': NAVER_CLIENT_ID,
        'x-ncp-apigw-api-key': NAVER_CLIENT_SECRET,
        'Accept': 'application/json'
      }
    });
   
    if (response.data && response.data.addresses && response.data.addresses.length > 0) {
      const addressInfo = response.data.addresses[0];
      return {
        latitude: parseFloat(addressInfo.y),
        longitude: parseFloat(addressInfo.x),
        address: addressInfo.roadAddress || addressInfo.jibunAddress
      };
    }
    return null;
  } catch (error) {
    console.error('지오코딩 API 오류:', error);
    return null;
  }
};


// 주소를 좌표로 변환하는 API 엔드포인트
router.post('/geocode', async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: '주소가 필요합니다.' });
  }
  
  try {
    const coordinates = await geocodeAddress(address);
    console.log('coordinates', coordinates);
    if (coordinates) {
      res.json({
        success: true,
        coordinates: coordinates
      });
    } else {
      res.json({
        success: false,
        error: '주소를 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('지오코딩 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});




router.get('/getrecruitformain', async (req, res) => {
  const dataQuery = `
    SELECT * FROM recruitMinister
    ORDER BY id DESC
    LIMIT 20;
  `;

  try {
    const dataResult = await new Promise((resolve, reject) => {
      recruitdb.query(dataQuery, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    res.send({ resultData: dataResult });
  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});

router.get('/getrecruitdata/:page', async (req, res) => {
  var page = parseInt(req.params.page) || 1;
  var pageSize = 10;
  var offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT * FROM recruitMinister
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount FROM recruitMinister;
  `;


  try {
    const [dataResult, countResult] = await Promise.all([
    new Promise((resolve, reject) => {
      recruitdb.query(dataQuery, [pageSize, offset], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      recruitdb.query(countQuery, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    })
  ]);

    const totalCount = countResult[0].totalCount;

    res.send({
      resultData: dataResult.length > 0 ? dataResult : false,
      totalCount: totalCount
    });

  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});



// 특정 장소 데이터 보내기
router.post('/getrecruitdatapart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM recruitMinister WHERE id = '${id}';
  `;
  recruitdb.query(query, function (error, result) {
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
    done(null, 'build/images/recruit/churchlogo');
  }, 
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const upload_default = multer({ storage });

// 이미지 업로드 미들웨어를 조건부로 실행
const conditionalUpload = (req, res, next) => {
  if (req.query.churchLogo) {
    upload_default.array('img')(req, res, next);
  } else {
    next();
  }
};

// 게시글 생성하기
router.post('/postsrecruit', conditionalUpload, (req, res) => {
  const {
    postID,
    userAccount,
    saveDate,
    saveUser,
    source,
    title,
    writer,
    date,
    link,
    church,
    religiousbody,
    location,
    locationDetail,
    address,
    mainpastor,
    homepage,
    churchLogo,
    school,
    career,
    sort,
    part,
    partDetail,
    recruitNum,
    workday,
    workTimeSunDay,
    workTimeWeek,
    dawnPray,
    pay,
    welfare,
    insurance,
    severance,
    applydoc,
    applyhow,
    applytime,
    etcNotice,
    inquiry,
    customInput
  } = req.query;

  if (postID) {
    recruitdb.query(
      `UPDATE recruitDataPre SET 
      isSave = 'true',
      saveDate = '${saveDate}', 
      saveUser = '${saveUser}' 
      WHERE id = '${postID}'`
    );
  }

  // const schoolCopy = escapeQuotes(school);
  // const careerCopy = escapeQuotes(career);
  // const partCopy = escapeQuotes(part);
  // const partDetailCopy = escapeQuotes(partDetail);
  // const workdayCopy = escapeQuotes(workday);
  // const workTimeSunDayCopy = escapeQuotes(workTimeSunDay);
  // const workTimeWeekCopy = escapeQuotes(workTimeWeek);
  // const dawnPrayCopy = escapeQuotes(dawnPray);
  // const payCopy = escapeQuotes(pay);
  // const welfareCopy = escapeQuotes(welfare);
  // const insuranceCopy = escapeQuotes(insurance);
  // const severanceCopy = escapeQuotes(severance);
  // const applydocCopy = escapeQuotes(applydoc);
  // const applytimeCopy = escapeQuotes(applytime);

  // recruitMinister 테이블에 맞게 값 매핑
  const insertQuery = `
    INSERT INTO recruitMinister (
      userAccount, source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainPastor, homepage,
      school, career, sort, part, partDetail, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, pay,
      welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, churchLogo, customInput
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userAccount,
    source,
    title,
    writer,
    date,
    link,
    church,
    religiousbody,
    location,
    locationDetail,
    address,
    mainpastor,
    homepage,
    school,
    career,
    sort,
    part,
    partDetail,
    recruitNum,
    workday,
    workTimeSunDay,
    workTimeWeek,
    dawnPray,
    pay,
    welfare,
    insurance,
    severance,
    applydoc,
    applyhow,
    applytime,
    etcNotice,
    inquiry,
    churchLogo,
    customInput
  ];

  recruitdb.query(insertQuery, values, (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, error: 'Database insert failed' });
    }
    res.send({ success: true });
  });
});






// 검색하기
router.post('/recruitsearchlist', async (req, res) => {
  const { sort = [], location = [], religiousbody = [] } = req.body;

  // 디버깅: 검색 요청 데이터 확인
  console.log('검색 요청 데이터:', { sort, location, religiousbody });
  
  // 디버깅: 강원 관련 데이터 확인
  if (location.includes('강원')) {
    console.log('강원 검색 요청됨:', location);
    recruitdb.query('SELECT DISTINCT location FROM recruitMinister WHERE location LIKE "%강원%"', (err, result) => {
      if (!err) {
        console.log('강원 관련 지역 데이터:', result);
      }
    });
  }

  let whereClauses = [];
  let params = [];

  if (sort.length > 0) {
    // sort 배열의 각 값에 대해 LIKE 조건 생성
    const sortLikes = sort.map(() => `sort LIKE ?`).join(' OR ');
    whereClauses.push(`(${sortLikes})`);
    params.push(...sort.map(s => `%${s}%`));
  }
  if (location.length > 0) {
    // location 배열의 각 값에 대해 LIKE 조건 생성 (포함 검색)
    const locationLikes = location.map(() => `location LIKE ?`).join(' OR ');
    whereClauses.push(`(${locationLikes})`);
    params.push(...location.map(loc => `%${loc}%`));
  }
  if (religiousbody.length > 0) {
    whereClauses.push(`religiousbody IN (${religiousbody.map(() => '?').join(',')})`);
    params.push(...religiousbody);
  }

  const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const query = `SELECT * FROM recruitMinister ${whereSQL};`;
  
  // 디버깅: 실제 실행되는 쿼리 확인
  console.log('실행되는 쿼리:', query);
  console.log('쿼리 파라미터:', params);

  recruitdb.query(query, params, function(error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length > 0) {
      res.json({
        totalCount: result.length,
        resultData: result
      });
    } else {
      res.json({
        totalCount: 0,
        resultData: false
      });
    }
  });
});

// 통합 검색 API (검색어 + 필터)
router.post('/recruitsearchunified', async (req, res) => {
  const { searchWord = '', sort = [], location = [], religiousbody = [] } = req.body;

  let whereClauses = [];
  let params = [];

  // 검색어 조건 추가 (교회명과 제목만)
  if (searchWord.trim()) {
    whereClauses.push(`(
      church LIKE ? OR 
      title LIKE ?
    )`);
    const searchPattern = `%${searchWord}%`;
    params.push(searchPattern, searchPattern);
  }

  if (sort.length > 0) {
    // sort 배열의 각 값에 대해 LIKE 조건 생성
    const sortLikes = sort.map(() => `sort LIKE ?`).join(' OR ');
    whereClauses.push(`(${sortLikes})`);
    params.push(...sort.map(s => `%${s}%`));
  }
  if (location.length > 0) {
    // location 배열의 각 값에 대해 LIKE 조건 생성 (포함 검색)
    const locationLikes = location.map(() => `location LIKE ?`).join(' OR ');
    whereClauses.push(`(${locationLikes})`);
    params.push(...location.map(loc => `%${loc}%`));
  }
  if (religiousbody.length > 0) {
    whereClauses.push(`religiousbody IN (${religiousbody.map(() => '?').join(',')})`);
    params.push(...religiousbody);
  }

  const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const query = `SELECT * FROM recruitMinister ${whereSQL};`;

    recruitdb.query(query, params, function(error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length > 0) {
      res.json({
        totalCount: result.length,
        resultData: result
      });
    } else {
      res.json({
        totalCount: 0,
        resultData: false
      });
    }
  });
});

// 게시글 수정
router.post('/reviserecruit', (req, res) => {
  const {
    postID,
    userAccount,
    title,
    writer,
    date,
    church,
    religiousbody,
    location,
    locationDetail,
    address,
    mainpastor,
    homepage,
    sort,
    part,
    partDetail,
    school,
    career,
    recruitNum,
    workday,
    workTimeSunDay,
    workTimeWeek,
    dawnPray,
    pay,
    welfare,
    insurance,
    severance,
    applydoc,
    applyhow,
    applytime,
    etcNotice,
    inquiry,
    customInput
  } = req.body;

  const updateQuery = `
    UPDATE recruitMinister SET 
      title = ?, writer = ?, date = ?, church = ?, religiousbody = ?, 
      location = ?, locationDetail = ?, address = ?, mainPastor = ?, homepage = ?,
      sort = ?, part = ?, partDetail = ?, school = ?, career = ?, recruitNum = ?,
      workday = ?, workTimeSunDay = ?, workTimeWeek = ?, dawnPray = ?, pay = ?,
      welfare = ?, insurance = ?, severance = ?, applydoc = ?, applyhow = ?,
      applytime = ?, etcNotice = ?, inquiry = ?, customInput = ?
    WHERE id = ? AND userAccount = ?
  `;

  const values = [
    title, writer, date, church, religiousbody, location, locationDetail, address, mainpastor, homepage,
    sort, part, partDetail, school, career, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, pay,
    welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, customInput,
    postID, userAccount
  ];

  recruitdb.query(updateQuery, values, (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, error: 'Database update failed' });
    }
    if (result.affectedRows > 0) {
      res.send({ success: true });
    } else {
      res.send({ success: false, error: 'No rows updated' });
    }
  });
});

// 게시글 삭제
router.post('/deleterecruit', (req, res) => {
  const { postId, userAccount } = req.body;
  
  recruitdb.query(`
    DELETE FROM recruitMinister 
    WHERE id = ? AND userAccount = ?
  `, [postId, userAccount], function(error, result) {
    if (error) {
      console.error(error);
      return res.status(500).send(false);
    }
    if (result.affectedRows > 0) {
      res.send(true);
    } else {
      res.send(false);
    }
  });
});




module.exports = router;
