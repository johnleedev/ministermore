const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { commondb } = require('../dbdatas/commondb');
const { bookletnoticedb, bookleteventdb } = require('../dbdatas/bookletdb');
const { homeinappdb } = require('../dbdatas/homeinappdb');

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/** commondb 외 다른 풀에서 조회 */
function queryPool(pool, sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

/** `serviceApply.status` 허용값 — 클라이언트와 합의된 한글 라벨 */
const STATUS_REGISTERED = '등록';
const STATUS_MODIFIED = '수정됨';
const STATUS_DELETED = '삭제됨';
const ALLOWED_STATUSES = new Set([STATUS_REGISTERED, STATUS_MODIFIED, STATUS_DELETED]);

router.post('/record', async (req, res) => {
  try {
    const {
      serviceType,
      orderName,
      userAccount,
      churchName,
      ordererName,
      ordererPhone,
      amount,
      vat,
      totalAmount,
      paymentStatus,
      paymentId,
      billingKey,
      memo,
      status,
    } = req.body || {};

    const normalizedServiceType = String(serviceType || '').trim();
    if (!normalizedServiceType) {
      return res.status(400).json({ ok: false, message: 'serviceType is required' });
    }

    const normalizedStatus =
      status != null && String(status).trim() ? String(status).trim().slice(0, 32) : STATUS_REGISTERED;

    const result = await queryAsync(
      `INSERT INTO serviceApply (
        serviceType, orderName, userAccount, churchName, ordererName, ordererPhone,
        amount, vat, totalAmount, paymentStatus, paymentId, billingKey, memo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedServiceType,
        orderName != null ? String(orderName).trim().slice(0, 255) : null,
        userAccount != null ? String(userAccount).trim().slice(0, 255) : null,
        churchName != null ? String(churchName).trim().slice(0, 255) : null,
        ordererName != null ? String(ordererName).trim().slice(0, 120) : null,
        ordererPhone != null ? String(ordererPhone).trim().slice(0, 40) : null,
        Number.isFinite(Number(amount)) ? Number(amount) : null,
        Number.isFinite(Number(vat)) ? Number(vat) : null,
        Number.isFinite(Number(totalAmount)) ? Number(totalAmount) : null,
        paymentStatus != null ? String(paymentStatus).trim().slice(0, 32) : 'paid',
        paymentId != null ? String(paymentId).trim().slice(0, 255) : null,
        billingKey != null ? String(billingKey).trim().slice(0, 255) : null,
        memo != null ? String(memo).trim().slice(0, 5000) : null,
        normalizedStatus,
      ]
    );

    return res.status(200).json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error('serviceapply /record error:', error);
    return res.status(500).json({ ok: false, message: 'failed to save service apply record' });
  }
});

/**
 * 상태 변경:
 *   - id 가 주어지면 해당 행을 UPDATE
 *   - 또는 (serviceType + churchMainId | eventMainId) 로 memo 매칭 후 UPDATE
 *
 * memo 규약: NoticeCreate/EventCreate 등록 시 `churchMainId=N` / `eventMainId=N` 가 저장됨
 */
router.post('/updateStatus', async (req, res) => {
  try {
    const { id, serviceType, churchMainId, eventMainId, status } = req.body || {};
    const newStatus = String(status || '').trim().slice(0, 32);
    if (!newStatus) {
      return res.status(400).json({ ok: false, message: 'status is required' });
    }
    if (ALLOWED_STATUSES.size > 0 && !ALLOWED_STATUSES.has(newStatus)) {
      return res.status(400).json({ ok: false, message: `status must be one of: ${[...ALLOWED_STATUSES].join(', ')}` });
    }

    let result;
    if (id != null && Number.isFinite(Number(id))) {
      result = await queryAsync('UPDATE serviceApply SET status = ? WHERE id = ?', [newStatus, Number(id)]);
    } else if (churchMainId != null && Number.isFinite(Number(churchMainId))) {
      const st = String(serviceType || 'bookletNotice').trim() || 'bookletNotice';
      result = await queryAsync(
        'UPDATE serviceApply SET status = ? WHERE serviceType = ? AND memo LIKE ?',
        [newStatus, st, `%churchMainId=${Number(churchMainId)}%`]
      );
    } else if (eventMainId != null && Number.isFinite(Number(eventMainId))) {
      const st = String(serviceType || 'bookletEvent').trim() || 'bookletEvent';
      result = await queryAsync(
        'UPDATE serviceApply SET status = ? WHERE serviceType = ? AND memo LIKE ?',
        [newStatus, st, `%eventMainId=${Number(eventMainId)}%`]
      );
    } else {
      return res.status(400).json({ ok: false, message: 'id 또는 (serviceType + churchMainId|eventMainId) 가 필요합니다.' });
    }

    return res.status(200).json({ ok: true, affectedRows: result?.affectedRows ?? 0 });
  } catch (error) {
    console.error('serviceapply /updateStatus error:', error);
    return res.status(500).json({ ok: false, message: 'failed to update service apply status' });
  }
});

/** 관리자: 단일 행 영구 삭제 */
router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (id == null || !Number.isFinite(Number(id))) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }
    const result = await queryAsync('DELETE FROM serviceApply WHERE id = ?', [Number(id)]);
    return res.status(200).json({ ok: true, affectedRows: result?.affectedRows ?? 0 });
  } catch (error) {
    console.error('serviceapply /delete error:', error);
    return res.status(500).json({ ok: false, message: 'failed to delete service apply record' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit);
    const rawOffset = Number(req.query.offset);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 100;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const serviceType = String(req.query.serviceType || '').trim();

    const where = [];
    const params = [];
    if (serviceType) {
      where.push('serviceType = ?');
      params.push(serviceType);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAsync(
      `SELECT id, serviceType, orderName, userAccount, churchName, ordererName, ordererPhone,
              amount, vat, totalAmount, paymentStatus, paymentId, billingKey, memo, status, createdAt
         FROM serviceApply
         ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({ ok: true, rows });
  } catch (error) {
    console.error('serviceapply /list error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch service apply list' });
  }
});

/**
 * 관리자: 서비스별 실데이터 상세 목록
 * ?kind=homeinapp | churchapp | bookletNotice | bookletevent
 */
router.get('/admin/service-detail', async (req, res) => {
  const kind = String(req.query.kind || '').trim();
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 300;

  try {
    if (kind === 'homeinapp') {
      const rows = await queryPool(
        homeinappdb,
        'SELECT * FROM churches ORDER BY created_at DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    if (kind === 'churchapp') {
      return res.status(200).json({ ok: true, rows: [] });
    }
    if (kind === 'bookletNotice') {
      const rows = await queryPool(
        bookletnoticedb,
        'SELECT * FROM churchMain ORDER BY id DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    if (kind === 'bookletEvent') {
      const rows = await queryPool(
        bookleteventdb,
        'SELECT * FROM eventMain ORDER BY id DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    return res.status(400).json({
      ok: false,
      message: 'kind must be one of: homeinapp, churchapp, bookletNotice, bookletevent',
    });
  } catch (error) {
    console.error('serviceapply /admin/service-detail error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch service detail rows' });
  }
});

module.exports = router;
