const express = require('express');
const cors = require('cors');
const { retreatdb } = require('../dbdatas/retreatdb');
const { ensureRetreatRequestTable } = require('./retreatSchema');

const router = express.Router();
router.use(cors());
router.use(express.json());

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

async function findRetreatMainById(bookletId) {
  const rows = await queryAsync(
    `SELECT id, userAccount, orderTitle, ordererName, ordererPhone, link, created_at, updated_at
     FROM retreatMain WHERE id = ? LIMIT 1`,
    [bookletId],
  );
  return rows[0] || null;
}

async function assertOwner(bookletId, userAccount) {
  const account = String(userAccount || '').trim();
  if (!account) {
    const err = new Error('userAccount가 필요합니다.');
    err.status = 400;
    throw err;
  }
  const main = await findRetreatMainById(bookletId);
  if (!main) {
    const err = new Error('수련회 전단지를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (String(main.userAccount || '').trim() !== account) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  return main;
}

/** GET /api/retreat/list?userAccount= */
router.get('/list', async (req, res) => {
  try {
    const userAccount = String(req.query.userAccount || '').trim();
    if (!userAccount) {
      return res.status(400).json({ ok: false, message: 'userAccount가 필요합니다.' });
    }

    const rows = await queryAsync(
      `SELECT
         m.id,
         m.userAccount,
         m.orderTitle,
         m.ordererName,
         m.ordererPhone,
         m.link,
         m.created_at,
         m.updated_at,
         i.id AS infoId,
         i.eventName,
         i.bookletId AS infoBookletId
       FROM retreatMain m
       LEFT JOIN retreatInfo i ON CAST(m.id AS CHAR) = i.bookletId
       WHERE m.userAccount = ?
       ORDER BY m.created_at DESC, m.id DESC`,
      [userAccount],
    );

    const list = rows.map((row) => ({
      id: row.id,
      userAccount: row.userAccount,
      orderTitle: row.orderTitle,
      ordererName: row.ordererName,
      ordererPhone: row.ordererPhone,
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

/** GET /api/retreat/detail/:bookletId?userAccount= */
router.get('/detail/:bookletId', async (req, res) => {
  try {
    const bookletId = parseInt(String(req.params.bookletId), 10);
    const userAccount = String(req.query.userAccount || '').trim();
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, userAccount);

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

    const main = await findRetreatMainById(bookletId);

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

/** POST /api/retreat/info */
router.post('/info', async (req, res) => {
  try {
    const userAccount = String(req.body?.userAccount || '').trim();
    const bookletId = parseInt(String(req.body?.bookletId), 10);
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, userAccount);

    const info = req.body?.info || {};
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
      userAccount,
    };

    const existing = await queryAsync(
      `SELECT id FROM retreatInfo WHERE bookletId = ? LIMIT 1`,
      [bookletIdStr],
    );

    if (existing.length === 0) {
      const result = await queryResultAsync(
        `INSERT INTO retreatInfo (
           bookletId, eventName, eventNameEn, date, place, superViser, address, quiry,
           placeNaver, placeKakao, userAccount, programType, visibleTabs, applyNote, eventGreeting
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ],
      );
      return res.json({ ok: true, infoId: result.insertId, action: 'insert' });
    }

    await queryResultAsync(
      `UPDATE retreatInfo SET
         eventName = ?, eventNameEn = ?, date = ?, place = ?, superViser = ?, address = ?,
         quiry = ?, placeNaver = ?, placeKakao = ?, userAccount = ?, programType = ?,
         visibleTabs = ?, applyNote = ?, eventGreeting = ?
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
        bookletIdStr,
      ],
    );

    return res.json({ ok: true, infoId: existing[0].id, action: 'update' });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('POST /api/retreat/info', err);
    return res.status(status).json({ ok: false, message: err.message || '수련회 정보 저장에 실패했습니다.' });
  }
});

/** POST /api/retreat/programs */
router.post('/programs', async (req, res) => {
  try {
    const userAccount = String(req.body?.userAccount || '').trim();
    const bookletId = parseInt(String(req.body?.bookletId), 10);
    const programs = Array.isArray(req.body?.programs) ? req.body.programs : [];

    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(bookletId, userAccount);

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

/** GET /api/retreat/requests/:bookletId?userAccount= */
router.get('/requests/:bookletId', async (req, res) => {
  try {
    await ensureRetreatRequestTable();

    const bookletId = String(req.params.bookletId || '').trim();
    const userAccount = String(req.query.userAccount || '').trim();
    if (!bookletId) {
      return res.status(400).json({ ok: false, message: 'bookletId가 필요합니다.' });
    }

    await assertOwner(parseInt(bookletId, 10), userAccount);

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
