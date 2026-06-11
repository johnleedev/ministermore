require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { retreatdb } = require('../dbdatas/retreatdb');
const {
  ensureRetreatRequestTable,
  ensureRetreatRequestMainTable,
  ensureRetreatAnswerTable,
  ensureRetreatInfoColumns,
} = require('./retreatSchema');
const { provisionRetreatFromPayment } = require('./retreatSync');

const WEBHOOK_API_KEY = process.env.MMSERVICE_WEBHOOK_API_KEY || '';

const router = express.Router();
router.use(cors());
router.use(express.json());

const MAIN_IMAGE_SLOT_COUNT = 5;

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

const storageMainImage = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/retreat';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const raw = path.basename(String(file.originalname || 'image.jpg'));
    const safe = raw.replace(/[/\\]/g, '_').trim() || `image_${Date.now()}.jpg`;
    done(null, safe);
  },
});

const uploadRetreatInfo = multer({ storage: storageMainImage }).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'mainImage_0', maxCount: 1 },
  { name: 'mainImage_1', maxCount: 1 },
  { name: 'mainImage_2', maxCount: 1 },
  { name: 'mainImage_3', maxCount: 1 },
  { name: 'mainImage_4', maxCount: 1 },
]);

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    retreatdb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryResultAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    retreatdb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function str(value) {
  return value == null ? '' : String(value).trim();
}

function verifyApiKey(req) {
  if (!WEBHOOK_API_KEY) {
    console.error('[RetreatRouter] MMSERVICE_WEBHOOK_API_KEY 미설정');
    return false;
  }
  const incoming = req.headers['x-api-key'];
  return typeof incoming === 'string' && incoming === WEBHOOK_API_KEY;
}

function parseRetreatAuth(source) {
  const src = source || {};
  return {
    churchName: str(src.churchName),
    passwd: str(src.passwd),
    ownerpw: src.ownerpw != null ? str(src.ownerpw) : '',
  };
}

function parseRetreatAuthFromRequest(req) {
  return parseRetreatAuth({ ...req.query, ...req.body });
}

function sanitizeRetreatMain(row) {
  if (!row) return null;
  const { passwd, ownerpw, ...rest } = row;
  return rest;
}

async function findRetreatMainById(bookletId) {
  const rows = await queryAsync(
    `SELECT id, userAccount, orderTitle, ordererName, ordererPhone, link,
            churchName, passwd, ownerpw, created_at, updated_at
     FROM retreatMain WHERE id = ? LIMIT 1`,
    [bookletId],
  );
  return rows[0] || null;
}

function parseJsonField(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

function normalizeCustomQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const q = item && typeof item === 'object' ? item : {};
      const id = String(q.id || `q_${index + 1}`).trim();
      const label = String(q.label || '').trim();
      const type = String(q.type || 'text').trim();
      if (!id || !label) return null;
      if (type !== 'text' && type !== 'radio' && type !== 'checkbox') return null;
      const options = Array.isArray(q.options)
        ? q.options.map((opt) => String(opt || '').trim()).filter(Boolean)
        : [];
      if ((type === 'radio' || type === 'checkbox') && options.length === 0) return null;
      return {
        id,
        label,
        type,
        ...(type === 'radio' || type === 'checkbox' ? { options } : {}),
        required: q.required === true || q.required === 1 || q.required === '1',
      };
    })
    .filter(Boolean);
}

