const { retreatdb } = require('../dbdatas/retreatdb');

let ensured = false;

const CREATE_RETREAT_REQUEST_SQL = `
  CREATE TABLE IF NOT EXISTS retreatRequest (
    id int NOT NULL AUTO_INCREMENT,
    bookletId varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    userName varchar(50) NOT NULL,
    userPhone varchar(50) NOT NULL,
    userGroup varchar(100) DEFAULT NULL,
    note text,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_retreatrequest_booklet (bookletId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    retreatdb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureRetreatRequestTable() {
  if (ensured) return;
  await queryAsync(CREATE_RETREAT_REQUEST_SQL);
  ensured = true;
}

module.exports = {
  ensureRetreatRequestTable,
};
