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
      serviceType, userAccount, churchName, passwd, ownerpw, ordererName, ordererPhone,
      orderTitle, orderName, supplyAmount, vatAmount, totalAmount,
      portonePaymentId, schedulePaymentId, billingKey, portoneScheduleId,
      portonePaidAt, portoneTimeToPay, plan, paymentStatus,
      resourceType, resourceId, customData, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      strOrNull(payload.serviceType, 64) || 'unknown',
      strOrNull(payload.userAccount, 255),
      strOrNull(payload.churchName, 255),
      strOrNull(payload.passwd, 32),
      strOrNull(payload.ownerpw, 64),
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
      serviceType, userAccount, churchName, passwd, ownerpw, ordererName, ordererPhone,
      orderTitle, orderName, supplyAmount, vatAmount, totalAmount,
      portonePaymentId, portoneTxId, portonePaidAt, paymentStatus,
      resourceType, resourceId, customData, memo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      strOrNull(payload.serviceType, 64) || 'unknown',
      strOrNull(payload.userAccount, 255),
      strOrNull(payload.churchName, 255),
      strOrNull(payload.passwd, 32),
      strOrNull(payload.ownerpw, 64),
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
const STATUS_REGISTERED = '등록';
const STATUS_MODIFIED = '수정됨';
const STATUS_DELETED = '삭제됨';
const ALLOWED_ADMIN_STATUSES = new Set([STATUS_REGISTERED, STATUS_MODIFIED, STATUS_DELETED]);

function splitAmountFromTotal(totalAmount) {
  const total = intOrNull(totalAmount);
  if (total == null || total < 1) return { supplyAmount: null, vatAmount: null };
  const supplyAmount = Math.round(total / 1.1);
  return { supplyAmount, vatAmount: total - supplyAmount };
}

function parseAdminStatus(customData) {
  if (customData == null || customData === '') return STATUS_REGISTERED;
  try {
    const parsed = typeof customData === 'string' ? JSON.parse(customData) : customData;
    const status = parsed && typeof parsed === 'object' ? String(parsed.adminStatus || '').trim() : '';
    return ALLOWED_ADMIN_STATUSES.has(status) ? status : STATUS_REGISTERED;
  } catch {
    return STATUS_REGISTERED;
  }
}

function mapAdminRow(row) {
  const split = splitAmountFromTotal(row.totalAmount);
  const supplyAmount = row.supplyAmount ?? split.supplyAmount;
  const vatAmount = row.vatAmount ?? split.vatAmount;
  return {
    id: row.id,
    paymentKind: row.paymentKind,
    serviceType: row.serviceType,
    orderName: row.orderName,
    userAccount: row.userAccount,
    churchName: row.churchName,
    ordererName: row.ordererName,
    ordererPhone: row.ordererPhone,
    amount: supplyAmount,
    vat: vatAmount,
    totalAmount: row.totalAmount,
    paymentStatus: row.paymentStatus,
    paymentId: row.portonePaymentId,
    billingKey: row.billingKey || null,
    memo: row.memo,
    status: parseAdminStatus(row.customData),
    createdAt: row.createdAt,
  };
}

/** 관리자 — 정기·단편 결제 통합 목록 */
async function listAdminPayments({ serviceType, limit = 100, offset = 0 } = {}) {
  await ensurePaymentTables();
  const lim = Math.max(1, Math.min(200, Number(limit) || 100));
  const off = Math.max(0, Number(offset) || 0);
  const params = [];
  let serviceFilterSql = '';
  if (serviceType) {
    serviceFilterSql = 'WHERE serviceType = ?';
    params.push(String(serviceType).trim());
  }

  const rows = await queryAsync(
    `SELECT * FROM (
      SELECT
        id, 'billing' AS paymentKind, serviceType, userAccount, churchName,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, billingKey, paymentStatus, customData, memo, createdAt
      FROM billingPayment
      ${serviceFilterSql}
      UNION ALL
      SELECT
        id, 'oneTime' AS paymentKind, serviceType, userAccount, churchName,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, NULL AS billingKey, paymentStatus, customData, memo, createdAt
      FROM oneTimePayment
      ${serviceFilterSql}
    ) AS combined
    ORDER BY createdAt DESC, id DESC
    LIMIT ? OFFSET ?`,
    serviceType ? [...params, ...params, lim, off] : [lim, off],
  );

  return rows.map(mapAdminRow);
}

async function deleteAdminPayment(paymentKind, id) {
  await ensurePaymentTables();
  const kind = String(paymentKind || '').trim();
  const rowId = Number(id);
  if (!Number.isFinite(rowId) || rowId < 1) throw new Error('id가 필요합니다.');

  const table = kind === 'billing' ? 'billingPayment' : kind === 'oneTime' ? 'oneTimePayment' : null;
  if (!table) throw new Error('paymentKind must be billing or oneTime');

  const result = await queryResultAsync(`DELETE FROM ${table} WHERE id = ?`, [rowId]);
  return result.affectedRows ?? 0;
}

async function setAdminStatusOnRow(table, whereSql, whereParams, status) {
  const rows = await queryAsync(
    `SELECT id, customData FROM ${table} WHERE ${whereSql} LIMIT 1`,
    whereParams,
  );
  if (rows.length === 0) return 0;

  let customData = {};
  try {
    const raw = rows[0].customData;
    customData = raw && typeof raw === 'object' ? { ...raw } : JSON.parse(String(raw || '{}'));
  } catch {
    customData = {};
  }
  customData.adminStatus = status;
  const result = await queryResultAsync(
    `UPDATE ${table} SET customData = ? WHERE id = ?`,
    [JSON.stringify(customData), rows[0].id],
  );
  return result.affectedRows ?? 0;
}

