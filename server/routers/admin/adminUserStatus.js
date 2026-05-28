/** DB adminusers.status → pending | active | rejected (AdminUser.js와 동일 규칙) */
function canonicalAdminStatusFromDb(dbStatus) {
  const s = String(dbStatus ?? '').trim();
  if (!s) return 'pending';

  if (/^active$/i.test(s)) return 'active';
  if (/^pending$/i.test(s)) return 'pending';
  if (/^rejected$/i.test(s)) return 'rejected';

  if (/reject|거절/i.test(s)) return 'rejected';
  if (/pending|대기|waiting/i.test(s) && !/완료|approved|active|활성/i.test(s)) {
    return 'pending';
  }
  if (/active|approved|활성/i.test(s)) return 'active';
  if (/승인\s*완료|승인완료/i.test(s)) return 'active';
  if (/승인/i.test(s) && !/대기|pending/i.test(s)) return 'active';

  return 'pending';
}

function isActiveAdminStatus(dbStatus) {
  return canonicalAdminStatusFromDb(dbStatus) === 'active';
}

module.exports = {
  canonicalAdminStatusFromDb,
  isActiveAdminStatus,
};
