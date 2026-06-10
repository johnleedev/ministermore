const { commondb } = require('../dbdatas/commondb');

let ensured = false;

const CREATE_USER_SUBSCRIPTIONS_SQL = `
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL COMMENT 'common.user.userAccount',
    service_type VARCHAR(32) NOT NULL,
    expire_date DATE NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_service (user_id, service_type),
    KEY idx_user_id (user_id),
    KEY idx_status_expire (status, expire_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureUserSubscriptionsTable() {
  if (ensured) return;
  await queryAsync(CREATE_USER_SUBSCRIPTIONS_SQL);
  try {
    await queryAsync(
      `ALTER TABLE user_subscriptions
       MODIFY COLUMN service_type VARCHAR(32) NOT NULL`,
    );
  } catch (_) {
    /* 테이블이 없거나 이미 VARCHAR 인 경우 무시 */
  }
  ensured = true;
}

module.exports = {
  ensureUserSubscriptionsTable,
  CREATE_USER_SUBSCRIPTIONS_SQL,
};
