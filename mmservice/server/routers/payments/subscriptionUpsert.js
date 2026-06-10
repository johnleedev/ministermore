const { commondb } = require('../dbdatas/commondb');
const { ensureUserSubscriptionsTable } = require('../dashboard/subscriptionSchema');
const { formatDateOnly } = require('../dashboard/subscriptionDate');
const { normalizeServiceType } = require('../dashboard/subscriptionService');

const SERVICE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{0,31}$/;

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryResultAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function addMonthsToDate(baseDate, months) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + months);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {{ userId: string, serviceType: string, durationMonths: number }} payload
 */
async function upsertUserSubscription(payload) {
  await ensureUserSubscriptionsTable();

  const user_id = String(payload.userId || '').trim();
  const service_type = normalizeServiceType(payload.serviceType);
  const months = Math.max(1, parseInt(String(payload.durationMonths), 10) || 1);

  if (!user_id) throw new Error('userId is required');
  if (!service_type || !SERVICE_TYPE_PATTERN.test(service_type)) {
    throw new Error('serviceType 형식이 올바르지 않습니다.');
  }

  const userRows = await queryAsync(
    `SELECT id, service_type, expire_date, status
     FROM user_subscriptions
     WHERE LOWER(TRIM(user_id)) = LOWER(TRIM(?))`,
    [user_id],
  );

  const existing = userRows.find(
    (row) => normalizeServiceType(row.service_type) === service_type,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let extendFrom = today;
  if (existing) {
    const currentExpire = formatDateOnly(existing.expire_date);
    if (currentExpire) {
      const [y, m, d] = currentExpire.split('-').map(Number);
      const expDate = new Date(y, m - 1, d);
      if (!Number.isNaN(expDate.getTime()) && expDate >= today) {
        extendFrom = expDate;
      }
    }
  }

  const expire_date = addMonthsToDate(extendFrom, months);

  if (!existing) {
    const result = await queryResultAsync(
      `INSERT INTO user_subscriptions (user_id, service_type, expire_date, status)
       VALUES (?, ?, ?, 'ACTIVE')`,
      [user_id, service_type, expire_date],
    );
    return {
      action: 'insert',
      id: result.insertId,
      userId: user_id,
      serviceType: service_type,
      expireDate: expire_date,
      durationMonths: months,
    };
  }

  await queryResultAsync(
    `UPDATE user_subscriptions
     SET service_type = ?, expire_date = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [service_type, expire_date, existing.id],
  );

  return {
    action: 'update',
    id: existing.id,
    userId: user_id,
    serviceType: service_type,
    expireDate: expire_date,
    durationMonths: months,
  };
}

module.exports = {
  upsertUserSubscription,
};
