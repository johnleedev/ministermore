const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json({ limit: '50mb' })); // 제한 크기 증가
const { recruitdb } = require('../dbdatas/recruitdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json({ limit: '50mb' })); // 제한 크기 증가
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // 제한 크기 증가
const multer  = require('multer')
var fs = require("fs");
const nodemailer = require('nodemailer');
const { navermail } = require('../common/naver_mail');
const crypto = require('crypto');

const EMAIL_ACTION_SECRET = process.env.EMAIL_ACTION_SECRET || navermail.NAVER_PASS;
const EMAIL_ACTION_BASE_URL = process.env.EMAIL_ACTION_BASE_URL || 'https://ministermore.co.kr/recruitwork';
const EMAIL_ACTION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const createEmailActionToken = (action, payload) => {
  const data = {
    action,
    payload,
    ts: Date.now(),
  };
  const json = JSON.stringify(data);
  const signature = crypto.createHmac('sha256', EMAIL_ACTION_SECRET).update(json).digest('hex');
  const combined = `${json}::${signature}`;
  return Buffer.from(combined).toString('base64');
};

const verifyEmailActionToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [json, signature] = decoded.split('::');
    if (!json || !signature) {
      return null;
    }
    const expected = crypto.createHmac('sha256', EMAIL_ACTION_SECRET).update(json).digest('hex');
    if (expected !== signature) {
      return null;
    }
    const data = JSON.parse(json);
    if (!data || !data.action || !data.ts) {
      return null;
    }
    if (Date.now() - data.ts > EMAIL_ACTION_TOKEN_TTL_MS) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('Email action token verification failed:', error);
    return null;
  }
};

const sendEmailActionResponse = (res, title, message) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 60px auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); padding: 40px; text-align: center; }
          h1 { color: #2c3e50; font-size: 24px; margin-bottom: 18px; }
          p { color: #555; font-size: 16px; line-height: 1.6; }
          a.button { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #4a90e2; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          <a class="button" href="https://ministermore.co.kr/">사역자모아 바로가기</a>
        </div>
      </body>
    </html>
  `);
};

const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');



router.get('/getrecruitdataall', async (req, res) => {
  const dataQuery = `
    SELECT * FROM recruitMinister
  `;

  recruitdb.query(dataQuery, (error, result) => {
    if (error) return res.status(500).send({ error: 'Database query failed' });
    if (result.length > 0) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});





// ----------------------------------------------------------------------------------------
router.get('/getrecruitpre/:page', async (req, res) => {
  var page = parseInt(req.params.page) || 1;
  var pageSize = 10;
  var offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT * FROM recruitDataPre
    WHERE customInput != '' AND (isSave IS NULL OR isSave != 'true')
    ORDER BY date ASC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount FROM recruitDataPre
    WHERE customInput != '' AND (isSave IS NULL OR isSave != 'true')
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
      resultData: dataResult.length > 0 ? dataResult : [],
      totalCount: totalCount
    });

  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});




router.get('/getrecruit/:page', async (req, res) => {
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
      resultData: dataResult.length > 0 ? dataResult : [],
      totalCount: totalCount
    });

  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});

// 이메일 검색 API 추가
router.post('/searchrecruitemail', async (req, res) => {
  const { searchWord } = req.body;
  
  if (!searchWord || !searchWord.trim()) {
    return res.status(400).send({ error: 'Search word is required' });
  }

  const searchQuery = `
    SELECT * FROM recruitMinister
    WHERE inquiry LIKE ?
    ORDER BY id DESC;
  `;

  try {
    recruitdb.query(searchQuery, [`%${searchWord}%`], (error, result) => {
      if (error) {
        console.error('Search error:', error);
        return res.status(500).send({ error: 'Database search failed' });
      }
      
      res.send({
        resultData: result.length > 0 ? result : [],
        totalCount: result.length
      });
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send({ error: 'Search failed' });
  }
});




router.get('/getrecruitcount', async (req, res) => {
  const dataQuery = `
    SELECT saveUser, LEFT(saveDate, 7) AS month, COUNT(*) as count
    FROM recruitMinister
    GROUP BY saveUser, month
    ORDER BY saveUser, month
  `;

  try {
    recruitdb.query(dataQuery, (error, result) => {
      if (error) return res.status(500).send({ error: 'Database query failed' });
      res.send(result);
    });
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});


// 게시글 등록
router.post('/postsrecruit', async (req, res) => {
  const {
    postID,
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
    customInput,
    email,
  } = req.body;

  try {
    // 중복 체크: 타이틀, 날짜, 교회이름이 모두 일치하는지 확인
    const duplicateCheckQuery = `
      SELECT COUNT(*) as count FROM recruitMinister 
      WHERE title = ? AND date = ? AND church = ?
    `;
    
    const duplicateResult = await new Promise((resolve, reject) => {
      recruitdb.query(duplicateCheckQuery, [title, date, church], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    if (duplicateResult[0].count > 0) {
      // 중복된 경우 에러 반환 (개별 저장에서는 알림)
      return res.status(400).send({ 
        success: false, 
        error: 'duplicate', 
        message: '이미 동일한 제목, 날짜, 교회명의 글이 존재합니다.' 
      });
    }

    if (postID) {
      recruitdb.query(
        `UPDATE recruitDataPre SET 
        isSave = 'true',
        saveDate = '${saveDate}', 
        saveUser = '${saveUser}' 
        WHERE id = '${postID}'`
      );
    }

    // recruitMinister 테이블에 맞게 값 매핑
    const insertQuery = `
      INSERT INTO recruitMinister (
        saveDate, saveUser, source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainPastor, homepage,
        school, career, sort, part, partDetail, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, pay,
        welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, customInput
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
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
    ];

    recruitdb.query(insertQuery, values, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ success: false, error: 'Database insert failed' });
      }
      res.send({ success: true });
    });
  } catch (error) {
    console.error('중복 체크 오류:', error);
    res.status(500).send({ success: false, error: 'Duplicate check failed' });
  }
});

