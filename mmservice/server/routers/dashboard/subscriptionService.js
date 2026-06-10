const { commondb } = require('../dbdatas/commondb');
const { ensureUserSubscriptionsTable } = require('./subscriptionSchema');
const { formatDateOnly, isNotExpired } = require('./subscriptionDate');

const DEFAULT_SUBSCRIPTION_TYPES = [
  'FLYER_RETREAT',
  'CHURCH_APP',
  'ATTENDANCE',
  'FLYER_INTRO',
  'FLYER_EVENT',
];

/** 이전 service_type → 신규 5종 (기존 DB 행 호환) */
const LEGACY_SERVICE_TYPE_MAP = {
  RETREAT: 'FLYER_RETREAT',
  PUSH: 'CHURCH_APP',
  FLYER: 'FLYER_INTRO',
  EVENT: 'FLYER_EVENT',
};

function normalizeServiceType(raw) {
  const type = String(raw || '').trim().toUpperCase();
  if (!type) return '';
  return LEGACY_SERVICE_TYPE_MAP[type] || type;
}

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function emptySubscriptions() {
  const base = { hasAccess: false, expireDate: null };
  return Object.fromEntries(DEFAULT_SUBSCRIPTION_TYPES.map((t) => [t, { ...base }]));
}

/**
 * DB status + expire_date 기준 접근 권한
 * - status 가 ACTIVE 이고 만료일이 지나지 않았을 때만 hasAccess true
 */
function resolveHasAccess(status, expireDate) {
  const normalizedStatus = String(status || '').trim().toUpperCase();
  if (normalizedStatus !== 'ACTIVE') return false;
  return isNotExpired(expireDate);
}

function mergeAccess(current, incoming) {
  if (incoming.hasAccess && !current.hasAccess) return incoming;
  if (current.hasAccess && !incoming.hasAccess) return current;
  if (incoming.hasAccess && current.hasAccess) {
    const cur = current.expireDate || '';
    const next = incoming.expireDate || '';
    return {
      hasAccess: true,
      expireDate: next >= cur ? incoming.expireDate : current.expireDate,
    };
  }
  return current.expireDate ? current : incoming;
}

/**
 * @param {string} userId - 로그인 userAccount (common.user.userAccount 와 동일)
 */
async function getUserSubscriptions(userId) {
  await ensureUserSubscriptionsTable();

  const user_id = String(userId || '').trim();
  if (!user_id) {
    return { userId: '', subscriptions: emptySubscriptions() };
  }

  const rows = await queryAsync(
    `SELECT service_type, expire_date, status
     FROM user_subscriptions
     WHERE LOWER(TRIM(user_id)) = LOWER(TRIM(?))`,
    [user_id],
  );

  const subscriptions = emptySubscriptions();

  for (const row of rows) {
    const type = normalizeServiceType(row.service_type);
    if (!type || !DEFAULT_SUBSCRIPTION_TYPES.includes(type)) continue;

    const expireDate = formatDateOnly(row.expire_date);
    const access = {
      hasAccess: resolveHasAccess(row.status, expireDate),
      expireDate,
    };

    subscriptions[type] = mergeAccess(subscriptions[type], access);
  }

  return { userId: user_id, subscriptions };
}

module.exports = {
  getUserSubscriptions,
  emptySubscriptions,
  resolveHasAccess,
  DEFAULT_SUBSCRIPTION_TYPES,
  normalizeServiceType,
};
