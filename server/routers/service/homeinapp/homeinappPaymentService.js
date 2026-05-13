const { homeinappdb } = require('../../dbdatas/homeinappdb');

/** 신규 결제·주문 INSERT 시 `churches.status` 기본값 */
const CHURCH_STATUS_APPLIED = 'applied';

/** Firebase 서비스 계정 JSON은 업로드 시 `homeinappkeys`에 저장되며, DB에는 파일명만 둡니다(경로 접두사 없음). */

function createChurchId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${yy}${mm}${dd}${suffix}`;
}

function findHomeinappOrderByPaymentId(paymentId) {
  const pid = paymentId != null ? String(paymentId).trim() : '';
  if (!pid) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    homeinappdb.query(
      'SELECT id FROM churches WHERE portonePaymentId = ? LIMIT 1',
      [pid],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows.length > 0 ? String(rows[0].id) : null);
      }
    );
  });
}

function insertHomeinappOrderWithPayment(payload) {
  const {
    userAccount,
    churchName,
    ordererName,
    ordererPhone,
    portonePaymentId,
    portonePaidAmount,
    portoneOrderName,
    portonePlan,
    schedulePaymentId,
    billingKey,
    portonePaidAt,
    portoneTimeToPay,
    portoneScheduleId,
  } = payload || {};

  return new Promise((resolve, reject) => {
    const churchId = createChurchId();
    homeinappdb.query(
      `INSERT INTO churches (
        id, churchName, representatives, phoneNumber, userAccount,
        portonePaymentId, portonePaidAmount, portoneOrderName, portonePlan,
        schedulePaymentId, billingKey, portonePaidAt, portoneTimeToPay, portoneScheduleId,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        churchId,
        String(churchName || '').trim().slice(0, 120),
        String(ordererName || '').trim().slice(0, 100),
        String(ordererPhone || '').trim().slice(0, 30),
        userAccount != null ? String(userAccount).trim() : null,
        portonePaymentId != null ? String(portonePaymentId).trim().slice(0, 255) : null,
        typeof portonePaidAmount === 'number' ? portonePaidAmount : null,
        portoneOrderName != null ? String(portoneOrderName).trim().slice(0, 255) : null,
        portonePlan != null ? String(portonePlan).trim().slice(0, 30) : null,
        schedulePaymentId != null ? String(schedulePaymentId).trim().slice(0, 255) : null,
        billingKey != null ? String(billingKey).trim().slice(0, 255) : null,
        portonePaidAt != null ? String(portonePaidAt).trim().slice(0, 64) : null,
        portoneTimeToPay != null ? String(portoneTimeToPay).trim().slice(0, 64) : null,
        portoneScheduleId != null ? String(portoneScheduleId).trim().slice(0, 255) : null,
        CHURCH_STATUS_APPLIED,
      ],
      (err) => {
        if (err) return reject(err);
        resolve(churchId);
      }
    );
  });
}

module.exports = {
  findHomeinappOrderByPaymentId,
  insertHomeinappOrderWithPayment,
};
