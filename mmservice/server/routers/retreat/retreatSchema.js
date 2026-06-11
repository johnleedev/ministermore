const { retreatdb } = require('../dbdatas/retreatdb');

let requestTableEnsured = false;
let requestMainTableEnsured = false;
let answerTableEnsured = false;
let infoColumnsEnsured = false;

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

const CREATE_RETREAT_REQUEST_MAIN_SQL = `
  CREATE TABLE IF NOT EXISTS retreatRequestMain (
    id int NOT NULL AUTO_INCREMENT,
    bookletId varchar(11) NOT NULL COMMENT 'retreatMain 테이블의 id와 매칭',
    userAccount varchar(100) DEFAULT NULL COMMENT '사역자 계정',
    customQuestions json DEFAULT NULL COMMENT '구글폼 형식의 동적 질문 양식 목록 (JSON 배열)',
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_bookletId (bookletId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_RETREAT_ANSWER_SQL = `
  CREATE TABLE IF NOT EXISTS retreatAnswer (
    id int NOT NULL AUTO_INCREMENT,
    bookletId varchar(11) NOT NULL COMMENT 'retreatMain 테이블의 id와 매칭',
    userName varchar(50) NOT NULL COMMENT '기본정보: 이름',
    userPhone varchar(50) NOT NULL COMMENT '기본정보: 연락처',
    userGroup varchar(100) DEFAULT NULL COMMENT '기본정보: 소속부서',
    userGender varchar(20) DEFAULT NULL COMMENT '기본정보: 성별',
    userAge varchar(20) DEFAULT NULL COMMENT '기본정보: 나이',
    note text COMMENT '기본정보: 건의/기도제목',
    customAnswers json DEFAULT NULL COMMENT '커스텀 질문에 대해 성도가 입력한 답변 데이터 (JSON 객체)',
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_retreatanswer_booklet (bookletId)
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
  if (requestTableEnsured) return;
  await queryAsync(CREATE_RETREAT_REQUEST_SQL);
  requestTableEnsured = true;
}

async function ensureRetreatRequestMainTable() {
  if (requestMainTableEnsured) return;
  await queryAsync(CREATE_RETREAT_REQUEST_MAIN_SQL);
  requestMainTableEnsured = true;
}

async function ensureRetreatAnswerTable() {
  if (answerTableEnsured) return;
  await queryAsync(CREATE_RETREAT_ANSWER_SQL);
  await ensureRetreatAnswerColumns();
  answerTableEnsured = true;
}

async function ensureRetreatAnswerColumns() {
  const rows = await queryAsync(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'retreatAnswer'`,
  );
  const have = new Set((rows || []).map((r) => r.c));

  if (have.has('userChurch')) {
    try {
      await queryAsync('ALTER TABLE retreatAnswer DROP COLUMN `userChurch`');
    } catch (err) {
      console.error('ALTER retreatAnswer DROP userChurch:', err.message);
    }
  }

  const needed = [
    ['userGender', 'varchar(20) DEFAULT NULL COMMENT \'기본정보: 성별\''],
    ['userAge', 'varchar(20) DEFAULT NULL COMMENT \'기본정보: 나이\''],
  ];

  for (const [name, def] of needed) {
    if (have.has(name)) continue;
    try {
      await queryAsync(`ALTER TABLE retreatAnswer ADD COLUMN \`${name}\` ${def}`);
      have.add(name);
    } catch (err) {
      console.error(`ALTER retreatAnswer ADD ${name}:`, err.message);
    }
  }
}

async function ensureRetreatInfoColumns() {
  if (infoColumnsEnsured) return;

  const rows = await queryAsync(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'retreatInfo'`,
  );
  const have = new Set((rows || []).map((r) => r.c));
  const needed = [['imageMain', 'TEXT NULL']];

  for (const [name, def] of needed) {
    if (have.has(name)) continue;
    try {
      await queryAsync(`ALTER TABLE retreatInfo ADD COLUMN \`${name}\` ${def}`);
      have.add(name);
    } catch (err) {
      console.error(`ALTER retreatInfo ADD ${name}:`, err.message);
    }
  }

  infoColumnsEnsured = true;
}

module.exports = {
  ensureRetreatRequestTable,
  ensureRetreatRequestMainTable,
  ensureRetreatAnswerTable,
  ensureRetreatInfoColumns,
};
