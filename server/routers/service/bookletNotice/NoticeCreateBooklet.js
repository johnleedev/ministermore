/**
 * 전단지 편집(NoticeCreate)·템플릿 생성·탭별 저장·삭제
 * 마운트: `app.use('/bookletnoticecreate', NoticeCreateBooklet)` (server/app.js)
 */
const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
router.use(express.json());
const { bookletnoticedb } = require('../../dbdatas/bookletdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { toTemplateInt, toTemplateStr, toChurchMainIdInt, insertChurchMainRow } = require('./bookletNoticeShared');

// 특정 교회전단지 데이터 보내기 (id 또는 userAccount로 조회, churchMain + churchInfo 병합)
router.post('/getdatabookletspart', async (req, res) => {
  var { id, userAccount } = req.body;
  const mergeRow = (m, i) => {
    if (!m) return null;
    return {
      id: m.id,
      userAccount: m.userAccount,
      templateId: toTemplateStr(m.templateId),
      ordererName: m.ordererName || '',
      ordererPhone: m.ordererPhone || '',
      orderTitle: m.orderTitle != null && String(m.orderTitle).trim() !== '' ? String(m.orderTitle).trim() : '',
      title: i?.title || '새 교회 소개',
      type: i?.type || 'notice',
      categoryOrder: i?.categoryOrder,
      churchName: i?.churchName || '',
      mainPastor: i?.mainPastor || '',
      religiousbody: i?.religiousbody || '',
      address: i?.address || '',
      quiry: i?.quiry || '',
      youtube: i?.youtube || '',
      blog: i?.blog || '',
      instar: i?.instar || '',
      facebook: i?.facebook || '',
      mainPastorMessage: i?.mainPastorMessage || '',
      churchGreeting: i?.churchGreeting,
      mainPastorCareer: i?.mainPastorCareer,
      worshipTimes: i?.worshipTimes,
      placeNaver: i?.placeNaver || '',
      placeKakao: i?.placeKakao || '',
      placeHomepage: i?.placeHomepage || '',
      imageMainName: i?.imageMainName || '',
      mainLogo: i?.mainLogo || '',
      mainPastorImage: i?.mainPastorImage || '',
      worshipImage: i?.worshipImage || '',
      youtubeNoticeImage: i?.youtubeNoticeImage || '',
      youtubeNoticeUrl: i?.youtubeNoticeUrl || '',
    };
  };
  const idInt = toChurchMainIdInt(id);
  if (idInt != null) {
    const query = `
      SELECT m.*, i.title, i.type, i.categoryOrder, i.churchName, i.mainPastor, i.religiousbody,
             i.address, i.quiry, i.youtube, i.blog, i.instar, i.facebook,
             i.mainPastorMessage, i.churchGreeting, i.mainPastorCareer, i.worshipTimes,
             i.placeNaver, i.placeKakao, i.placeHomepage, i.imageMainName, i.mainLogo,
             i.mainPastorImage, i.worshipImage, i.youtubeNoticeImage, i.youtubeNoticeUrl
      FROM churchMain m
      LEFT JOIN churchInfo i ON m.id = i.churchMainId
      WHERE m.id = ?
    `;
    bookletnoticedb.query(query, [idInt], function (error, result) {
      if (error) { throw error; }
      if (result.length > 0) {
        const row = mergeRow(result[0], result[0]);
        res.json([row]);
      } else {
        res.send(false);
      }
      res.end();
    });
  } else if (userAccount) {
    const query = `
      SELECT m.*, i.title, i.type, i.categoryOrder, i.churchName, i.mainPastor, i.religiousbody,
             i.address, i.quiry, i.youtube, i.blog, i.instar, i.facebook,
             i.mainPastorMessage, i.churchGreeting, i.mainPastorCareer, i.worshipTimes,
             i.placeNaver, i.placeKakao, i.placeHomepage, i.imageMainName, i.mainLogo,
             i.mainPastorImage, i.worshipImage, i.youtubeNoticeImage, i.youtubeNoticeUrl
      FROM churchMain m
      LEFT JOIN churchInfo i ON m.id = i.churchMainId
      WHERE m.userAccount = ?
      ORDER BY m.id DESC
      LIMIT 1
    `;
    bookletnoticedb.query(query, [userAccount], function (error, result) {
      if (error) { throw error; }
      if (result.length > 0) {
        const row = mergeRow(result[0], result[0]);
        res.json([row]);
      } else {
        res.send(false);
      }
      res.end();
    });
  } else {
    res.send(false);
    res.end();
  }
});


// 특정 교회 섬김이 데이터 보내기
router.post('/getdataserverspart', async (req, res) => {
  const id = toChurchMainIdInt(req.body?.id);
  if (id == null) { res.send(false); res.end(); return; }
  const query = `SELECT * FROM churchServers WHERE churchMainId = ?`;
  bookletnoticedb.query(query, [id], function (error, result) {
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

// 특정 설교영상 데이터 보내기 (없거나 오류 시 빈 배열 반환)
router.post('/getdatasermonpart', async (req, res) => {
  const id = toChurchMainIdInt(req.body?.id);
  if (id == null) return res.json([]);
  const query = `SELECT * FROM churchSermonVideos WHERE churchMainId = ? ORDER BY id ASC`;
  bookletnoticedb.query(query, [id], function (error, result) {
    if (error) {
      console.error('getdatasermonpart error:', error.message);
      return res.json([]);
    }
    res.json(Array.isArray(result) ? result : []);
  });
});

// 특정 갤러리 데이터 보내기 (갤러리 없거나 오류 시 빈 배열 반환)
router.post('/getdatagallerypart', async (req, res) => {
  const id = toChurchMainIdInt(req.body?.id);
  if (id == null) return res.json([]);
  const query = `SELECT * FROM churchGallery WHERE churchMainId = ? ORDER BY id ASC`;
  bookletnoticedb.query(query, [id], function (error, result) {
    if (error) {
      console.error('getdatagallerypart error:', error.message);
      return res.json([]);
    }
    res.json(Array.isArray(result) ? result : []);
  });
});


// 특정 사역 데이터 보내기
router.post('/getdataministrypart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM churchMinistry WHERE bookletId = '${id}';
  `;
  bookletnoticedb.query(query, function (error, result) {
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

// 특정 행사 데이터 보내기
router.post('/getdataeventspart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM churchEvents WHERE bookletId = '${id}';
  `;
  bookletnoticedb.query(query, function (error, result) {
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





// 팜플렛 데이터 검색하기 (churchInfo.title 기준)
router.post('/getdatabookletsearch', async (req, res)=>{
  var {word, type} = req.body;
  const whereType = type === 'all' ? '' : `AND i.type = '${type}'`;

  const query = `
    SELECT m.id, m.userAccount, m.templateId,
           i.title, i.type, i.churchName, i.mainPastor, i.imageMainName
    FROM churchMain m
    LEFT JOIN churchInfo i ON m.id = i.churchMainId
    WHERE (i.title LIKE '%${word}%' OR i.churchName LIKE '%${word}%')
    ${whereType}
  `;
  bookletnoticedb.query(query, function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({ count: result.length, data: result });
    } else {
      res.json({ count: 0, data: false });
    }
  });
});

// ----- 교회 소개 페이지 제작 (BOOKLET_NOTICE_PLAN) -----

// 새 전단지 생성 (churchMain만 생성, churchInfo는 saveIntro에서 생성)
router.post('/create', async (req, res) => {
  try {
    const id = await insertChurchMainRow(bookletnoticedb, req.body || {});
    res.json({ success: true, id });
  } catch (e) {
    if (e && e.code === 'DUPLICATE_PORTONE') {
      return res.status(409).json({
        success: false,
        message: e.message || '이 결제로 이미 전단지가 생성되었습니다.',
        ...(e.existingId != null && { churchMainId: e.existingId }),
      });
    }
    console.error('create churchMain INSERT error:', e);
    return res.status(500).json({ success: false, message: e?.message || String(e) });
  }
});

// 카테고리 순서 저장 (churchInfo.categoryOrder)
router.post('/saveCategoryOrder', (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId);
  const { order } = req.body || {};
  if (churchMainId == null || !Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ success: false, message: 'churchMainId와 order 배열이 필요합니다.' });
  }
  const categoryOrder = JSON.stringify(order);
  const query = `UPDATE churchInfo SET categoryOrder = ? WHERE churchMainId = ?`;
  bookletnoticedb.query(query, [categoryOrder, churchMainId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '해당 전단지를 찾을 수 없습니다.' });
    }
    res.json({ success: true });
  });
});