function normalizeCustomAnswers(raw) {
  if (raw == null || raw === '') return {};
  const parsed = parseJsonField(raw, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

async function assertOwner(bookletId, authInput) {
  const auth = parseRetreatAuth(authInput);

  if (!auth.churchName || !auth.passwd) {
    const err = new Error('교회 이름과 비밀번호가 필요합니다.');
    err.status = 400;
    throw err;
  }

  const main = await findRetreatMainById(bookletId);
  if (!main) {
    const err = new Error('수련회 전단지를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (str(main.churchName).toLowerCase() !== auth.churchName.toLowerCase()) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  if (str(main.passwd) !== auth.passwd) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  if (auth.ownerpw && str(main.ownerpw) !== auth.ownerpw) {
    const err = new Error('관리자 비밀번호가 올바르지 않습니다.');
    err.status = 403;
    throw err;
  }
  return main;
}

/** POST /api/retreat/provision-from-payment — 결제 완료 프로비저닝 (x-api-key) */
router.post('/provision-from-payment', async (req, res) => {
  if (!verifyApiKey(req)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  try {
    const result = await provisionRetreatFromPayment(req.body || {});
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('POST /api/retreat/provision-from-payment', err);
    return res.status(500).json({ ok: false, message: err?.message || '프로비저닝에 실패했습니다.' });
  }
});

/** POST /api/retreat/login — 교회 이름·비밀번호 로그인 */
router.post('/login', async (req, res) => {
  try {
    const auth = parseRetreatAuth(req.body);
    if (!auth.churchName || !auth.passwd) {
      return res.status(400).json({ ok: false, message: '교회 이름과 비밀번호를 입력해 주세요.' });
    }

    const rows = await queryAsync(
      `SELECT id, churchName, passwd, ownerpw
       FROM retreatMain
       WHERE LOWER(TRIM(churchName)) = LOWER(TRIM(?)) AND passwd = ?
       LIMIT 1`,
      [auth.churchName, auth.passwd],
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: '교회 이름 또는 비밀번호가 올바르지 않습니다.' });
    }

    const row = rows[0];
    if (auth.ownerpw) {
      if (str(row.ownerpw) !== auth.ownerpw) {
        return res.status(401).json({ ok: false, message: '관리자 비밀번호가 올바르지 않습니다.' });
      }
      return res.json({
        ok: true,
        role: 'admin',
        churchName: str(row.churchName),
      });
    }

    return res.json({
      ok: true,
      role: 'user',
      churchName: str(row.churchName),
    });
  } catch (err) {
    console.error('POST /api/retreat/login', err);
    return res.status(500).json({ ok: false, message: '로그인에 실패했습니다.' });
  }
});

/** GET /api/retreat/list?churchName=&passwd= */
router.get('/list', async (req, res) => {
  try {
    const auth = parseRetreatAuthFromRequest(req);
    if (!auth.churchName || !auth.passwd) {
      return res.status(400).json({ ok: false, message: '교회 이름과 비밀번호가 필요합니다.' });
    }

    const rows = await queryAsync(
      `SELECT
         m.id,
         m.userAccount,
         m.orderTitle,
         m.ordererName,
         m.ordererPhone,
         m.churchName,
         m.link,
         m.created_at,
         m.updated_at,
         i.id AS infoId,
         i.eventName,
         i.bookletId AS infoBookletId
       FROM retreatMain m
       LEFT JOIN retreatInfo i ON CAST(m.id AS CHAR) = i.bookletId
       WHERE LOWER(TRIM(m.churchName)) = LOWER(TRIM(?)) AND m.passwd = ?
       ORDER BY m.created_at DESC, m.id DESC`,
      [auth.churchName, auth.passwd],
    );

    const list = rows.map((row) => ({
      id: row.id,
      userAccount: row.userAccount,
      orderTitle: row.orderTitle,
      ordererName: row.ordererName,
      ordererPhone: row.ordererPhone,
      churchName: row.churchName,
      link: row.link,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      hasInfo: row.infoId != null,
      eventName: row.eventName,
      infoId: row.infoId,
    }));

    return res.json({ ok: true, list });
  } catch (err) {
    console.error('GET /api/retreat/list', err);
    return res.status(500).json({ ok: false, message: '목록 조회에 실패했습니다.' });
  }
});

/** GET /api/retreat/detail/:bookletId?churchName=&passwd= */
router.get('/detail/:bookletId', async (req, res) => {
  try {
    const bookletId = parseInt(String(req.params.bookletId), 10);
    const auth = parseRetreatAuthFromRequest(req);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, auth);
    await ensureRetreatInfoColumns();

    const infoRows = await queryAsync(
      `SELECT * FROM retreatInfo WHERE bookletId = ? LIMIT 1`,
      [String(bookletId)],
    );
    const programRows = await queryAsync(
      `SELECT id, bookletId, showOrder, subTitle, title, dateTime, career, postImage, showDateTime
       FROM retreatProgram
       WHERE bookletId = ?
       ORDER BY CAST(showOrder AS UNSIGNED), id`,
      [String(bookletId)],
    );

    const main = sanitizeRetreatMain(await findRetreatMainById(bookletId));

    return res.json({
      ok: true,
      main,
      info: infoRows[0] || null,
      programs: programRows,
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('GET /api/retreat/detail', err);
    return res.status(status).json({ ok: false, message: err.message || '상세 조회에 실패했습니다.' });
  }
});

/** POST /api/retreat/info — JSON 또는 multipart(메인 이미지) */
router.post('/info', uploadRetreatInfo, async (req, res) => {
  try {
    const auth = parseRetreatAuthFromRequest(req);
    const bookletId = parseInt(String(req.body?.bookletId), 10);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, auth);
    await ensureRetreatInfoColumns();

    const infoRaw = req.body?.info;
    const info = typeof infoRaw === 'string' ? JSON.parse(infoRaw || '{}') : (infoRaw || {});

    const files = req.files || {};
    const mainSlots = parseImageMainNameSlots(req.body?.imageMainName ?? info.imageMain ?? '');
    const legacyMain = files.mainImage?.[0];
    if (legacyMain) mainSlots[0] = legacyMain.filename;
    for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i += 1) {
      const f = files[`mainImage_${i}`]?.[0];
      if (f) mainSlots[i] = f.filename;
    }
    const imageMain = serializeImageMainNameSlots(mainSlots);

    const bookletIdStr = String(bookletId);
    const fields = {
      eventName: info.eventName ?? '',
      eventNameEn: info.eventNameEn ?? '',
      date: info.date ?? '',
      place: info.place ?? '',
      superViser: info.superViser ?? '',
      address: info.address ?? '',
      quiry: info.quiry ?? '',
      placeNaver: info.placeNaver ?? '',
      placeKakao: info.placeKakao ?? '',
      programType: info.programType ?? 'concert',
      visibleTabs: info.visibleTabs ?? '',
      applyNote: info.applyNote ?? '',
      eventGreeting: info.eventGreeting ?? '',
      imageMain,
      userAccount: auth.churchName,
    };

    const existing = await queryAsync(
      `SELECT id FROM retreatInfo WHERE bookletId = ? LIMIT 1`,
      [bookletIdStr],
    );

    if (existing.length === 0) {
      const result = await queryResultAsync(
        `INSERT INTO retreatInfo (
           bookletId, eventName, eventNameEn, date, place, superViser, address, quiry,
           placeNaver, placeKakao, userAccount, programType, visibleTabs, applyNote, eventGreeting, imageMain
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookletIdStr,
          fields.eventName,
          fields.eventNameEn,
          fields.date,
          fields.place,
          fields.superViser,
          fields.address,
          fields.quiry,
          fields.placeNaver,
          fields.placeKakao,
          fields.userAccount,
          fields.programType,
          fields.visibleTabs,
          fields.applyNote,
          fields.eventGreeting,
          fields.imageMain,
        ],
      );
      return res.json({ ok: true, infoId: result.insertId, action: 'insert', imageMain });
    }

    await queryResultAsync(
      `UPDATE retreatInfo SET
         eventName = ?, eventNameEn = ?, date = ?, place = ?, superViser = ?, address = ?,
         quiry = ?, placeNaver = ?, placeKakao = ?, userAccount = ?, programType = ?,
         visibleTabs = ?, applyNote = ?, eventGreeting = ?, imageMain = ?
       WHERE bookletId = ?`,
      [
        fields.eventName,
        fields.eventNameEn,
        fields.date,
        fields.place,
        fields.superViser,
        fields.address,
        fields.quiry,
        fields.placeNaver,
        fields.placeKakao,
        fields.userAccount,
        fields.programType,
        fields.visibleTabs,
        fields.applyNote,
        fields.eventGreeting,
        fields.imageMain,
        bookletIdStr,
      ],
    );

    return res.json({ ok: true, infoId: existing[0].id, action: 'update', imageMain });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('POST /api/retreat/info', err);
    return res.status(status).json({ ok: false, message: err.message || '수련회 정보 저장에 실패했습니다.' });
  }
});

/** POST /api/retreat/programs */
router.post('/programs', async (req, res) => {
  try {
    const auth = parseRetreatAuthFromRequest(req);
    const bookletId = parseInt(String(req.body?.bookletId), 10);
    const programs = Array.isArray(req.body?.programs) ? req.body.programs : [];

    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, auth);

    const bookletIdStr = String(bookletId);
    await queryResultAsync(`DELETE FROM retreatProgram WHERE bookletId = ?`, [bookletIdStr]);

    for (let i = 0; i < programs.length; i += 1) {
      const p = programs[i] || {};
      await queryResultAsync(
        `INSERT INTO retreatProgram (
           bookletId, showOrder, subTitle, title, dateTime, career, postImage, showDateTime
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookletIdStr,
          String(p.showOrder ?? i),
          p.subTitle ?? '',
          p.title ?? '',
          p.dateTime ?? '',
          p.career ?? '',
          p.postImage ?? '',
          p.showDateTime === false || p.showDateTime === 0 ? 0 : 1,
        ],
      );
    }

    return res.json({ ok: true, count: programs.length });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('POST /api/retreat/programs', err);
    return res.status(status).json({ ok: false, message: err.message || '프로그램 저장에 실패했습니다.' });
  }
});

/** GET /api/retreat/public/:bookletId — 성도용 공개 전단지 (인증 없음) */
router.get('/public/:bookletId', async (req, res) => {
  try {
    const bookletId = parseInt(String(req.params.bookletId), 10);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await ensureRetreatInfoColumns();

    const main = sanitizeRetreatMain(await findRetreatMainById(bookletId));
    if (!main) {
      return res.status(404).json({ ok: false, message: '수련회 전단지를 찾을 수 없습니다.' });
    }

    const bookletIdStr = String(bookletId);
    const infoRows = await queryAsync(
      `SELECT * FROM retreatInfo WHERE bookletId = ? LIMIT 1`,
      [bookletIdStr],
    );
    const programRows = await queryAsync(
      `SELECT id, bookletId, showOrder, subTitle, title, dateTime, career, postImage, showDateTime
       FROM retreatProgram
       WHERE bookletId = ?
       ORDER BY CAST(showOrder AS UNSIGNED), id`,
      [bookletIdStr],
    );

    return res.json({
      ok: true,
      main,
      info: infoRows[0] || null,
      programs: programRows,
    });
  } catch (err) {
    console.error('GET /api/retreat/public/:bookletId', err);
    return res.status(500).json({ ok: false, message: '전단지 조회에 실패했습니다.' });
  }
});

/** POST /api/retreat/request-main — 사역자용 질문지 양식 저장 (UPSERT) */
router.post('/request-main', async (req, res) => {
  try {
    await ensureRetreatRequestMainTable();

    const auth = parseRetreatAuthFromRequest(req);
    const bookletId = parseInt(String(req.body?.bookletId), 10);
    const customQuestions = normalizeCustomQuestions(req.body?.customQuestions);

    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, auth);

    const bookletIdStr = String(bookletId);
    const questionsJson = JSON.stringify(customQuestions);
    const existing = await queryAsync(
      `SELECT id FROM retreatRequestMain WHERE bookletId = ? LIMIT 1`,
      [bookletIdStr],
    );

    if (existing.length === 0) {
      const result = await queryResultAsync(
        `INSERT INTO retreatRequestMain (bookletId, userAccount, customQuestions)
         VALUES (?, ?, ?)`,
        [bookletIdStr, auth.churchName, questionsJson],
      );
      return res.json({ ok: true, id: result.insertId, action: 'insert', customQuestions });
    }

    await queryResultAsync(
      `UPDATE retreatRequestMain
       SET customQuestions = ?, userAccount = ?
       WHERE bookletId = ?`,
      [questionsJson, auth.churchName, bookletIdStr],
    );
    return res.json({
      ok: true,
      id: existing[0].id,
      action: 'update',
      customQuestions,
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('POST /api/retreat/request-main', err);
    return res.status(status).json({ ok: false, message: err.message || '질문지 저장에 실패했습니다.' });
  }
});

/** GET /api/retreat/request-main/:bookletId — 성도용 질문지 양식 조회 (공개) */
router.get('/request-main/:bookletId', async (req, res) => {
  try {
    await ensureRetreatRequestMainTable();

    const bookletId = String(req.params.bookletId || '').trim();
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    const main = await findRetreatMainById(parseInt(bookletId, 10));
    if (!main) {
      return res.status(404).json({ ok: false, message: '수련회 전단지를 찾을 수 없습니다.' });
    }

    const rows = await queryAsync(
      `SELECT id, bookletId, userAccount, customQuestions, created_at, updated_at
       FROM retreatRequestMain
       WHERE bookletId = ?
       LIMIT 1`,
      [bookletId],
    );

    const row = rows[0] || null;
    const customQuestions = normalizeCustomQuestions(parseJsonField(row?.customQuestions, []));

    return res.json({
      ok: true,
      bookletId,
      customQuestions,
      updatedAt: row?.updated_at || null,
    });
  } catch (err) {
    console.error('GET /api/retreat/request-main/:bookletId', err);
    return res.status(500).json({ ok: false, message: '질문지 조회에 실패했습니다.' });
  }
});

/** POST /api/retreat/answer — 성도용 참가 신청 답변 제출 (공개) */
router.post('/answer', async (req, res) => {
  try {
    await ensureRetreatAnswerTable();

    const bookletId = String(req.body?.bookletId || '').trim();
    const userName = String(req.body?.userName || '').trim();
    const userPhone = String(req.body?.userPhone || '').trim();
    const userGroup = req.body?.userGroup != null ? String(req.body.userGroup).trim() : null;
    const userGender = req.body?.userGender != null ? String(req.body.userGender).trim() : null;
    const userAge = req.body?.userAge != null ? String(req.body.userAge).trim() : null;
    const note = req.body?.note != null ? String(req.body.note).trim() : null;
    const customAnswers = normalizeCustomAnswers(req.body?.customAnswers);

    if (!bookletId || !userName || !userPhone) {
      return res.status(400).json({
        ok: false,
        message: 'bookletId, userName, userPhone은 필수입니다.',
      });
    }

    const main = await findRetreatMainById(parseInt(bookletId, 10));
    if (!main) {
      return res.status(404).json({ ok: false, message: '수련회 전단지를 찾을 수 없습니다.' });
    }

    const result = await queryResultAsync(
      `INSERT INTO retreatAnswer (
         bookletId, userName, userPhone, userGroup, userGender, userAge, note, customAnswers
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookletId,
        userName,
        userPhone,
        userGroup,
        userGender,
        userAge,
        note,
        JSON.stringify(customAnswers),
      ],
    );

    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('POST /api/retreat/answer', err);
    return res.status(500).json({ ok: false, message: '참가 신청 등록에 실패했습니다.' });
  }
});

/** GET /api/retreat/answers/:bookletId?churchName=&passwd= — 사역자용 신청자 명단 */
router.get('/answers/:bookletId', async (req, res) => {
  try {
    await ensureRetreatAnswerTable();
    await ensureRetreatRequestMainTable();

    const bookletId = String(req.params.bookletId || '').trim();
    const auth = parseRetreatAuthFromRequest(req);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(parseInt(bookletId, 10), auth);

    const mainRows = await queryAsync(
      `SELECT customQuestions FROM retreatRequestMain WHERE bookletId = ? LIMIT 1`,
      [bookletId],
    );
    const customQuestions = normalizeCustomQuestions(
      parseJsonField(mainRows[0]?.customQuestions, []),
    );

    const rows = await queryAsync(
      `SELECT id, bookletId, userName, userPhone, userGroup, userGender, userAge, note, customAnswers, created_at
       FROM retreatAnswer
       WHERE bookletId = ?
       ORDER BY created_at DESC, id DESC`,
      [bookletId],
    );

    const list = rows.map((row) => ({
      id: row.id,
      bookletId: row.bookletId,
      userName: row.userName,
      userPhone: row.userPhone,
      userGroup: row.userGroup,
      userGender: row.userGender,
      userAge: row.userAge,
      note: row.note,
      customAnswers: normalizeCustomAnswers(row.customAnswers),
      created_at: row.created_at,
    }));

    return res.json({ ok: true, customQuestions, list });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('GET /api/retreat/answers/:bookletId', err);
    return res.status(status).json({ ok: false, message: err.message || '신청자 목록 조회에 실패했습니다.' });
  }
});

/** GET /api/retreat/requests/:bookletId?churchName=&passwd= */
router.get('/requests/:bookletId', async (req, res) => {
  try {
    await ensureRetreatRequestTable();

    const bookletId = String(req.params.bookletId || '').trim();
    const auth = parseRetreatAuthFromRequest(req);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(parseInt(bookletId, 10), auth);

    const rows = await queryAsync(
      `SELECT id, bookletId, userName, userPhone, userGroup, note, created_at
       FROM retreatRequest
       WHERE bookletId = ?
       ORDER BY created_at DESC, id DESC`,
      [bookletId],
    );

    return res.json({ ok: true, list: rows });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('GET /api/retreat/requests', err);
    return res.status(status).json({ ok: false, message: err.message || '신청자 목록 조회에 실패했습니다.' });
  }
});

/** POST /api/retreat/request — 성도용 공개 신청 */
router.post('/request', async (req, res) => {
  try {
    await ensureRetreatRequestTable();

    const bookletId = String(req.body?.bookletId || '').trim();
    const userName = String(req.body?.userName || '').trim();
    const userPhone = String(req.body?.userPhone || '').trim();
    const userGroup = req.body?.userGroup != null ? String(req.body.userGroup).trim() : null;
    const note = req.body?.note != null ? String(req.body.note).trim() : null;

    if (!bookletId || !userName || !userPhone) {
      return res.status(400).json({
        ok: false,
        message: 'bookletId, userName, userPhone은 필수입니다.',
      });
    }

    const main = await findRetreatMainById(parseInt(bookletId, 10));
    if (!main) {
      return res.status(404).json({ ok: false, message: '수련회 전단지를 찾을 수 없습니다.' });
    }

    const result = await queryResultAsync(
      `INSERT INTO retreatRequest (bookletId, userName, userPhone, userGroup, note)
       VALUES (?, ?, ?, ?, ?)`,
      [bookletId, userName, userPhone, userGroup, note],
    );

    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('POST /api/retreat/request', err);
    return res.status(500).json({ ok: false, message: '참가 신청 등록에 실패했습니다.' });
  }
});

module.exports = router;
