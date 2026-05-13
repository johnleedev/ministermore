/**
 * NoticeCreate / 전단지(bookletnoticecreate) 라우트에서 공통으로 쓰는 ID 유틸 / churchMain 공통 INSERT
 *
 * churchMain 확장 컬럼 (portoneTxId 제거 후 예시):
 *   schedulePaymentId VARCHAR(255) NULL,
 *   billingKey VARCHAR(512) NULL,
 *   portonePaidAt VARCHAR(64) NULL,
 *   portoneTimeToPay VARCHAR(64) NULL,
 *   portoneScheduleId VARCHAR(255) NULL
 */

function toChurchMainIdInt(v) {
  if (v == null || v === '') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

/**
 * `churchMain` INSERT — `/bookletnoticecreate/create` 와 동일 규칙.
 * 필드: userAccount, ordererName, ordererPhone, orderTitle,
 *   portonePaymentId?, portonePaidAmount?, portoneOrderName?, portonePlan?,
 *   schedulePaymentId?, billingKey?, portonePaidAt?, portoneTimeToPay?, portoneScheduleId?
 * (portonePaymentId 있으면 중복 검사 후 확장 INSERT — portoneTxId 컬럼 미사용)
 * @param {import('mysql').Pool} bookletdb
 * @param {Record<string, unknown>} body
 * @returns {Promise<number>} insertId
 */
function insertChurchMainRow(bookletdb, body) {
  const {
    userAccount,
    ordererName,
    ordererPhone,
    orderTitle,
    portonePaymentId,
    portonePaidAmount,
    portoneOrderName,
    portonePlan,
    schedulePaymentId,
    billingKey,
    portonePaidAt,
    portoneTimeToPay,
    portoneScheduleId,
  } = body || {};

  const payId =
    portonePaymentId != null && String(portonePaymentId).trim() !== '' ? String(portonePaymentId).trim() : null;

  const amountInt =
    portonePaidAmount != null && portonePaidAmount !== ''
      ? parseInt(String(portonePaidAmount), 10)
      : null;
  const orderNameStr =
    portoneOrderName != null ? String(portoneOrderName).slice(0, 255) : null;
  const planStr = portonePlan != null ? String(portonePlan).slice(0, 32) : null;

  const schedPayId =
    schedulePaymentId != null && String(schedulePaymentId).trim() !== ''
      ? String(schedulePaymentId).trim().slice(0, 255)
      : null;
  const billingKeyVal =
    billingKey != null && String(billingKey).trim() !== '' ? String(billingKey).trim().slice(0, 512) : null;
  const paidAtVal =
    portonePaidAt != null && String(portonePaidAt).trim() !== ''
      ? String(portonePaidAt).trim().slice(0, 64)
      : null;
  const timeToPayVal =
    portoneTimeToPay != null && String(portoneTimeToPay).trim() !== ''
      ? String(portoneTimeToPay).trim().slice(0, 64)
      : null;
  const scheduleIdVal =
    portoneScheduleId != null && String(portoneScheduleId).trim() !== ''
      ? String(portoneScheduleId).trim().slice(0, 255)
      : null;

  const baseParams = [
    userAccount || '',
    ordererName || '',
    ordererPhone || '',
    String(orderTitle || '').trim(),
  ];

  const runInsert = () =>
    new Promise((resolve, reject) => {
      let insertQuery;
      let insertParams;
      if (payId) {
        insertQuery = `INSERT INTO churchMain (
          userAccount, ordererName, ordererPhone, orderTitle,
          portonePaymentId, portonePaidAmount, portoneOrderName, portonePlan,
          schedulePaymentId, billingKey, portonePaidAt, portoneTimeToPay, portoneScheduleId,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        insertParams = [
          ...baseParams,
          payId,
          Number.isFinite(amountInt) ? amountInt : null,
          orderNameStr,
          planStr,
          schedPayId,
          billingKeyVal,
          paidAtVal,
          timeToPayVal,
          scheduleIdVal,
        ];
      } else {
        insertQuery = `INSERT INTO churchMain (
          userAccount, ordererName, ordererPhone, orderTitle,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`;
        insertParams = baseParams;
      }
      bookletdb.query(insertQuery, insertParams, (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });

  return new Promise((resolve, reject) => {
    if (payId) {
      bookletdb.query(
        'SELECT id FROM churchMain WHERE portonePaymentId = ? LIMIT 1',
        [payId],
        (e, rows) => {
          if (e) return reject(e);
          if (rows && rows.length > 0) {
            const err = new Error('이 결제로 이미 전단지가 생성되었습니다.');
            err.code = 'DUPLICATE_PORTONE';
            err.existingId = rows[0].id;
            return reject(err);
          }
          runInsert().then(resolve).catch(reject);
        },
      );
    } else {
      runInsert().then(resolve).catch(reject);
    }
  });
}

module.exports = {
  toChurchMainIdInt,
  insertChurchMainRow,
};
