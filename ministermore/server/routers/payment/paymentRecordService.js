const { servicedb } = require('../dbdatas/servicedb');
const { ensurePaymentTables } = require('./paymentSchema');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    servicedb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryResultAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    servicedb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function strOrNull(v, maxLen) {
  if (v == null || String(v).trim() === '') return null;
  const s = String(v).trim();
  return maxLen != null ? s.slice(0, maxLen) : s;
}

function intOrNull(v) {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function jsonOrNull(v) {
  if (v == null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    try {
      JSON.parse(t);
      return t;
    } catch {
      return JSON.stringify({ raw: t.slice(0, 2000) });
    }
  }
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

async function insertBillingPayment(payload) {
  await ensurePaymentTables();
  const portonePaymentId = strOrNull(payload.portonePaymentId, 255);
  if (!portonePaymentId) throw new Error('portonePaymentId is required');

  const existing = await queryAsync(
    'SELECT id FROM billingPayment WHERE portonePaymentId = ? LIMIT 1',
    [portonePaymentId],
  );
  if (existing.length > 0) {
    const err = new Error('이미 등록된 정기결제입니다.');
    err.code = 'DUPLICATE_PORTONE';
    err.existingId = existing[0].id;
    throw err;
  }

  const totalAmount = intOrNull(payload.totalAmount);
  if (totalAmount == null || totalAmount < 1) throw new Error('totalAmount is required');

  const result = await queryResultAsync(
    `INSERT INTO billingPayment (
      serviceType, userAccount, churchName, ordererName, ordererPhone,
      orderTitle, orderName, supplyAmount, vatAmount, totalAmount,
      portonePaymentId, schedulePaymentId, billingKey, portoneScheduleId,
      portonePaidAt, portoneTimeToPay, plan, paymentStatus,
      resourceType, resourceId, customData, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      strOrNull(payload.serviceType, 64) || 'unknown',
      strOrNull(payload.userAccount, 255),
      strOrNull(payload.churchName, 255),
      strOrNull(payload.ordererName, 120),
      strOrNull(payload.ordererPhone, 40),
      strOrNull(payload.orderTitle, 255),
      strOrNull(payload.orderName, 255),
      intOrNull(payload.supplyAmount),
      intOrNull(payload.vatAmount),
      totalAmount,
      portonePaymentId,
      strOrNull(payload.schedulePaymentId, 255),
      strOrNull(payload.billingKey, 512),
      strOrNull(payload.portoneScheduleId, 255),
      strOrNull(payload.portonePaidAt, 64),
      strOrNull(payload.portoneTimeToPay, 64),
      strOrNull(payload.plan, 32) || 'monthly',
      strOrNull(payload.paymentStatus, 32) || 'PAID',
      strOrNull(payload.resourceType, 64),
      strOrNull(payload.resourceId, 64),
      jsonOrNull(payload.customData),
      strOrNull(payload.memo, 5000),
    ],
  );
  return result.insertId;
}

async function insertOneTimePayment(payload) {
  await ensurePaymentTables();
  const portonePaymentId = strOrNull(payload.portonePaymentId, 255);
  if (!portonePaymentId) throw new Error('portonePaymentId is required');

  const existing = await queryAsync(
    'SELECT id FROM oneTimePayment WHERE portonePaymentId = ? LIMIT 1',
    [portonePaymentId],
  );
  if (existing.length > 0) {
    const err = new Error('이미 등록된 단편결제입니다.');
    err.code = 'DUPLICATE_PORTONE';
    err.existingId = existing[0].id;
    throw err;
  }

  const totalAmount = intOrNull(payload.totalAmount);
  if (totalAmount == null || totalAmount < 1) throw new Error('totalAmount is required');

  const result = await queryResultAsync(
    `INSERT INTO oneTimePayment (
      serviceType, userAccount, churchName, ordererName, ordererPhone,
      orderTitle, orderName, supplyAmount, vatAmount, totalAmount,
      portonePaymentId, portoneTxId, portonePaidAt, paymentStatus,
      resourceType, resourceId, customData, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      strOrNull(payload.serviceType, 64) || 'unknown',
      strOrNull(payload.userAccount, 255),
      strOrNull(payload.churchName, 255),
      strOrNull(payload.ordererName, 120),
      strOrNull(payload.ordererPhone, 40),
      strOrNull(payload.orderTitle, 255),
      strOrNull(payload.orderName, 255),
      intOrNull(payload.supplyAmount),
      intOrNull(payload.vatAmount),
      totalAmount,
      portonePaymentId,
      strOrNull(payload.portoneTxId, 64),
      strOrNull(payload.portonePaidAt, 64),
      strOrNull(payload.paymentStatus, 32) || 'PAID',
      strOrNull(payload.resourceType, 64),
      strOrNull(payload.resourceId, 64),
      jsonOrNull(payload.customData),
      strOrNull(payload.memo, 5000),
    ],
  );
  return result.insertId;
}

async function safeInsertBillingPayment(payload) {
  try {
    return await insertBillingPayment(payload);
  } catch (err) {
    if (err && err.code === 'DUPLICATE_PORTONE') return err.existingId;
    console.error('billingPayment INSERT failed:', err);
    return null;
  }
}

async function safeInsertOneTimePayment(payload) {
  try {
    return await insertOneTimePayment(payload);
  } catch (err) {
    if (err && err.code === 'DUPLICATE_PORTONE') return err.existingId;
    console.error('oneTimePayment INSERT failed:', err);
    return null;
  }
}

/** 마이페이지 — 계정별 정기·단편 결제 통합 목록 */
async function listMyPayments(userAccount, { limit = 100, offset = 0 } = {}) {
  await ensurePaymentTables();
  const account = strOrNull(userAccount, 255);
  if (!account) return [];

  const lim = Math.max(1, Math.min(200, Number(limit) || 100));
  const off = Math.max(0, Number(offset) || 0);

  const rows = await queryAsync(
    `SELECT * FROM (
      SELECT
        id, 'billing' AS paymentKind, serviceType, userAccount, churchName,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, NULL AS portoneTxId, plan, paymentStatus,
        resourceType, resourceId, createdAt
      FROM billingPayment
      WHERE userAccount = ?
      UNION ALL
      SELECT
        id, 'oneTime' AS paymentKind, serviceType, userAccount, churchName,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, portoneTxId, NULL AS plan, paymentStatus,
        resourceType, resourceId, createdAt
      FROM oneTimePayment
      WHERE userAccount = ?
    ) AS combined
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?`,
    [account, account, lim, off],
  );

  return rows.map((row) => ({
    ...row,
    billingKey: undefined,
  }));
}

module.exports = {
  insertBillingPayment,
  insertOneTimePayment,
  safeInsertBillingPayment,
  safeInsertOneTimePayment,
  listMyPayments,
};