// ----- 전단지 소개 탭 저장 (메인 이미지, 담임목사 사진 포함) -----
const storage_mainImage = multer.diskStorage({
  destination(req, file, done) {
    const dest = file.fieldname === 'mainPastorImage'
      ? 'build/images/bookletnotice/pastors'
      : 'build/images/bookletnotice/mainimages';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const upload_intro = multer({
  storage: storage_mainImage,
}).fields([
  { name: 'mainImage', maxCount: 1 }, // 레거시 클라이언트(단일 메인 이미지)
  { name: 'mainImage_0', maxCount: 1 },
  { name: 'mainImage_1', maxCount: 1 },
  { name: 'mainImage_2', maxCount: 1 },
  { name: 'mainImage_3', maxCount: 1 },
  { name: 'mainImage_4', maxCount: 1 },
  { name: 'mainPastorImage', maxCount: 1 },
]);

const MAIN_IMAGE_SLOT_COUNT = 5;

/** imageMainName: 단일 파일명(레거시) 또는 JSON 배열 ["a.jpg","",…] (최대 5) */
function parseImageMainNameSlots(raw) {
  const empty = () => Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, () => '');
  if (raw == null || raw === '') return empty();
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) {
        return Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, (_, i) => (p[i] != null ? String(p[i]) : ''));
      }
    } catch (_) {
      /* ignore */
    }
    return empty();
  }
  return [s, '', '', '', ''];
}