// 교회 테이블에 저장
router.post('/postsrecruitchurch', async (req, res) => {
  const {
    postID,
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
  } = req.body;

  try {
    // 중복 체크: 타이틀, 날짜, 교회이름이 모두 일치하는지 확인
    const duplicateCheckQuery = `
      SELECT COUNT(*) as count FROM recruitChurch 
      WHERE title = ? AND date = ? AND church = ?
    `;
    
    const duplicateResult = await new Promise((resolve, reject) => {
      recruitdb.query(duplicateCheckQuery, [title, date, church], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    if (duplicateResult[0].count > 0) {
      return res.status(400).send({ 
        success: false, 
        error: 'duplicate', 
        message: '이미 동일한 제목, 날짜, 교회명의 글이 존재합니다.' 
      });
    }

    if (postID) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const saveDate = `${yyyy}-${mm}-${dd}`;
      const saveUser = userAccount || '';
      recruitdb.query(
        `UPDATE recruitDataPre SET 
        isSave = 'true',
        saveDate = ?, 
        saveUser = ? 
        WHERE id = ?`,
        [saveDate, saveUser, postID]
      );
    }

    // recruitChurch 테이블에 맞게 값 매핑
    const insertQuery = `
      INSERT INTO recruitChurch (
        userAccount, source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainPastor, homepage,
        school, career, sort, recruitNum,
        applydoc, applyhow, applytime, etcNotice, inquiry, churchLogo, customInput
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userAccount || '',
      source || '',
      title || '',
      writer || '',
      date || '',
      link || '',
      church || '',
      religiousbody || '',
      location || '',
      locationDetail || '',
      address || '',
      mainpastor || '',
      homepage || '',
      school || '',
      career || '',
      sort || '',
      recruitNum || '',
      applydoc || '',
      applyhow || '',
      applytime || '',
      etcNotice || '',
      inquiry || '',
      churchLogo || '',
      customInput || ''
    ];

    recruitdb.query(insertQuery, values, (error, result) => {
      if (error) {
        console.error('교회 테이블 INSERT 오류:', error);
        console.error('SQL 쿼리:', insertQuery);
        console.error('Values:', values);
        return res.status(500).send({ 
          success: false, 
          error: 'Database insert failed',
          message: error.message || '데이터베이스 저장에 실패했습니다.'
        });
      }
      res.send({ success: true });
    });
  } catch (error) {
    console.error('교회 저장 오류:', error);
    console.error('오류 스택:', error.stack);
    res.status(500).send({ 
      success: false, 
      error: 'Server error',
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 기관 테이블에 저장
router.post('/postsrecruitinstitute', async (req, res) => {
  const {
    postID,
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
  } = req.body;

  try {
    // 중복 체크: 타이틀, 날짜, 교회이름이 모두 일치하는지 확인
    const duplicateCheckQuery = `
      SELECT COUNT(*) as count FROM recruitInstitute 
      WHERE title = ? AND date = ? AND church = ?
    `;
    
    const duplicateResult = await new Promise((resolve, reject) => {
      recruitdb.query(duplicateCheckQuery, [title, date, church], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    if (duplicateResult[0].count > 0) {
      return res.status(400).send({ 
        success: false, 
        error: 'duplicate', 
        message: '이미 동일한 제목, 날짜, 교회명의 글이 존재합니다.' 
      });
    }

    if (postID) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const saveDate = `${yyyy}-${mm}-${dd}`;
      const saveUser = userAccount || '';
      recruitdb.query(
        `UPDATE recruitDataPre SET 
        isSave = 'true',
        saveDate = ?, 
        saveUser = ? 
        WHERE id = ?`,
        [saveDate, saveUser, postID]
      );
    }

    // recruitInstitute 테이블에 맞게 값 매핑
    const insertQuery = `
      INSERT INTO recruitInstitute (
        userAccount, source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainPastor, homepage,
        school, career, sort, recruitNum,
        applydoc, applyhow, applytime, etcNotice, inquiry, churchLogo, customInput
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userAccount || '',
      source || '',
      title || '',
      writer || '',
      date || '',
      link || '',
      church || '',
      religiousbody || '',
      location || '',
      locationDetail || '',
      address || '',
      mainpastor || '',
      homepage || '',
      school || '',
      career || '',
      sort || '',
      recruitNum || '',
      applydoc || '',
      applyhow || '',
      applytime || '',
      etcNotice || '',
      inquiry || '',
      churchLogo || '',
      customInput || ''
    ];

    recruitdb.query(insertQuery, values, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ success: false, error: 'Database insert failed' });
      }
      res.send({ success: true });
    });
  } catch (error) {
    console.error('기관 저장 오류:', error);
    res.status(500).send({ success: false, error: 'Server error' });
  }
});


