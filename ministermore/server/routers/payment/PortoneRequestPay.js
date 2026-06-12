/**
 * 행사 전단지 — 브라우저 SDK 일반결제(`requestEventBookletPayment`) 완료 후
 * PortOne REST로 결제 검증 → `eventMain`·`eventInfo` 저장 + 결제 메타데이터 컬럼 기록
 *
 * app.js: `app.use('/paymentrequestpay', …)` → 클라이언트 POST `/paymentrequestpay/event/complete-browser`
 *
 * churchMain `insertChurchMainRow`(PortoneBilling.js)와 유사하게 portone* 필드를 둡니다.
 */
const express = require('express');
const router = express.Router();
router.use(express.json());
const cors = require('cors');
router.use(cors());

const { bookleteventdb } = require('../dbdatas/bookletdb');
const { homeinappdb } = require('../dbdatas/homeinappdb');
const { normalizeVisibleTabsArray } = require('../service/bookletEvent/bookletEventMerge');
const {
  findHomeinappOrderByPaymentId,
  insertHomeinappOrderWithPayment,
} = require('../service/homeinapp/homeinappPaymentService');
const { PORTONE_API_SECRET, PORTONE_STORE_ID } = require('./portonedata');
const { safeInsertOneTimePayment } = require('./paymentRecordService');
const { notifyMmserviceSubscription } = require('./mmserviceWebhook');
const { notifyMmserviceRetreatProvision } = require('./mmserviceRetreatProvision');

/** `totalAmount` 미전달 시에만 사용 (구 클라이언트 호환). 가능하면 요청 본문 `totalAmount`로 검증하세요. */
const FALLBACK_EXPECTED_AMOUNT_KRW = parseInt(
  process.env.EVENT_BOOKLET_AMOUNT_VAT_KRW || '55000',
  10,
) || 55000;
const EVENT_ORDER_NAME = '행사 전단지 제작';
/** 원 단위 이상 방지 (조작 완화) */
const MAX_EVENT_AMOUNT_KRW = 100_000_000;
const HOMEINAPP_ORDER_NAME = '홈인앱 상세페이지 제작';
const FALLBACK_HOMEINAPP_AMOUNT_KRW = parseInt(process.env.HOMEINAPP_AMOUNT_VAT_KRW || '108900', 10) || 108900;
const MAX_HOMEINAPP_AMOUNT_KRW = 100_000_000;

const EVENT_BOOKLET_TYPE_IDS = new Set(['ordination', 'newcomer', 'concert', 'retreat']);

function normalizeBookletTypeForBilling(v) {
  const s = v == null ? '' : String(v).trim();
  return EVENT_BOOKLET_TYPE_IDS.has(s) ? s : 'ordination';
}

/** PortOne 결제 객체에서 승인 시각 (PortoneBilling.js 의 pickPaidAt 과 동일 규칙) */
function pickPaidAt(payParsed) {
  if (!payParsed || typeof payParsed !== 'object') return null;
  const p = payParsed.payment ?? payParsed;
  const raw =
    p.paidAt ??
    p.payment?.paidAt ??
    p.completedAt ??
    p.payment?.completedAt;
  if (raw == null || raw === '') return null;
  return String(raw).trim().slice(0, 64);
}

function pickPaymentRecord(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed.payment ?? parsed;
}

function isPaidStatus(record) {
  if (!record || typeof record !== 'object') return false;
  return record.status === 'PAID';
}