function serializeImageMainNameSlots(slots) {
  const a = Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, (_, i) => String(slots[i] || '').trim() || '');
  if (a.every((x) => !x)) return '';
  return JSON.stringify(a);
}

function escapeHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toEnglishFilenamePart(churchName) {
  const asciiOnly = String(churchName || '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return asciiOnly || 'church';
}

function makeNoticeHtml({ churchMainId, churchName, imageUrl }) {
  const safeChurchName = escapeHtml(churchName || '교회 소개');
  const safeImageUrl = escapeHtml(imageUrl || '');
  const linkUrl = `https://ministermore.co.kr/booklet?id=${churchMainId}`;
  const safeLinkUrl = escapeHtml(linkUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${safeLinkUrl}" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />

    <meta name="description" content="${safeChurchName}"/>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${safeChurchName}">
    <meta property="og:description" content="${safeChurchName}">
    <meta property="og:image" content="${safeImageUrl}">
    <meta property="og:url" content="${safeLinkUrl}">

    <title>${safeChurchName}</title>

  </head>
  <body>
    <script>window.location.replace("${safeLinkUrl}");</script>
    <p>이동 중... <a href="${safeLinkUrl}">여기를 클릭하세요</a></p>
  </body>
</html>
`;
}

router.post('/saveIntro', upload_intro, (req, res) => {
  const body = req.body || {};
  const q = req.query || {};
  const churchMainIdRaw = body.churchMainId || q.churchMainId;
  const churchMainId = churchMainIdRaw != null ? toChurchMainIdInt(churchMainIdRaw) : null;
  const templateId = body.templateId || q.templateId || 'classic';
  const ordererName = body.ordererName || q.ordererName || '';
  const ordererPhone = body.ordererPhone || q.ordererPhone || '';
  const orderTitle = String(body.orderTitle || q.orderTitle || '').trim();
  const {
    churchName,
    mainPastor,
    religiousbody,
    address,
    quiry,
    youtube,
    blog,
    instar,
    facebook,
    mainPastorMessage,
    churchGreeting,
    mainPastorCareer,
    worshipTimes,
    placeNaver,
    placeKakao,
    imageMainName: existingImageMainName,
    mainPastorImageName: existingMainPastorImageName,
    userAccount,
  } = body;

  const worshipTimesJson = typeof worshipTimes === 'string' ? worshipTimes : JSON.stringify(worshipTimes || []);
  const mainPastorCareerJson = typeof mainPastorCareer === 'string' ? mainPastorCareer : JSON.stringify(mainPastorCareer || []);

  const files = req.files || {};
  const mainPastorImageFile = files.mainPastorImage?.[0];
  const mainSlots = parseImageMainNameSlots(existingImageMainName);
  const legacyMain = files.mainImage?.[0];
  if (legacyMain) mainSlots[0] = legacyMain.filename;
  for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i++) {
    const f = files[`mainImage_${i}`]?.[0];
    if (f) mainSlots[i] = f.filename;
  }
  const imageMainName = serializeImageMainNameSlots(mainSlots);
  const mainPastorImage = mainPastorImageFile ? mainPastorImageFile.filename : (existingMainPastorImageName || '');

  const churchGreetingJson = typeof churchGreeting === 'string' ? churchGreeting : JSON.stringify(churchGreeting || '{}');

  const categoryOrderDefault = JSON.stringify(['churchInfo', 'churchIntro', 'sermon', 'servers', 'gallery']);

  if (churchMainId == null) {
    // 새 전단지: 1) churchMain 생성, 2) churchInfo 생성
    const templateIdInt = toTemplateInt(templateId || 'classic');
    bookletnoticedb.query(
      'INSERT INTO churchMain (userAccount, templateId, ordererName, ordererPhone, orderTitle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userAccount || '', templateIdInt, ordererName, ordererPhone, orderTitle],
      (err, result) => {
        if (err) {
          console.error('saveIntro churchMain INSERT error:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
        const newChurchMainId = result.insertId;
        const infoQuery = `
          INSERT INTO churchInfo (churchMainId, title, type, categoryOrder, churchName, mainPastor, religiousbody,
            address, quiry, youtube, blog, instar, facebook, mainPastorMessage, mainPastorImage, churchGreeting,
            mainPastorCareer, worshipTimes, placeNaver, placeKakao, imageMainName)
          VALUES (?, '새 교회 소개', 'notice', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const infoValues = [
          newChurchMainId,
          categoryOrderDefault,
          churchName || '',
          mainPastor || '',
          religiousbody || '',
          address || '',
          quiry || '',
          youtube || '',
          blog || '',
          instar || '',
          facebook || '',
          mainPastorMessage || '',
          mainPastorImage,
          churchGreetingJson,
          mainPastorCareerJson,
          worshipTimesJson,
          placeNaver || '',
          placeKakao || '',
          imageMainName,
        ];
        bookletnoticedb.query(infoQuery, infoValues, (infoErr) => {
          if (infoErr) {
            console.error('saveIntro churchInfo INSERT error:', infoErr);
            bookletnoticedb.query('DELETE FROM churchMain WHERE id = ?', [newChurchMainId], () => {});
            return res.status(500).json({ success: false, message: infoErr.message });
          }
          res.json({
            success: true,
            id: newChurchMainId,
            imageMainName: imageMainName || undefined,
            mainPastorImage: mainPastorImage || undefined,
          });
        });
      }
    );
    return;
  }

  // 기존 전단지: churchInfo UPDATE 또는 INSERT (create에서 churchMain만 만든 경우 churchInfo 없을 수 있음)
  const updateQuery = `
    UPDATE churchInfo SET
      churchName = ?, mainPastor = ?, religiousbody = ?, address = ?,
      quiry = ?, youtube = ?, blog = ?, instar = ?, facebook = ?,
      mainPastorMessage = ?, mainPastorImage = ?, churchGreeting = ?, mainPastorCareer = ?, worshipTimes = ?,
      placeNaver = ?, placeKakao = ?, imageMainName = ?
    WHERE churchMainId = ?
  `;
  const updateValues = [
    churchName || '',
    mainPastor || '',
    religiousbody || '',
    address || '',
    quiry || '',
    youtube || '',
    blog || '',
    instar || '',
    facebook || '',
    mainPastorMessage || '',
    mainPastorImage,
    churchGreetingJson,
    mainPastorCareerJson,
    worshipTimesJson,
    placeNaver || '',
    placeKakao || '',
    imageMainName,
    churchMainId,
  ];

  bookletnoticedb.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error('saveIntro churchInfo UPDATE error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        imageMainName: imageMainName || undefined,
        mainPastorImage: mainPastorImage || undefined,
      });
    }
    // churchInfo 없음 (create에서 churchMain만 생성한 경우) → INSERT
    const infoQuery = `
      INSERT INTO churchInfo (churchMainId, title, type, categoryOrder, churchName, mainPastor, religiousbody,
        address, quiry, youtube, blog, instar, facebook, mainPastorMessage, mainPastorImage, churchGreeting,
        mainPastorCareer, worshipTimes, placeNaver, placeKakao, imageMainName)
      VALUES (?, '새 교회 소개', 'notice', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const infoValues = [
      churchMainId,
      categoryOrderDefault,
      churchName || '',
      mainPastor || '',
      religiousbody || '',
      address || '',
      quiry || '',
      youtube || '',
      blog || '',
      instar || '',
      facebook || '',
      mainPastorMessage || '',
      mainPastorImage,
      churchGreetingJson,
      mainPastorCareerJson,
      worshipTimesJson,
      placeNaver || '',
      placeKakao || '',
      imageMainName,
    ];
    bookletnoticedb.query(infoQuery, infoValues, (infoErr) => {
      if (infoErr) {
        console.error('saveIntro churchInfo INSERT (fallback) error:', infoErr);
        return res.status(500).json({ success: false, message: infoErr.message });
      }
      res.json({
        success: true,
        imageMainName: imageMainName || undefined,
        mainPastorImage: mainPastorImage || undefined,
      });
    });
  });
});

// ----- 섬김이들 탭 저장 (churchServers) -----
const storage_servers = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletnotice/servers';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const upload_servers = multer({ storage: storage_servers });

router.post('/saveServants', upload_servers.any(), (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId || req.query?.churchMainId);
  const serversData = req.body?.serversData;
  if (churchMainId == null) {
    return res.status(400).json({ success: false, message: 'churchMainId가 필요합니다.' });
  }
  const servers = typeof serversData === 'string' ? JSON.parse(serversData) : (serversData || []);

  bookletnoticedb.query('DELETE FROM churchServers WHERE churchMainId = ?', [churchMainId], (delErr) => {
    if (delErr) {
      console.error('saveServants delete error:', delErr);
      return res.status(500).json({ success: false, message: delErr.message });
    }

    const files = req.files || [];
    const fileMap = {};
    files.forEach((f) => {
      const fieldIndex = f.fieldname.replace('serverImage_', '');
      fileMap[fieldIndex] = f.filename;
    });

    if (servers.length === 0) {
      return res.json({ success: true, serverImages: [] });
    }

    // 원본 인덱스로 업로드 파일명 매칭 후 filter (filter 이후 idx는 갤러리/설교와 달리 fileMap 키와 불일치함)
    const serversWithImages = servers.map((s, i) => {
      const imageName = fileMap[String(i)] || fileMap[i] || s.image || '';
      return {
        title: s.title || '',
        serverName: s.serverName || '',
        duty: s.duty || '',
        notice: s.notice || '',
        image: imageName,
      };
    });

    const insertPromises = serversWithImages
      .filter((s) => s.title || s.serverName || s.duty || s.notice)
      .map((s) => {
        return new Promise((resolve, reject) => {
          bookletnoticedb.query(
            'INSERT INTO churchServers (churchMainId, title, serverName, duty, notice, image) VALUES (?, ?, ?, ?, ?, ?)',
            [churchMainId, s.title, s.serverName, s.duty, s.notice, s.image],
            (err) => (err ? reject(err) : resolve())
          );
        });
      });

    Promise.all(insertPromises)
      .then(() =>
        res.json({
          success: true,
          serverImages: serversWithImages.map((s) => s.image || ''),
        })
      )
      .catch((err) => {
        console.error('saveServants insert error:', err);
        res.status(500).json({ success: false, message: err.message });
      });
  });
});

// ----- 설교영상 탭 저장 (churchSermonVideos 테이블) -----
const storage_sermon = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletnotice/sermonthumbnail';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const upload_sermon = multer({ storage: storage_sermon });

const createSermonTable = `CREATE TABLE IF NOT EXISTS churchSermonVideos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  churchMainId INT NOT NULL,
  title VARCHAR(255) DEFAULT '',
  url VARCHAR(500) DEFAULT '',
  thumbnail VARCHAR(255) DEFAULT '',
  sortOrder INT DEFAULT 0
)`;

router.post('/saveSermon', upload_sermon.any(), (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId || req.query?.churchMainId);
  const sermonVideos = req.body?.sermonVideos;
  if (churchMainId == null) {
    return res.status(400).json({ success: false, message: 'churchMainId가 필요합니다.' });
  }
  let videos = typeof sermonVideos === 'string' ? JSON.parse(sermonVideos) : (sermonVideos || []);
  const files = req.files || [];
  const thumbMap = {};
  files.forEach((f) => {
    const idx = f.fieldname.replace('sermonThumb_', '');
    thumbMap[idx] = f.filename;
  });
  videos = videos.map((v, i) => ({
    title: v.title || '',
    url: v.url || '',
    thumbnail: thumbMap[i] || v.thumbnail || '',
    sortOrder: i,
  }));

  bookletnoticedb.query(createSermonTable, (createErr) => {
    if (createErr) {
      console.error('createSermonTable error:', createErr);
      return res.status(500).json({ success: false, message: createErr.message });
    }
    bookletnoticedb.query('DELETE FROM churchSermonVideos WHERE churchMainId = ?', [churchMainId], (delErr) => {
      if (delErr) {
        console.error('saveSermon delete error:', delErr);
        return res.status(500).json({ success: false, message: delErr.message });
      }
      if (videos.length === 0) {
        return res.json({ success: true, thumbnails: [] });
      }
      const insertPromises = videos
        .filter((v) => v.title || v.url || v.thumbnail)
        .map((v) =>
          new Promise((resolve, reject) => {
            bookletnoticedb.query(
              'INSERT INTO churchSermonVideos (churchMainId, title, url, thumbnail, sortOrder) VALUES (?, ?, ?, ?, ?)',
              [churchMainId, v.title, v.url, v.thumbnail, v.sortOrder],
              (err) => (err ? reject(err) : resolve())
            );
          })
        );
      Promise.all(insertPromises)
        .then(() =>
          res.json({
            success: true,
            thumbnails: videos.map((v) => v.thumbnail || ''),
          })
        )
        .catch((err) => {
          console.error('saveSermon insert error:', err);
          res.status(500).json({ success: false, message: err.message });
        });
    });
  });
});

// ----- 갤러리 탭 저장 (churchGallery 테이블) -----
const storage_gallery = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletnotice/gallery';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const upload_gallery = multer({ storage: storage_gallery });

const createGalleryTable = `CREATE TABLE IF NOT EXISTS churchGallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  churchMainId INT NOT NULL,
  image VARCHAR(255) DEFAULT '',
  title VARCHAR(255) DEFAULT '',
  description TEXT NULL
)`;

router.post('/saveGallery', upload_gallery.any(), (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId || req.query?.churchMainId);
  const galleryData = req.body?.galleryData;
  if (churchMainId == null) {
    return res.status(400).json({ success: false, message: 'churchMainId가 필요합니다.' });
  }
  let items = typeof galleryData === 'string' ? JSON.parse(galleryData) : (galleryData || []);
  const files = req.files || [];
  const imgMap = {};
  files.forEach((f) => {
    const idx = f.fieldname.replace('galleryImage_', '');
    imgMap[idx] = f.filename;
  });
  items = items.map((item, i) => ({
    image: imgMap[i] || item.image || '',
    title: item.title || '',
    description: item.description || '',
  }));

  bookletnoticedb.query(createGalleryTable, (createErr) => {
    if (createErr) {
      console.error('createGalleryTable error:', createErr);
      return res.status(500).json({ success: false, message: createErr.message });
    }
    bookletnoticedb.query('DELETE FROM churchGallery WHERE churchMainId = ?', [churchMainId], (delErr) => {
      if (delErr) {
        console.error('saveGallery delete error:', delErr);
        return res.status(500).json({ success: false, message: delErr.message });
      }
      if (items.length === 0) {
        return res.json({ success: true, galleryImages: [] });
      }
      const galleryImagesOut = items.map((item) => item.image || '');
      const insertPromises = items
        .filter((item) => item.image)
        .map((item) =>
          new Promise((resolve, reject) => {
            bookletnoticedb.query(
              'INSERT INTO churchGallery (churchMainId, image, title, description) VALUES (?, ?, ?, ?)',
              [churchMainId, item.image, item.title, item.description],
              (err) => (err ? reject(err) : resolve())
            );
          })
        );
      Promise.all(insertPromises)
        .then(() => res.json({ success: true, galleryImages: galleryImagesOut }))
        .catch((err) => {
          console.error('saveGallery insert error:', err);
          res.status(500).json({ success: false, message: err.message });
        });
    });
  });
});

// 완료 시 공유용 HTML 생성 (build/hp/notice)
router.post('/generateNoticeHtml', (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId);
  if (churchMainId == null) {
    return res.status(400).json({ success: false, message: 'churchMainId가 필요합니다.' });
  }

  const query = `
    SELECT
      m.orderTitle,
      i.churchName,
      i.imageMainName
    FROM churchMain m
    LEFT JOIN churchInfo i ON m.id = i.churchMainId
    WHERE m.id = ?
    LIMIT 1
  `;

  bookletnoticedb.query(query, [churchMainId], (err, rows) => {
    if (err) {
      console.error('generateNoticeHtml query error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '전단지 정보를 찾을 수 없습니다.' });
    }

    const row = rows[0] || {};
    const churchName = String(row.churchName || row.orderTitle || '').trim() || `교회소개${churchMainId}`;
    const imageSlots = parseImageMainNameSlots(row.imageMainName);
    const firstImage = imageSlots.find((name) => String(name || '').trim() !== '');
    const imageUrl = firstImage
      ? `https://www.ministermore.co.kr/images/bookletnotice/mainimages/${firstImage}`
      : '';

    const englishName = toEnglishFilenamePart(churchName);
    const fileName = `id${churchMainId}${englishName}.html`;
    const targetDir = path.resolve(__dirname, '../../../build/hp/notice');
    const targetPath = path.join(targetDir, fileName);
    const html = makeNoticeHtml({ churchMainId, churchName, imageUrl });

    try {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, html, 'utf8');
      return res.json({
        success: true,
        fileName,
        filePath: `/hp/notice/${fileName}`,
      });
    } catch (writeErr) {
      console.error('generateNoticeHtml write error:', writeErr);
      return res.status(500).json({ success: false, message: writeErr.message });
    }
  });
});