// 게시글 수정
router.post('/reviserecruit', async (req, res) => {

  try {
    const {
      postID,
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
      customInput
    } = req.body;

    // 중복 체크: 타이틀과 날짜가 모두 일치하는 다른 글이 있는지 확인 (현재 수정 중인 글 제외)
    const duplicateCheckQuery = `
      SELECT COUNT(*) as count FROM recruitMinister 
      WHERE title = ? AND date = ? AND id != ?
    `;
    
    const duplicateResult = await new Promise((resolve, reject) => {
      recruitdb.query(duplicateCheckQuery, [title, date, postID], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    if (duplicateResult[0].count > 0) {
      // 중복된 경우 에러 반환
      return res.status(400).send({ 
        success: false, 
        error: 'duplicate', 
        message: '이미 동일한 제목과 날짜의 글이 존재합니다.' 
      });
    }

    recruitdb.query(
      `UPDATE recruitMinister SET 
       source = ?, title = ?, writer = ?, date = ?, link = ?, church = ?, religiousbody = ?, 
       location = ?, locationDetail = ?, address = ?, mainPastor = ?, homepage = ?, 
       school = ?, career = ?, sort = ?, part = ?, partDetail = ?, recruitNum = ?, 
       workday = ?, workTimeSunDay = ?, workTimeWeek = ?, dawnPray = ?, 
       pay = ?, welfare = ?, insurance = ?, severance = ?, 
       applydoc = ?, applyhow = ?, applytime = ?, etcNotice = ?, inquiry = ?, customInput = ?
       WHERE id = ?`,
      [source, title, writer, date, link, church, religiousbody, 
       location, locationDetail, address, mainpastor, homepage, 
       school, career, sort, part, partDetail, recruitNum, 
       workday, workTimeSunDay, workTimeWeek, dawnPray, 
       pay, welfare, insurance, severance, 
       applydoc, applyhow, applytime, etcNotice, inquiry, customInput, postID],
      function (error, result) {
        if (error) return res.status(500).send('Database Error');
        res.send({ success: true, result: result.affectedRows > 0 });
      }
    );
  } catch (err) {
    console.error('수정 중복 체크 오류:', err);
    res.status(500).send({ success: false, error: 'Duplicate check failed' });
  }
});



// 게시글 크롤링 저장
router.post('/registerrecruitpre', async (req, res) => {
  const {
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
    customInput
  } = req.body;

  const extractInquiryEmail = (inquiryData) => {
    if (!inquiryData) return null;

    const normalize = (value) => (typeof value === 'string' ? value.trim() : value);

    try {
      const parsed =
        typeof inquiryData === 'string'
          ? JSON.parse(inquiryData)
          : inquiryData;

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const email = normalize(item && item.email);
          if (email) return email;
        }
        return null;
      }

      if (parsed && typeof parsed === 'object') {
        const emailCandidates = [
          parsed.email,
          parsed.inquiryEmail,
          parsed.inquiryMail,
        ];
        for (const candidate of emailCandidates) {
          const email = normalize(candidate);
          if (email) return email;
        }
      }
    } catch (parseError) {
      console.warn('Inquiry email parse failed:', parseError);
    }

    return null;
  };

  const inquiryEmail = extractInquiryEmail(inquiry);

  const denySaveChurch = async () => {
    return new Promise((resolve, reject) => {
      recruitdb.query(
        `SELECT * FROM saveDenyList WHERE (church = ? OR email = ?)`,
        [church, inquiryEmail || null],
        (err, result) => {
          if (err) return reject(err);
          const exists = Array.isArray(result) && result.length > 0;
          resolve({
            exists,
            message: exists ? '거절 목록에 있음' : '거절 목록에 없음',
          });
        }
      );
    });
  };

  const checkExistsInRecruit = async () => {
    return new Promise((resolve, reject) => {
      recruitdb.query(
        `SELECT * FROM recruitDataPre WHERE title = ? AND church = ? AND writer = ?`,
        [title, church, writer],
        (err, result) => {
          if (err) return reject(err);
          const exists = Array.isArray(result) && result.length > 0;
          resolve({
            exists,
            message: exists ? '중복된 데이터 있음' : '중복된 데이터 없음',
          });
        }
      );
    });
  };

  const insertRecruitData = async () => {
    return new Promise((resolve, reject) => {
      recruitdb.query(
        `INSERT INTO recruitDataPre (
          source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainpastor, homepage, 
          school, career, sort, part, partDetail, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, 
          pay, welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, customInput
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainpastor, homepage, 
          school, career, sort, part, partDetail, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, 
          pay, welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, customInput],
        (error, result) => {
          if (error) return reject(error);
          resolve({
            inserted: result.affectedRows > 0,
            message: result.affectedRows > 0 ? null : '데이터가 저장되지 않았습니다.',
          });
        }
      );
    });
  };

  try {
    const denySave = await denySaveChurch();
    if (denySave.exists) {
      return res.send({ success: false, message: denySave.message });
    }

    const duplicateCheck = await checkExistsInRecruit();
    if (duplicateCheck.exists) {
      return res.send({ success: false, message: duplicateCheck.message });
    }

    if (customInput == '') {
      return res.send({ success: false, message: '상세내용이 없습니다.' });
    }    

    const { inserted, message: insertMessage } = await insertRecruitData();

    if (inserted) {
      return res.send({
        success: true,
        message: '저장이 완료되었습니다.',
        details: {
          denySave: denySave.message,
          duplicate: duplicateCheck.message,
        },
      });
    } else {
      return res.send({
        success: false,
        message: insertMessage || '저장에 실패했습니다.',
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      message: (err && err.message) || '서버 오류가 발생했습니다.',
    });
  }
});


// [추가] 작업중 상태 저장 API
router.post('/setrecruitediting', async (req, res) => {
  const { postID, editingUser, editingAt } = req.body;
  if (!postID || !editingUser) {
    return res.status(400).json({ success: false, message: 'postID and editingUser required' });
  }
  // editingAt은 현재 시간으로 저장

  recruitdb.query(
    `UPDATE recruitDataPre SET editingUser = ?, editingAt = ? WHERE id = ?`,
    [editingUser, editingAt, postID],
    (error2, result2) => {
      if (error2) {
        console.error(error2);
        return res.status(500).json({ success: false, message: 'DB error (set one)' });
      }
      res.json({ success: true });
    }
  );
});

// [추가] 작업중 상태 초기화 API
router.post('/clearrecruitediting', async (req, res) => {
  const { postID } = req.body;
  if (!postID) {
    return res.status(400).json({ success: false, message: 'postID required' });
  }

  recruitdb.query(
    `UPDATE recruitDataPre SET editingUser = '', editingAt = NULL WHERE id = ?`,
    [postID],
    (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'DB error (clear editing)' });
      }
      res.json({ success: true });
    }
  );
});


// [추가] 작업중 상태 저장 API
router.get('/getsavedenylist', async (req, res) => {
  recruitdb.query(
    `SELECT * FROM saveDenyList`,
    (error, result) => {
      if (error) return res.status(500).send({ error: 'Database query failed' });
      res.send({ resultData: result });
    }
  );
});


// [수정] 임시저장글 일괄 저장: recruitMinister에 insert, recruitDataPre에는 isSave/saveDate/saveUser만 update
router.post('/bulkupdaterecruitpre', async (req, res) => {
  const { list } = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ success: false, message: 'list required' });
  }
  try {
    const results = [];
    const duplicates = [];
    
    for (const item of list) {
      try {
        // 중복 체크: 타이틀, 날짜, 교회이름이 모두 일치하는지 확인
        const duplicateCheckQuery = `
          SELECT COUNT(*) as count FROM recruitMinister 
          WHERE title = ? AND date = ? AND church = ?
        `;
        
        const duplicateResult = await new Promise((resolve, reject) => {
          recruitdb.query(duplicateCheckQuery, [item.title, item.date, item.church], (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
        });

        if (duplicateResult[0].count > 0) {
          // 중복된 항목은 그냥 건너뛰기 (결과에 포함시키지 않음)
          continue;
        }

        // 중복이 없으면 저장 진행
        await new Promise((resolve, reject) => {
          // 1. recruitMinister에 insert
          const insertQuery = `
            INSERT INTO recruitMinister (
              saveDate, saveUser, source, title, writer, date, link, church, religiousbody, location, locationDetail, address, mainPastor, homepage,
              school, career, sort, part, partDetail, recruitNum, workday, workTimeSunDay, workTimeWeek, dawnPray, pay,
              welfare, insurance, severance, applydoc, applyhow, applytime, etcNotice, inquiry, customInput
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const values = [
            item.saveDate || '',
            item.saveUser || '',
            item.source || '',
            item.title || '',
            item.writer || '',
            item.date || '',
            item.link || '',
            item.church || '',
            item.religiousbody || '',
            item.location || '',
            item.locationDetail || '',
            item.address || '',
            item.mainpastor || '',
            item.homepage || '',
            item.school || '',
            item.career || '',
            item.sort || '',
            item.part || '',
            item.partDetail || '',
            item.recruitNum || '',
            item.workday || '',
            item.workTimeSunDay || '',
            item.workTimeWeek || '',
            item.dawnPray || '',
            item.pay || '',
            item.welfare || '',
            item.insurance || '',
            item.severance || '',
            item.applydoc || '',
            item.applyhow || '',
            item.applytime || '',
            item.etcNotice || '',
            item.inquiry || '',
            item.customInput || ''
          ];
          recruitdb.query(insertQuery, values, (error, result) => {
            if (error) return reject(error);
            // 2. recruitDataPre에 isSave, saveDate, saveUser만 update
            recruitdb.query(
              `UPDATE recruitDataPre SET isSave = 'true', saveDate = ?, saveUser = ? WHERE id = ?`,
              [item.saveDate || '', item.saveUser || '', item.id],
              (error2, result2) => {
                if (error2) return reject(error2);
                results.push({ success: true, item });
                resolve(true);
              }
            );
          });
        });
      } catch (error) {
        console.error('개별 항목 저장 오류:', error);
        results.push({ success: false, item, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({ 
      success: true, 
      message: `저장 완료: ${successCount}개 성공, ${failCount}개 실패`,
      results: results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'DB error' });
  }
});


// [추가] 임시저장글 삭제
router.post('/deleterecruitpre', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'id required' });
  try {
    recruitdb.query('DELETE FROM recruitDataPre WHERE id = ?', [id], (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (result.affectedRows > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// [추가] 저장된 리스트 삭제 (사용자 권한 확인)
router.post('/deleterecruit', async (req, res) => {
  const { id, saveUser } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'id required' });
  
  try {
    // johnleedev만 삭제 가능
    if (saveUser !== 'johnleedev') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    // 삭제 실행
    recruitdb.query('DELETE FROM recruitMinister WHERE id = ?', [id], (deleteError, deleteResult) => {
      if (deleteError) {
        console.error(deleteError);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (deleteResult.affectedRows > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: 'Post not found' });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ----------------------------------------------------------------------------------------

router.get('/getrecruitmanagepre', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const dataQuery = `
    SELECT * FROM recruitDataPre
    WHERE (isSave IS NULL OR isSave != 'true') AND (editingUser IS NULL OR editingUser = '')
    ORDER BY id ASC
    LIMIT ?
  `;
  try {
    recruitdb.query(dataQuery, [limit], (error, result) => {
      if (error) return res.status(500).send({ error: 'Database query failed' });
      res.send({
        resultData: result.length > 0 ? result : [],
        totalCount: result.length
      });
    });
  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});




router.get('/getrecruitdataall', async (req, res) => {
  const dataQuery = `
    SELECT * FROM recruitMinister
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






// 이메일 리스트
router.get('/getrecruitemail/:page', async (req, res) => {
  var page = parseInt(req.params.page) || 1;
  var pageSize = 100;

  const dataQuery = `
    SELECT * FROM recruitMinister
    WHERE (isSentEmail != 'true' OR isSentEmail IS NULL)
    ORDER BY id ASC;
  `;

  const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  const extractInquiryEmail = (inquiryData) => {
    if (!inquiryData) return null;
    try {
      const parsed = typeof inquiryData === 'string' ? JSON.parse(inquiryData) : inquiryData;
      if (parsed && typeof parsed === 'object' && parsed.email) {
        const email = typeof parsed.email === 'string' ? parsed.email.trim() : parsed.email;
        // 빈 문자열, null, undefined 체크
        if (email && typeof email === 'string' && email.length > 0) {
          return email;
        }
      }
    } catch (parseError) {
      return null;
    }
    return null;
  };

  const hasValidEmail = (item) => {
    const email = extractInquiryEmail(item.inquiry);
    // 이메일이 없으면 false
    if (!email || email.length === 0) {
      return false;
    }
    // 유효한 이메일 형식인지 확인
    return emailRule.test(email);
  };

  try {
    // saveDenyList 조회
    const denyList = await new Promise((resolve, reject) => {
      recruitdb.query('SELECT * FROM saveDenyList', (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    // denyList를 Set으로 변환하여 빠른 조회
    const denyChurches = new Set(denyList.map(item => item.church).filter(Boolean));
    const denyEmails = new Set(denyList.map(item => item.email).filter(Boolean));

    const allData = await new Promise((resolve, reject) => {
      recruitdb.query(dataQuery, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    // 이메일이 있는 항목만 필터링 (이메일이 없거나 유효하지 않은 경우 완전히 제외)
    const validEmailList = allData.filter((item) => {
      // 유효한 이메일 체크
      if (!hasValidEmail(item)) {
        return false;
      }

      // saveDenyList에 있는 교회명이면 제외
      if (item.church && denyChurches.has(item.church)) {
        return false;
      }

      // saveDenyList에 있는 이메일이면 제외
      const email = extractInquiryEmail(item.inquiry);
      if (email && denyEmails.has(email)) {
        return false;
      }

      return true;
    });

    const totalCount = validEmailList.length;
    const offset = (page - 1) * pageSize;
    const paginatedList = validEmailList.slice(offset, offset + pageSize);

    res.send({
      resultData: paginatedList.length > 0 ? paginatedList : [],
      totalCount: totalCount
    });

  } catch (error) {
    console.error('이메일 리스트 조회 오류:', error);
    res.status(500).send({ error: 'Database query failed' });
  }
});

// isSentEmail 초기화 (재발송을 위해)
router.post('/resetemailsent', async (req, res) => {
  const { startId } = req.body;
  
  if (!startId || isNaN(parseInt(startId))) {
    return res.status(400).json({ success: false, message: '유효한 startId가 필요합니다.' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      recruitdb.query(
        `UPDATE recruitMinister SET isSentEmail = NULL WHERE id >= ?`,
        [startId],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    console.log(`isSentEmail 초기화 완료: id ${startId}부터 ${result.affectedRows}개 업데이트`);
    
    res.json({
      success: true,
      message: `id ${startId}부터 ${result.affectedRows}개의 isSentEmail이 초기화되었습니다.`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('isSentEmail 초기화 오류:', error);
    res.status(500).json({
      success: false,
      message: `isSentEmail 초기화 실패: ${error.message}`
    });
  }
});

// isSentEmail을 true로 설정 (복구용)
router.post('/setemailsent', async (req, res) => {
  const { startId, endId } = req.body;
  
  if (!startId || isNaN(parseInt(startId))) {
    return res.status(400).json({ success: false, message: '유효한 startId가 필요합니다.' });
  }

  try {
    let query, params;
    
    if (endId && !isNaN(parseInt(endId))) {
      // 범위가 지정된 경우
      query = `UPDATE recruitMinister SET isSentEmail = 'true' WHERE id >= ? AND id <= ?`;
      params = [startId, endId];
    } else {
      // endId가 없으면 startId부터 끝까지
      query = `UPDATE recruitMinister SET isSentEmail = 'true' WHERE id >= ?`;
      params = [startId];
    }

    const result = await new Promise((resolve, reject) => {
      recruitdb.query(query, params, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const rangeText = endId ? `id ${startId}부터 ${endId}까지` : `id ${startId}부터`;
    console.log(`isSentEmail 설정 완료: ${rangeText} ${result.affectedRows}개 업데이트`);
    
    res.json({
      success: true,
      message: `${rangeText} ${result.affectedRows}개의 isSentEmail이 'true'로 설정되었습니다.`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('isSentEmail 설정 오류:', error);
    res.status(500).json({
      success: false,
      message: `isSentEmail 설정 실패: ${error.message}`
    });
  }
});

// 이메일 발송 완료 상태 확인
router.post('/checkemailsentstatus', async (req, res) => {
  const { emailIds } = req.body;
  
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ success: false, message: '이메일 ID 목록이 필요합니다.' });
  }

  try {
    const placeholders = emailIds.map(() => '?').join(',');
    const query = `
      SELECT id, isSentEmail 
      FROM recruitMinister 
      WHERE id IN (${placeholders})
    `;

    const result = await new Promise((resolve, reject) => {
      recruitdb.query(query, emailIds, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const sentCount = result.filter((item) => item.isSentEmail === 'true').length;
    const totalCount = result.length;
    const isAllSent = sentCount === totalCount;

    res.json({
      success: true,
      isAllSent,
      sentCount,
      totalCount,
      message: isAllSent 
        ? `모든 이메일 발송이 완료되었습니다. (${sentCount}/${totalCount})`
        : `이메일 발송 진행 중입니다. (${sentCount}/${totalCount})`
    });
  } catch (error) {
    console.error('이메일 발송 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: `상태 확인 실패: ${error.message}`
    });
  }
});

// 일괄 이메일 발송
router.post('/sendbulkrecruitemail', async function(req, res) {
  console.log('일괄 이메일 발송 요청 받음');
  const { emailList } = req.body;
  
  if (!Array.isArray(emailList) || emailList.length === 0) {
    console.log('이메일 목록이 없거나 배열이 아님');
    return res.status(400).json({ success: false, message: '발송할 이메일 목록이 없습니다.' });
  }

  console.log(`발송할 이메일 개수: ${emailList.length}`);

  let transporter;
  try {
    transporter = nodemailer.createTransport({
      service: 'naver',
      host: 'smtp.naver.com',
      port: 465,
      auth: {
        user: navermail.NAVER_USER,
        pass: navermail.NAVER_PASS,
      },
    });
    console.log('이메일 transporter 생성 완료');
  } catch (transporterError) {
    console.error('이메일 transporter 생성 실패:', transporterError);
    return res.status(500).json({ 
      success: false, 
      message: `이메일 서버 연결 실패: ${transporterError.message}` 
    });
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  try {
    for (let i = 0; i < emailList.length; i++) {
      const item = emailList[i];
      if ((i + 1) % 10 === 0 || i === 0) {
        console.log(`이메일 발송 진행 중: ${i + 1}/${emailList.length}`);
      }
      
      let emailSent = false;
      let emailAddress = '';
      
      try {
        // inquiry 파싱
        let inquiryCopy;
        try {
          inquiryCopy = JSON.parse(item.inquiry);
        } catch (parseError) {
          failCount++;
          results.push({ id: item.id, success: false, message: 'inquiry 파싱 실패' });
          continue;
        }

        
        const emailAddress = inquiryCopy.email;

        const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

        if (!emailRule.test(emailAddress)) {
          failCount++;
          results.push({ id: item.id, success: false, message: '유효하지 않은 이메일' });
          continue;
        }

        // 토큰 생성
        let deleteToken, denyToken, deleteLink, denyLink;
        try {
          deleteToken = createEmailActionToken('delete', { id: item.id, email: emailAddress });
          denyToken = createEmailActionToken('deny', { church: item.church, email: emailAddress });
          deleteLink = `${EMAIL_ACTION_BASE_URL}/emailaction/delete?token=${encodeURIComponent(deleteToken)}`;
          denyLink = `${EMAIL_ACTION_BASE_URL}/emailaction/deny?token=${encodeURIComponent(denyToken)}`;
        } catch (tokenError) {
          failCount++;
          results.push({ id: item.id, success: false, message: `토큰 생성 실패: ${tokenError.message}` });
          continue;
        }

        // 이메일 발송
        try {
          await transporter.sendMail({
            from: 'yeplat@naver.com',
            to: emailAddress,
            subject: '[사역자모아]에 귀하의 교회 채용 공고가 등록되었습니다',
            html: `
              <html lang="kr">
              <body>
                <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="background-color: #4a90e2; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">사역자모아</h1>
                  </div>
                  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333; font-size: 20px; margin-bottom: 10px;">안녕하세요! '사역자모아'입니다. </h2>
                    <h2 style="color: #333; font-size: 20px; margin-bottom: 30px;">저희 구인구직 게시판에 귀하의 교회 채용 공고가 등록되었습니다.</h2>

                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">저희 '사역자모아'는 사역자들의 처우개선과 사역의 질 향상을 목적으로 만든 게시판 사이트입니다.</h5>
                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">그 중 첫번째로, 사역자 구인구직에 관하여 도움이 되고자 합니다.</h5>
                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">채용 정보는, 각 신대원&총회 홈페이지에 오픈되어 있는 채용 공고를 가져와서 등록하고 있습니다.</h5>
                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">사전에 허락을 구하지 않은 점, 사과의 말씀을 드리며,</h5>
                    <h5 style="color: #CC3D3D; font-size: 17px; margin-bottom: 10px;">공고 삭제 또는 향후 등재 거부를 원하시면 아래 버튼을 통해 언제든 직접 요청하실 수 있습니다.</h5>
                    <h5 style="color: #333; font-size: 17px; margin-bottom: 20px;">다른 문의사항 있으시면, 답장 부탁드립니다.</h5>

                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">등록된 사역자 채용 공고는, 사정상 원본과 동일한 구체적인 내용으로 등록되지 않았으며,</h5>
                    <h5 style="color: #333; font-size: 17px; margin-bottom: 5px;">대략적인 내용으로 등록되어 있음을 양해 부탁드립니다.</h5>
                    <h5 style="color: #CC3D3D; font-size: 17px; margin-bottom: 20px;">더 정확하고 구체적인 내용으로 공고를 등록하길 원하시면, '공고 등록'을 이용해주시기 바랍니다.</h5>
                    
                    <h4 style="color: #333; font-size: 18px; margin-bottom: 10px;">등록된 공고 내용은 아래와 같습니다.</h4>
                    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>교회명:</strong> ${item.church}</p>
                      <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>공고 제목:</strong> ${item.title}</p>
                      <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>등록일:</strong> ${item.saveDate}</p>
                      <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>출처:</strong> ${item.source}</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://ministermore.co.kr/" style="display: inline-block; background-color: #4a90e2; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">공고 보러가기</a>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="${deleteLink}" style="display: inline-block; background-color: #e74c3c; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 15px; font-weight: bold;">공고 삭제 요청</a>
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                      <a href="${denyLink}" style="display: inline-block; background-color: #2ecc71; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 15px; font-weight: bold;">앞으로도 공고가 등록되지 않기를 원합니다</a>
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                      <p style="font-size: 14px; color: #666; text-align: center;">본 메일은 사역자모아에서 발송되었습니다.</p>
                      <p style="font-size: 14px; color: #666; text-align: center;">문의사항이 있으시면 yeplat@naver.com으로 연락주세요.</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `
          });
          emailSent = true;
        } catch (sendError) {
          failCount++;
          results.push({ id: item.id, success: false, message: `이메일 발송 실패: ${sendError.message}` });
          console.error(`이메일 발송 실패 (ID: ${item.id}):`, sendError);
          // 이메일 발송 실패해도 다음 항목으로 계속 진행
          continue;
        }

        // DB 업데이트 (이메일 발송 성공 후)
        if (emailSent) {
          try {
            await new Promise((resolve, reject) => {
              recruitdb.query(`UPDATE recruitMinister SET isSentEmail = 'true' WHERE id = ?`, [item.id], (error, result) => {
                if (error) return reject(error);
                resolve(result);
              });
            });
          } catch (dbError) {
            // DB 업데이트 실패해도 이메일은 발송되었으므로 성공으로 처리
            console.error(`DB 업데이트 실패 (ID: ${item.id}):`, dbError);
            // 성공으로 처리하되 경고 메시지 포함
            successCount++;
            results.push({ id: item.id, success: true, email: emailAddress, warning: 'DB 업데이트 실패' });
            // 다음 항목으로 계속 진행
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }

        successCount++;
        results.push({ id: item.id, success: true, email: emailAddress });

        // 이메일 발송 간격 (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        // 예상치 못한 오류 발생 시에도 다음 항목으로 계속 진행
        failCount++;
        results.push({ id: item.id, success: false, message: `예상치 못한 오류: ${error.message}` });
        console.error(`이메일 발송 중 예상치 못한 오류 (ID: ${item.id}):`, error);
        // 다음 항목으로 계속 진행
      }
    }

    console.log(`일괄 이메일 발송 완료: 총 ${emailList.length}개 중 ${successCount}개 성공, ${failCount}개 실패`);
    
    const responseData = { 
      success: true, 
      message: `총 ${emailList.length}개 중 ${successCount}개 성공, ${failCount}개 실패`,
      successCount,
      failCount,
      results
    };
    
    try {
      // 응답 전송 전 헤더 설정으로 연결 유지
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Connection', 'keep-alive');
      }
      
      console.log('응답 데이터 전송 시작 (결과 개수:', results.length, ')');
      
      res.json(responseData);
      
      console.log('응답 전송 완료');
    } catch (responseError) {
      console.error('응답 전송 중 오류 발생:', responseError);
      console.error('응답 전송 오류 스택:', responseError.stack);
      // 응답을 이미 보냈거나 연결이 끊긴 경우
      if (!res.headersSent) {
        try {
          res.status(500).json({ 
            success: false, 
            message: '응답 전송 중 오류가 발생했습니다.' 
          });
        } catch (finalError) {
          console.error('최종 응답 전송 실패:', finalError);
        }
      }
    }

  } catch (error) {
    console.error('일괄 이메일 발송 오류:', error);
    console.error('오류 스택:', error.stack);
    console.error('오류 메시지:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `일괄 이메일 발송에 실패했습니다: ${error.message || '알 수 없는 오류'}` 
    });
  }
});

router.get('/emailaction/delete', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return sendEmailActionResponse(res, '요청 실패', '요청 정보가 올바르지 않습니다.');
  }

  const data = verifyEmailActionToken(token);
  if (!data || data.action !== 'delete') {
    return sendEmailActionResponse(res, '요청 실패', '유효하지 않은 토큰입니다.');
  }

  const { id } = data.payload || {};
  if (!id) {
    return sendEmailActionResponse(res, '요청 실패', '필수 정보가 누락되었습니다.');
  }

  try {
    const deleteResult = await new Promise((resolve, reject) => {
      recruitdb.query(`DELETE FROM recruitMinister WHERE id = ?`, [id], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    if (deleteResult.affectedRows > 0) {
      return sendEmailActionResponse(res, '삭제 완료', '요청하신 공고가 성공적으로 삭제되었습니다.');
    }
    return sendEmailActionResponse(res, '이미 처리되었습니다', '해당 공고는 이미 삭제되었거나 존재하지 않습니다.');
  } catch (error) {
    console.error('Email action delete error:', error);
    return sendEmailActionResponse(res, '처리 실패', '요청을 처리하는 중 오류가 발생했습니다.');
  }
});

router.get('/emailaction/deny', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return sendEmailActionResponse(res, '요청 실패', '요청 정보가 올바르지 않습니다.');
  }

  const data = verifyEmailActionToken(token);
  if (!data || data.action !== 'deny') {
    return sendEmailActionResponse(res, '요청 실패', '유효하지 않은 토큰입니다.');
  }

  const { church, email } = data.payload || {};
  if (!church || !email) {
    return sendEmailActionResponse(res, '요청 실패', '필수 정보가 누락되었습니다.');
  }

  try {
    await new Promise((resolve, reject) => {
      recruitdb.query(
        `INSERT INTO saveDenyList (church, email) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        [church, email],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    return sendEmailActionResponse(res, '요청 완료', '앞으로 해당 교회의 공고는 등록되지 않도록 처리되었습니다.');
  } catch (error) {
    console.error('Email action deny error:', error);
    return sendEmailActionResponse(res, '처리 실패', '요청을 처리하는 중 오류가 발생했습니다.');
  }
});


module.exports = router;
