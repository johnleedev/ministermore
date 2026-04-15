/**
 * NoticeCreate / 전단지(bookletnoticecreate) 라우트에서 공통으로 쓰는 ID·templateId 변환
 *
 * churchMain 확장 컬럼 (portoneTxId 제거 후 예시):
 *   schedulePaymentId VARCHAR(255) NULL,
 *   billingKey VARCHAR(512) NULL,
 *   portonePaidAt VARCHAR(64) NULL,
 *   portoneTimeToPay VARCHAR(64) NULL,
 *   portoneScheduleId VARCHAR(255) NULL
 */

const TEMPLATE_STR_TO_INT = {
  classic: 1,
  modern: 2,
  minimal: 3,
  warm: 4,
  forest: 5,
  rose: 6,
  navy: 7,
  violet: 8,
};
const TEMPLATE_INT_TO_STR = {
  1: 'classic',
  2: 'modern',
  3: 'minimal',
  4: 'warm',
  5: 'forest',
  6: 'rose',
  7: 'navy',
  8: 'violet',
};

function toTemplateInt(v) {
  return typeof v === 'number' ? v : TEMPLATE_STR_TO_INT[v] || 1;
}

function toTemplateStr(v) {
  return typeof v === 'string' && TEMPLATE_STR_TO_INT[v] ? v : TEMPLATE_INT_TO_STR[v] || 'classic';
}

function toChurchMainIdInt(v) {
  if (v == null || v === '') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

/**
 * `churchMain` INSERT — `/bookletnoticecreate/create` 와 동일 규칙.
 * 필드: userAccount, templateId, ordererName, ordererPhone, orderTitle,
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
    templateId,
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

  const templateIdInt = toTemplateInt(templateId || 'classic');
  const baseParams = [
    userAccount || '',
    templateIdInt,
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
          userAccount, templateId, ordererName, ordererPhone, orderTitle,
          portonePaymentId, portonePaidAmount, portoneOrderName, portonePlan,
          schedulePaymentId, billingKey, portonePaidAt, portoneTimeToPay, portoneScheduleId,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
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
          userAccount, templateId, ordererName, ordererPhone, orderTitle,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
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
  TEMPLATE_STR_TO_INT,
  TEMPLATE_INT_TO_STR,
  toTemplateInt,
  toTemplateStr,
  toChurchMainIdInt,
  insertChurchMainRow,
};