function getAmountTotal(record) {
  if (!record || typeof record !== 'object') return null;
  const a = record.amount;
  if (a && typeof a === 'object' && a.total != null) {
    const t = a.total;
    if (typeof t === 'number' && Number.isFinite(t)) return Math.round(t);
    const n = parseInt(String(t).replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }
  if (record.totalAmount != null) {
    const t = record.totalAmount;
    if (typeof t === 'number' && Number.isFinite(t)) return Math.round(t);
    const n = parseInt(String(t), 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function getOrderNameFromRecord(record) {
  if (!record || typeof record !== 'object') return null;
  const n = record.orderName ?? record.order?.name;
  return n != null ? String(n).trim().slice(0, 255) : null;
}

let ensuredEventMainPortoneCols = false;

function ensureEventMainPortoneColumns() {
  if (ensuredEventMainPortoneCols) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    bookleteventdb.query(
      `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventMain'`,
      (err, rows) => {
        if (err) return reject(err);
        const have = new Set((rows || []).map((r) => r.c));
        const needed = [
          ['portonePaymentId', 'VARCHAR(255) NULL'],
          ['portoneTxId', 'VARCHAR(64) NULL'],
          ['portonePaidAmount', 'INT NULL'],
          ['portoneOrderName', 'VARCHAR(255) NULL'],
          ['portonePaidAt', 'VARCHAR(64) NULL'],
          ['churchName', 'VARCHAR(120) NULL'],
          ['passwd', 'VARCHAR(32) NULL'],
          ['ownerpw', 'VARCHAR(64) NULL'],
        ];
        let i = 0;
        function next() {
          if (i >= needed.length) {
            ensuredEventMainPortoneCols = true;
            return resolve();
          }
          const [name, def] = needed[i++];
          if (have.has(name)) return next();
          bookleteventdb.query(`ALTER TABLE eventMain ADD COLUMN \`${name}\` ${def}`, (e) => {
            if (e) console.error(`ALTER eventMain ADD ${name}:`, e.message);
            else have.add(name);
            next();
          });
        }
        next();
      },
    );
  });
}

function insertEventMainWithPayment(bookletdbConn, body) {
  const {
    userAccount,
    ordererName,
    ordererPhone,
    orderTitle,
    bookletType,
    visibleTabsJson,
    portonePaymentId,
    portoneTxId,
    portonePaidAmount,
    portoneOrderName,
    portonePaidAt,
    churchName,
    passwd,
    ownerpw,
  } = body;

  const bookletTypeStr = normalizeBookletTypeForBilling(bookletType);
  const payId = portonePaymentId != null ? String(portonePaymentId).trim() : '';

  return new Promise((resolve, reject) => {
    if (payId) {
      bookletdbConn.query(
        'SELECT id FROM eventMain WHERE portonePaymentId = ? LIMIT 1',
        [payId],
        (e, rows) => {
          if (e) return reject(e);
          if (rows && rows.length > 0) {
            const err = new Error('이 결제로 이미 행사 전단지가 생성되었습니다.');
            err.code = 'DUPLICATE_PORTONE';
            err.existingId = rows[0].id;
            return reject(err);
          }
          runInsert();
        },
      );
    } else {
      runInsert();
    }

    function runInsert() {
      bookletdbConn.query(
        `INSERT INTO eventMain (
          userAccount, ordererName, ordererPhone, orderTitle, eventBookletType,
          portonePaymentId, portoneTxId, portonePaidAmount, portoneOrderName, portonePaidAt,
          churchName, passwd, ownerpw
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userAccount || '',
          ordererName || '',
          ordererPhone || '',
          String(orderTitle || '').trim(),
          bookletTypeStr,
          payId || null,
          portoneTxId != null ? String(portoneTxId).trim().slice(0, 64) : null,
          typeof portonePaidAmount === 'number' ? portonePaidAmount : null,
          portoneOrderName != null ? String(portoneOrderName).slice(0, 255) : null,
          portonePaidAt != null ? String(portonePaidAt).slice(0, 64) : null,
          churchName != null ? String(churchName).trim().slice(0, 120) : null,
          passwd != null ? String(passwd).trim().slice(0, 32) : null,
          ownerpw != null ? String(ownerpw).trim().slice(0, 64) : null,
        ],
        (err, result) => {
          if (err) return reject(err);
          const newId = result.insertId;
          bookletdbConn.query(
            'INSERT INTO eventInfo (bookletId, userAccount, visibleTabs) VALUES (?, ?, ?)',
            [String(newId), userAccount || '', visibleTabsJson],
            (e2) => {
              if (e2) return reject(e2);
              resolve(newId);
            },
          );
        },
      );
    }
  });
}

router.post('/event/complete-browser', async (req, res) => {
  const {
    paymentId,
    txId,
    orderTitle,
    ordererName,
    ordererPhone,
    userAccount,
    bookletType,
    visibleTabs,
    totalAmount: totalAmountBody,
    churchName,
    passwd,
    ownerpw,
  } = req.body ?? {};

  const pid = paymentId != null ? String(paymentId).trim() : '';
  if (!pid) {
    return res.status(400).json({ ok: false, message: 'paymentId가 필요합니다.' });
  }

  try {
    await ensureEventMainPortoneColumns();

    const payRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(pid)}`, {
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
      },
    });
    const payRaw = await payRes.text();
    let payParsed = null;
    try {
      payParsed = payRaw ? JSON.parse(payRaw) : null;
    } catch {
      payParsed = null;
    }

    if (!payRes.ok) {
      const msg =
        (payParsed && (payParsed.message || payParsed.pgMessage)) || '결제 정보를 조회할 수 없습니다.';
      return res.status(400).json({ ok: false, message: msg, details: payParsed });
    }

    const record = pickPaymentRecord(payParsed);
    if (!isPaidStatus(record)) {
      const st = record && typeof record === 'object' ? String(record.status ?? '') : '';
      return res.status(400).json({
        ok: false,
        message: st ? `결제가 완료 상태가 아닙니다. (${st})` : '결제가 완료 상태가 아닙니다.',
        details: payParsed,
      });
    }

    const portoneTotal = getAmountTotal(record);
    if (portoneTotal == null || Number.isNaN(portoneTotal)) {
      return res.status(400).json({
        ok: false,
        message: 'PortOne 결제에서 금액을 확인할 수 없습니다.',
        details: payParsed,
      });
    }

    let expectedKrw =
      totalAmountBody != null && String(totalAmountBody).trim() !== ''
        ? parseInt(String(totalAmountBody).trim(), 10)
        : FALLBACK_EXPECTED_AMOUNT_KRW;
    if (!Number.isFinite(expectedKrw) || expectedKrw < 1) {
      return res.status(400).json({ ok: false, message: 'totalAmount 값이 올바르지 않습니다.' });
    }
    if (expectedKrw > MAX_EVENT_AMOUNT_KRW) {
      return res.status(400).json({ ok: false, message: '허용되지 않는 결제 금액입니다.' });
    }

    if (portoneTotal !== expectedKrw) {
      return res.status(400).json({
        ok: false,
        message: '결제 금액이 서비스 금액과 일치하지 않습니다.',
        expected: expectedKrw,
        actual: portoneTotal,
      });
    }

    if (PORTONE_STORE_ID && record && typeof record === 'object' && record.storeId) {
      if (String(record.storeId) !== String(PORTONE_STORE_ID)) {
        return res.status(400).json({ ok: false, message: '스토어 정보가 일치하지 않습니다.' });
      }
    }

    const orderNameResolved = getOrderNameFromRecord(record) || EVENT_ORDER_NAME;
    const paidAtResolved = pickPaidAt(payParsed);

    let visibleTabsJson = JSON.stringify(['info', 'program', 'profile']);
    if (visibleTabs != null) {
      const s = typeof visibleTabs === 'string' ? visibleTabs : JSON.stringify(visibleTabs);
      if (s.trim()) {
        try {
          const p = JSON.parse(s);
          if (Array.isArray(p) && p.length) {
            const n = normalizeVisibleTabsArray(p);
            if (n) visibleTabsJson = JSON.stringify(n);
          }
        } catch (_) {
          /* keep default */
        }
      }
    }

    const orderTitleNorm = orderTitle != null ? String(orderTitle).trim() : '';
    const ordererNameNorm = ordererName != null ? String(ordererName).trim() : '';
    const ordererPhoneNorm = ordererPhone != null ? String(ordererPhone).replace(/\s/g, '') : '';
    const userAccountNorm = userAccount != null ? String(userAccount).trim() : '';
    const churchNameNorm = churchName != null ? String(churchName).trim() : '';
    const passwdNorm = passwd != null ? String(passwd).trim() : '';
    const ownerpwNorm = ownerpw != null ? String(ownerpw).trim() : '';

    if (bookletType === 'retreat') {
      if (!churchNameNorm || !passwdNorm || !ownerpwNorm) {
        return res.status(400).json({
          ok: false,
          message: '교회 이름, 비밀번호, 관리자 비밀번호가 필요합니다.',
        });
      }
    }

    let eventMainId;
    try {
      eventMainId = await insertEventMainWithPayment(bookleteventdb, {
        userAccount: userAccountNorm,
        ordererName: ordererNameNorm,
        ordererPhone: ordererPhoneNorm,
        orderTitle: orderTitleNorm,
        bookletType,
        visibleTabsJson,
        portonePaymentId: pid,
        portoneTxId: txId,
        portonePaidAmount: portoneTotal,
        portoneOrderName: orderNameResolved,
        portonePaidAt: paidAtResolved,
        churchName: churchNameNorm,
        passwd: passwdNorm,
        ownerpw: ownerpwNorm,
      });
    } catch (dbErr) {
      if (dbErr && dbErr.code === 'DUPLICATE_PORTONE' && dbErr.existingId != null) {
        return res.status(409).json({
          ok: false,
          message: dbErr.message || '이 결제로 이미 전단지가 생성되었습니다.',
          eventMainId: dbErr.existingId,
          paymentId: pid,
        });
      }
      console.error('eventMain INSERT after browser payment', dbErr);
      return res.status(500).json({
        ok: false,
        message: '결제는 확인되었으나 행사 전단지 저장에 실패했습니다. 고객센터로 문의해 주세요.',
        paymentId: pid,
      });
    }

    const recordServiceType =
      bookletType === 'retreat' ? 'bookletRetreat' : 'bookletEvent';

    const eventCustomData = { bookletType, visibleTabs: visibleTabsJson };

    const supplyAmount = Math.round(portoneTotal / 1.1);
    const vatAmount = portoneTotal - supplyAmount;

    await safeInsertOneTimePayment({
      serviceType: recordServiceType,
      userAccount: userAccountNorm,
      churchName: churchNameNorm || null,
      passwd: bookletType === 'retreat' ? passwdNorm || null : null,
      ownerpw: bookletType === 'retreat' ? ownerpwNorm || null : null,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      orderTitle: orderTitleNorm,
      orderName: orderNameResolved,
      supplyAmount,
      vatAmount,
      totalAmount: portoneTotal,
      portonePaymentId: pid,
      portoneTxId: txId != null ? String(txId) : null,
      portonePaidAt: paidAtResolved,
      paymentStatus: 'PAID',
      resourceType: 'eventMain',
      resourceId: String(eventMainId),
      customData: eventCustomData,
      memo: `eventMainId=${eventMainId}`,
    });

    await notifyMmserviceSubscription({
      userAccount: userAccountNorm,
      subscriptionServiceType: req.body?.serviceType ?? req.body?.subscriptionServiceType,
      customData: eventCustomData,
    });

    if (bookletType === 'retreat') {
      await notifyMmserviceRetreatProvision({
        eventMainId,
        userAccount: userAccountNorm,
        orderTitle: orderTitleNorm,
        ordererName: ordererNameNorm,
        ordererPhone: ordererPhoneNorm,
        churchName: churchNameNorm,
        passwd: passwdNorm,
        ownerpw: ownerpwNorm,
        visibleTabs: visibleTabsJson,
      });
    }

    return res.json({
      ok: true,
      paymentId: pid,
      txId: txId != null ? String(txId) : undefined,
      eventMainId,
      portonePaidAt: paidAtResolved,
      portoneOrderName: orderNameResolved,
    });
  } catch (e) {
    console.error('complete-browser handler', e);
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
  }
});

/** 수련회 전단지 — 50명 이하 무료 신청 (PortOne 결제 없음) */
router.post('/event/complete-free', async (req, res) => {
  const {
    orderTitle,
    ordererName,
    ordererPhone,
    userAccount,
    bookletType,
    visibleTabs,
    churchName,
    passwd,
    ownerpw,
    participantTier,
    serviceType: subscriptionServiceType,
    subscriptionServiceType: subscriptionServiceTypeAlt,
  } = req.body ?? {};

  if (bookletType !== 'retreat') {
    return res.status(400).json({ ok: false, message: '무료 신청은 수련회 전단지에서만 가능합니다.' });
  }

  const tier = participantTier != null ? String(participantTier).trim() : '';
  if (tier !== 'up50') {
    return res.status(400).json({ ok: false, message: '무료 신청은 50명 이하 구간만 가능합니다.' });
  }

  const orderTitleNorm = orderTitle != null ? String(orderTitle).trim() : '';
  const ordererNameNorm = ordererName != null ? String(ordererName).trim() : '';
  const ordererPhoneNorm = ordererPhone != null ? String(ordererPhone).replace(/\s/g, '') : '';
  const userAccountNorm = userAccount != null ? String(userAccount).trim() : '';
  const churchNameNorm = churchName != null ? String(churchName).trim() : '';
  const passwdNorm = passwd != null ? String(passwd).trim() : '';
  const ownerpwNorm = ownerpw != null ? String(ownerpw).trim() : '';

  if (!orderTitleNorm || !ordererNameNorm || !ordererPhoneNorm) {
    return res.status(400).json({ ok: false, message: '타이틀, 이름, 전화번호가 필요합니다.' });
  }
  if (!churchNameNorm || !passwdNorm || !ownerpwNorm) {
    return res.status(400).json({
      ok: false,
      message: '교회 이름, 비밀번호, 관리자 비밀번호가 필요합니다.',
    });
  }

  let visibleTabsJson = JSON.stringify(['info', 'program', 'profile']);
  if (visibleTabs != null) {
    const s = typeof visibleTabs === 'string' ? visibleTabs : JSON.stringify(visibleTabs);
    if (s.trim()) {
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length) {
          const n = normalizeVisibleTabsArray(p);
          if (n) visibleTabsJson = JSON.stringify(n);
        }
      } catch (_) {
        /* keep default */
      }
    }
  }

  const pid = `free_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  try {
    await ensureEventMainPortoneColumns();

    let eventMainId;
    try {
      eventMainId = await insertEventMainWithPayment(bookleteventdb, {
        userAccount: userAccountNorm,
        ordererName: ordererNameNorm,
        ordererPhone: ordererPhoneNorm,
        orderTitle: orderTitleNorm,
        bookletType: 'retreat',
        visibleTabsJson,
        portonePaymentId: pid,
        portoneTxId: null,
        portonePaidAmount: 0,
        portoneOrderName: '수련회 전단지 제작',
        portonePaidAt: null,
        churchName: churchNameNorm,
        passwd: passwdNorm,
        ownerpw: ownerpwNorm,
      });
    } catch (dbErr) {
      if (dbErr && dbErr.code === 'DUPLICATE_PORTONE' && dbErr.existingId != null) {
        return res.status(409).json({
          ok: false,
          message: dbErr.message || '이미 신청된 건입니다.',
          eventMainId: dbErr.existingId,
          paymentId: pid,
        });
      }
      console.error('eventMain INSERT after free apply', dbErr);
      return res.status(500).json({
        ok: false,
        message: '신청 저장에 실패했습니다. 고객센터로 문의해 주세요.',
        paymentId: pid,
      });
    }

    const eventCustomData = {
      bookletType: 'retreat',
      visibleTabs: visibleTabsJson,
      participantTier: tier,
    };

    await safeInsertOneTimePayment({
      serviceType: 'bookletRetreat',
      userAccount: userAccountNorm,
      churchName: churchNameNorm || null,
      passwd: passwdNorm || null,
      ownerpw: ownerpwNorm || null,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      orderTitle: orderTitleNorm,
      orderName: '수련회 전단지 제작',
      supplyAmount: 0,
      vatAmount: 0,
      totalAmount: 0,
      portonePaymentId: pid,
      portoneTxId: null,
      portonePaidAt: null,
      paymentStatus: 'FREE',
      resourceType: 'eventMain',
      resourceId: String(eventMainId),
      customData: eventCustomData,
      memo: [`eventMainId=${eventMainId}`, `participantTier=${tier}`].join('\n'),
    });

    const subType = subscriptionServiceType ?? subscriptionServiceTypeAlt;
    await notifyMmserviceSubscription({
      userAccount: userAccountNorm,
      subscriptionServiceType: subType,
      customData: eventCustomData,
    });

    await notifyMmserviceRetreatProvision({
      eventMainId,
      userAccount: userAccountNorm,
      orderTitle: orderTitleNorm,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      churchName: churchNameNorm,
      passwd: passwdNorm,
      ownerpw: ownerpwNorm,
      visibleTabs: visibleTabsJson,
    });

    return res.json({
      ok: true,
      paymentId: pid,
      eventMainId,
      portoneOrderName: '수련회 전단지 제작',
    });
  } catch (e) {
    console.error('complete-free handler', e);
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
  }
});

router.post('/homeinapp/complete-browser', async (req, res) => {
  const {
    paymentId,
    txId,
    totalAmount: totalAmountBody,
    churchName,
    lilnkUrl,
    ordererName,
    ordererPhone,
    ordererEmail,
    memo,
    userAccount,
  } = req.body ?? {};

  const pid = paymentId != null ? String(paymentId).trim() : '';
  if (!pid) {
    return res.status(400).json({ ok: false, message: 'paymentId가 필요합니다.' });
  }

  const churchNameNorm = churchName != null ? String(churchName).trim() : '';
  const ordererNameNorm = ordererName != null ? String(ordererName).trim() : '';
  const ordererPhoneNorm = ordererPhone != null ? String(ordererPhone).replace(/\s/g, '') : '';
  const ordererEmailNorm = ordererEmail != null ? String(ordererEmail).trim() : '';
  const memoNorm = memo != null ? String(memo) : '';
  const userAccountNorm = userAccount != null ? String(userAccount).trim() : '';
  const lilnkUrlNorm =
    lilnkUrl != null && String(lilnkUrl).trim() !== ''
      ? String(lilnkUrl).trim().slice(0, 2048)
      : null;

  if (!churchNameNorm || !ordererNameNorm || !ordererPhoneNorm) {
    return res.status(400).json({ ok: false, message: '교회명, 주문자명, 전화번호는 필수입니다.' });
  }

  try {
    const payRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(pid)}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    });
    const payRaw = await payRes.text();
    let payParsed = null;
    try {
      payParsed = payRaw ? JSON.parse(payRaw) : null;
    } catch {
      payParsed = null;
    }

    if (!payRes.ok) {
      const msg =
        (payParsed && (payParsed.message || payParsed.pgMessage)) || '결제 정보를 조회할 수 없습니다.';
      return res.status(400).json({ ok: false, message: msg, details: payParsed });
    }

    const record = pickPaymentRecord(payParsed);
    if (!isPaidStatus(record)) {
      const st = record && typeof record === 'object' ? String(record.status ?? '') : '';
      return res.status(400).json({
        ok: false,
        message: st ? `결제가 완료 상태가 아닙니다. (${st})` : '결제가 완료 상태가 아닙니다.',
        details: payParsed,
      });
    }

    const portoneTotal = getAmountTotal(record);
    if (portoneTotal == null || Number.isNaN(portoneTotal)) {
      return res.status(400).json({
        ok: false,
        message: 'PortOne 결제에서 금액을 확인할 수 없습니다.',
        details: payParsed,
      });
    }

    let expectedKrw =
      totalAmountBody != null && String(totalAmountBody).trim() !== ''
        ? parseInt(String(totalAmountBody).trim(), 10)
        : FALLBACK_HOMEINAPP_AMOUNT_KRW;
    if (!Number.isFinite(expectedKrw) || expectedKrw < 1) {
      return res.status(400).json({ ok: false, message: 'totalAmount 값이 올바르지 않습니다.' });
    }
    if (expectedKrw > MAX_HOMEINAPP_AMOUNT_KRW) {
      return res.status(400).json({ ok: false, message: '허용되지 않는 결제 금액입니다.' });
    }
    if (portoneTotal !== expectedKrw) {
      return res.status(400).json({
        ok: false,
        message: '결제 금액이 서비스 금액과 일치하지 않습니다.',
        expected: expectedKrw,
        actual: portoneTotal,
      });
    }

    if (PORTONE_STORE_ID && record && typeof record === 'object' && record.storeId) {
      if (String(record.storeId) !== String(PORTONE_STORE_ID)) {
        return res.status(400).json({ ok: false, message: '스토어 정보가 일치하지 않습니다.' });
      }
    }

    const existingId = await findHomeinappOrderByPaymentId(homeinappdb, pid);
    if (existingId != null) {
      return res.status(409).json({
        ok: false,
        message: '이 결제로 이미 홈인앱 주문이 생성되었습니다.',
        homeinappMainId: existingId,
        paymentId: pid,
      });
    }

    const paidAtResolved = pickPaidAt(payParsed);
    const orderNameResolved = getOrderNameFromRecord(record) || HOMEINAPP_ORDER_NAME;

    const homeinappMainId = await insertHomeinappOrderWithPayment(homeinappdb, {
      userAccount: userAccountNorm,
      churchName: churchNameNorm,
      lilnkUrl: lilnkUrlNorm,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      ordererEmail: ordererEmailNorm,
      memo: memoNorm,
      paymentStatus: 'PAID',
      portonePaymentId: pid,
      portoneTxId: txId,
      portonePaidAmount: portoneTotal,
      portoneOrderName: orderNameResolved,
      portonePaidAt: paidAtResolved,
    });

    const homeinappCustomData = {
      lilnkUrl: lilnkUrlNorm,
      memo: memoNorm,
      ordererEmail: ordererEmailNorm,
    };

    await safeInsertOneTimePayment({
      serviceType: 'homeinapp',
      userAccount: userAccountNorm,
      churchName: churchNameNorm,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      orderName: orderNameResolved,
      totalAmount: portoneTotal,
      portonePaymentId: pid,
      portoneTxId: txId != null ? String(txId) : null,
      portonePaidAt: paidAtResolved,
      paymentStatus: 'PAID',
      resourceType: 'homeinappMain',
      resourceId: String(homeinappMainId),
      customData: homeinappCustomData,
    });

    await notifyMmserviceSubscription({
      userAccount: userAccountNorm,
      subscriptionServiceType: req.body?.serviceType ?? req.body?.subscriptionServiceType,
      customData: homeinappCustomData,
    });

    return res.json({
      ok: true,
      paymentId: pid,
      txId: txId != null ? String(txId) : undefined,
      homeinappMainId,
      portonePaidAt: paidAtResolved,
      portoneOrderName: orderNameResolved,
    });
  } catch (e) {
    console.error('homeinapp complete-browser handler', e);
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
  }
});

module.exports = router;