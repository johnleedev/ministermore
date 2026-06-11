const { bookleteventdb } = require('../dbdatas/bookletdb');
const { retreatdb } = require('../dbdatas/retreatdb');

function queryEventAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    bookleteventdb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryRetreatAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    retreatdb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryRetreatResultAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    retreatdb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function str(value) {
  return value == null ? '' : String(value).trim();
}

async function fetchPaidRetreatEventMains(userAccount) {
  const account = str(userAccount);
  if (!account) return [];

  return queryEventAsync(
    `SELECT
       m.id,
       m.userAccount,
       m.orderTitle,
       m.ordererName,
       m.ordererPhone,
       m.link,
       m.created_at,
       m.updated_at,
       i.eventName,
       i.eventNameEn,
       i.date,
       i.place,
       i.superViser,
       i.address,
       i.quiry,
       i.placeNaver,
       i.placeKakao,
       i.programType,
       i.visibleTabs,
       i.applyNote,
       i.eventGreeting,
       i.imageMain
     FROM eventMain m
     LEFT JOIN eventInfo i ON i.bookletId = CAST(m.id AS CHAR)
     WHERE LOWER(TRIM(m.userAccount)) = LOWER(TRIM(?))
       AND LOWER(TRIM(COALESCE(m.eventBookletType, ''))) = 'retreat'
     ORDER BY m.id DESC`,
    [account],
  );
}

async function upsertRetreatMainFromEvent(row) {
  const id = Number(row.id);
  if (!Number.isFinite(id) || id < 1) return;

  const existing = await queryRetreatAsync('SELECT id FROM retreatMain WHERE id = ? LIMIT 1', [id]);
  const values = [
    str(row.userAccount),
    str(row.orderTitle),
    str(row.ordererName),
    str(row.ordererPhone),
    row.link != null ? String(row.link) : null,
  ];

  if (existing.length === 0) {
    await queryRetreatResultAsync(
      `INSERT INTO retreatMain (
         id, userAccount, orderTitle, ordererName, ordererPhone, link, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        row.created_at || new Date(),
        row.updated_at || row.created_at || new Date(),
      ],
    );
    return;
  }

  await queryRetreatResultAsync(
    `UPDATE retreatMain
     SET userAccount = ?, orderTitle = ?, ordererName = ?, ordererPhone = ?, link = ?
     WHERE id = ?`,
    [...values, id],
  );
}

/**
 * 결제 건의 eventInfo → retreatInfo 최소 동기화.
 * visibleTabs·userAccount·programType만 반영하고, 일정·장소·주소·인도자·문의 등
 * 본문 필드는 편집기(RetreatEdit)에서만 저장한다. eventInfo 본문을 덮어쓰지 않는다.
 */
async function upsertRetreatInfoFromEvent(row) {
  const bookletId = String(row.id);
  const visibleTabs = row.visibleTabs != null ? String(row.visibleTabs) : '';
  const userAccount = str(row.userAccount);
  const programType = str(row.programType) || 'concert';

  const existing = await queryRetreatAsync(
    'SELECT id, visibleTabs FROM retreatInfo WHERE bookletId = ? LIMIT 1',
    [bookletId],
  );

  if (existing.length === 0) {
    await queryRetreatResultAsync(
      `INSERT INTO retreatInfo (
         bookletId, eventName, eventNameEn, date, place, superViser, address, quiry,
         placeNaver, placeKakao, userAccount, programType, visibleTabs, applyNote, eventGreeting, imageMain
       ) VALUES (?, '', '', '', '', '', '', '', '', '', ?, ?, ?, '', '', '')`,
      [bookletId, userAccount, programType, visibleTabs],
    );
    return;
  }

  if (!str(existing[0].visibleTabs) && visibleTabs) {
    await queryRetreatResultAsync(
      'UPDATE retreatInfo SET visibleTabs = ? WHERE bookletId = ?',
      [visibleTabs, bookletId],
    );
  }
}

/**
 * 결제 완료 건을 bookletretreat.retreatMain / retreatInfo 로 동기화한다.
 * retreatMain: 주문 메타. retreatInfo: visibleTabs 등 최소 메타만(본문 필드 미복사).
 */
async function syncRetreatBookletsFromPayments(userAccount) {
  const rows = await fetchPaidRetreatEventMains(userAccount);
  for (const row of rows) {
    await upsertRetreatMainFromEvent(row);
    await upsertRetreatInfoFromEvent(row);
  }
  return rows.length;
}

module.exports = {
  syncRetreatBookletsFromPayments,
};