async function updateAdminPaymentStatus(payload) {
  await ensurePaymentTables();
  const status = String(payload?.status || '').trim();
  if (!status || !ALLOWED_ADMIN_STATUSES.has(status)) {
    throw new Error(`status must be one of: ${[...ALLOWED_ADMIN_STATUSES].join(', ')}`);
  }

  if (payload?.id != null && payload?.paymentKind) {
    const table = payload.paymentKind === 'billing' ? 'billingPayment' : 'oneTimePayment';
    return setAdminStatusOnRow(table, 'id = ?', [Number(payload.id)], status);
  }

  if (payload?.eventMainId != null && Number.isFinite(Number(payload.eventMainId))) {
    const st = String(payload.serviceType || 'bookletEvent').trim() || 'bookletEvent';
    let affected = await setAdminStatusOnRow(
      'oneTimePayment',
      "serviceType = ? AND resourceType = 'eventMain' AND resourceId = ?",
      [st, String(Number(payload.eventMainId))],
      status,
    );
    if (affected === 0) {
      affected = await setAdminStatusOnRow(
        'oneTimePayment',
        'serviceType = ? AND memo LIKE ?',
        [st, `%eventMainId=${Number(payload.eventMainId)}%`],
        status,
      );
    }
    return affected;
  }

  if (payload?.churchMainId != null && Number.isFinite(Number(payload.churchMainId))) {
    const st = String(payload.serviceType || 'bookletNotice').trim() || 'bookletNotice';
    let affected = await setAdminStatusOnRow(
      'billingPayment',
      "serviceType = ? AND resourceType = 'churchMain' AND resourceId = ?",
      [st, String(Number(payload.churchMainId))],
      status,
    );
    if (affected === 0) {
      affected = await setAdminStatusOnRow(
        'billingPayment',
        'serviceType = ? AND memo LIKE ?',
        [st, `%churchMainId=${Number(payload.churchMainId)}%`],
        status,
      );
    }
    return affected;
  }

  throw new Error('id+paymentKind 또는 (serviceType + churchMainId|eventMainId) 가 필요합니다.');
}

/** 레거시 serviceApply /record — 이미 PG 완료 시 서버가 저장했으면 중복 무시 */
async function recordLegacyServiceApply(body) {
  const portonePaymentId = strOrNull(body?.paymentId, 255);
  if (!portonePaymentId) throw new Error('paymentId is required');

  const billingKey = strOrNull(body?.billingKey, 512);
  const totalAmount = intOrNull(body?.totalAmount);
  const supplyAmount = intOrNull(body?.amount) ?? splitAmountFromTotal(totalAmount).supplyAmount;
  const vatAmount = intOrNull(body?.vat) ?? splitAmountFromTotal(totalAmount).vatAmount;

  const base = {
    serviceType: strOrNull(body?.serviceType, 64) || 'unknown',
    userAccount: strOrNull(body?.userAccount, 255),
    churchName: strOrNull(body?.churchName, 255),
    passwd: strOrNull(body?.passwd, 32),
    ownerpw: strOrNull(body?.ownerpw, 64),
    ordererName: strOrNull(body?.ordererName, 120),
    ordererPhone: strOrNull(body?.ordererPhone, 40),
    orderName: strOrNull(body?.orderName, 255),
    supplyAmount,
    vatAmount,
    totalAmount: totalAmount || (supplyAmount != null && vatAmount != null ? supplyAmount + vatAmount : null),
    portonePaymentId,
    paymentStatus: (strOrNull(body?.paymentStatus, 32) || 'PAID').toUpperCase(),
    memo: strOrNull(body?.memo, 5000),
    customData: { adminStatus: STATUS_REGISTERED },
  };

  if (billingKey) {
    const id = await safeInsertBillingPayment({ ...base, billingKey });
    return { id, paymentKind: 'billing' };
  }

  const id = await safeInsertOneTimePayment(base);
  return { id, paymentKind: 'oneTime' };
}

async function listMyPayments(userAccount, { limit = 100, offset = 0 } = {}) {
  await ensurePaymentTables();
  const account = strOrNull(userAccount, 255);
  if (!account) return [];

  const lim = Math.max(1, Math.min(200, Number(limit) || 100));
  const off = Math.max(0, Number(offset) || 0);

  const rows = await queryAsync(
    `SELECT * FROM (
      SELECT
        id, 'billing' AS paymentKind, serviceType, userAccount, churchName, passwd, ownerpw,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, NULL AS portoneTxId, plan, paymentStatus,
        resourceType, resourceId, createdAt
      FROM billingPayment
      WHERE LOWER(TRIM(userAccount)) = LOWER(TRIM(?))
      UNION ALL
      SELECT
        id, 'oneTime' AS paymentKind, serviceType, userAccount, churchName, passwd, ownerpw,
        ordererName, ordererPhone, orderTitle, orderName, supplyAmount, vatAmount,
        totalAmount, portonePaymentId, portoneTxId, NULL AS plan, paymentStatus,
        resourceType, resourceId, createdAt
      FROM oneTimePayment
      WHERE LOWER(TRIM(userAccount)) = LOWER(TRIM(?))
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
  listAdminPayments,
  deleteAdminPayment,
  updateAdminPaymentStatus,
  recordLegacyServiceApply,
  STATUS_REGISTERED,
};