// 전단지 삭제 (서비스 관리용, userAccount 검증)
router.post('/deleteBooklet', (req, res) => {
  const churchMainId = toChurchMainIdInt(req.body?.churchMainId);
  const userAccount = req.body?.userAccount;
  if (churchMainId == null || !userAccount) {
    return res.status(400).json({ success: false, message: 'churchMainId와 userAccount가 필요합니다.' });
  }
  bookletnoticedb.query('SELECT id FROM churchMain WHERE id = ? AND userAccount = ?', [churchMainId, userAccount], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows || rows.length === 0) {
      return res.status(403).json({ success: false, message: '권한이 없습니다.' });
    }
    bookletnoticedb.query('DELETE FROM churchServers WHERE churchMainId = ?', [churchMainId], () => {});
    bookletnoticedb.query('DELETE FROM churchSermonVideos WHERE churchMainId = ?', [churchMainId], () => {});
    bookletnoticedb.query('DELETE FROM churchGallery WHERE churchMainId = ?', [churchMainId], () => {});
    bookletnoticedb.query('DELETE FROM churchInfo WHERE churchMainId = ?', [churchMainId], () => {});
    bookletnoticedb.query('DELETE FROM churchMain WHERE id = ?', [churchMainId], (delErr) => {
      if (delErr) return res.status(500).json({ success: false, message: delErr.message });
      res.json({ success: true });
    });
  });
});

module.exports = router;
