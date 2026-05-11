/**
 * 공지 전단지 — PortOne 빌링키 + 첫 결제 + 다음 회차 예약(월간 구독)
 * 클라이언트: NoticeApplyPay.tsx → POST /paymentbilling/billingkey
 *
 * 행사 전단지 브라우저 일반결제는 PortoneRequestPay.js → POST /paymentrequestpay/event/complete-browser
 */
const express = require('express');
const router = express.Router()
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const crypto = require('crypto');
const { bookletnoticedb } = require('../dbdatas/bookletdb');
const { insertChurchMainRow } = require('../service/bookletNotice/bookletNoticeShared');
var cors = require('cors');
router.use(cors());
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");

const {
  PORTONE_API_SECRET,
  PORTONE_BILLING_CHANNEL_KEY,
  PORTONE_STORE_ID,
} = require('./portonedata');
const {
  findHomeinappOrderByPaymentId,
  insertHomeinappOrderWithPayment,
} = require('../service/homeinapp/homeinappPaymentService');

function createNewPaymentId(prefix = 'notice') {
  const safe = String(prefix).replace(/[^a-zA-Z0-9]/g, '') || 'pay';
  return `${safe}${Date.now()}${crypto.randomBytes(5).toString('hex')}`;
}

function pickPaidAt(payParsed) {
  if (!payParsed || typeof payParsed !== 'object') return null;
  const raw =
    payParsed.paidAt ??
    payParsed.payment?.paidAt ??
    payParsed.completedAt ??
    payParsed.payment?.completedAt;
  if (raw == null || raw === '') return null;
  return String(raw).trim().slice(0, 64);
}

function pickScheduleId(scheduleInfo) {
  if (!scheduleInfo || typeof scheduleInfo !== 'object') return null;
  const id = scheduleInfo.id;
  if (id == null || id === '') return null;
  return String(id).trim().slice(0, 255);
}

function isoTimeNextMonthUtc() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

function normalizeExpiryYear(expY) {
  const s = String(expY ?? '').trim();
  if (!s) return s;
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return s;
  const fullYear = s.length <= 2 ? 2000 + n : n;
  const yy = fullYear % 100;
  return String(yy).padStart(2, '0');
}

function normalizeExpiryMonth(expM) {
  const s = String(expM ?? '').trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return s;
  return String(n).padStart(2, '0');
}

router.post('/billingkey', async (req, res) => {
  const {
    customerId,
    customer,
    customData,
    amount,
    cardnum,
    expM,
    expY,
    birthBiz,
    pwd2,
    orderTitle,
  } = req.body;


  // const {billingKey, transactionType, customerId, customer, amount, customData, orderTitle} = req.body;

  try {
    const customerPayload = { id: String(customerId) };
    if (customer && typeof customer === 'object') {
      if (customer.fullName) customerPayload.name = { full: String(customer.fullName).trim() };
      if (customer.phoneNumber) {
        customerPayload.phoneNumber = String(customer.phoneNumber).replace(/\s/g, '');
      }
      if (customer.email) customerPayload.email = String(customer.email).trim();
    }

    const issueResponse = await fetch('https://api.portone.io/billing-keys', {
      method: 'POST',
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_BILLING_CHANNEL_KEY,
        customer: customerPayload,
        method: {
          card: {
            credential: {
              number: String(cardnum).replace(/\s/g, ''),
              expiryYear: normalizeExpiryYear(expY),
              expiryMonth: normalizeExpiryMonth(expM),
              birthOrBusinessRegistrationNumber: String(birthBiz).replace(/\s/g, ''),
              passwordTwoDigits: String(pwd2),
            },
          },
        },
      }),
    });

    const issueRaw = await issueResponse.text();
    let issueParsed = null;
    try {
      issueParsed = issueRaw ? JSON.parse(issueRaw) : null;
    } catch {
      issueParsed = null;
    }
    if (!issueResponse.ok) {
      const msg =
        (issueParsed && (issueParsed.pgMessage || issueParsed.message)) || '빌링키 발급에 실패했습니다.';
      return res.status(400).json({ ok: false, message: msg, details: issueParsed });
    }
    const billingKey = issueParsed?.billingKeyInfo?.billingKey;
    if (!billingKey) {
      return res.status(502).json({ ok: false, message: '빌링키 응답에 billingKey가 없습니다.', details: issueParsed });
    }

    const paymentId = createNewPaymentId('notice');

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingKey,
          storeId: PORTONE_STORE_ID,
          channelKey: PORTONE_BILLING_CHANNEL_KEY,
          orderName: '월간 이용권 정기결제',
          customer: customerPayload,
          amount: {
            total: Number(amount),
          },
          currency: 'KRW',
        }),
      },
    );
    const payRaw = await paymentResponse.text();
    let payParsed = null;
    try {
      payParsed = payRaw ? JSON.parse(payRaw) : null;
    } catch {
      payParsed = { raw: payRaw?.slice(0, 300) };
    }
    if (!paymentResponse.ok) {
      const msg =
        (payParsed && (payParsed.pgMessage || payParsed.message)) || '빌링키 결제 요청에 실패했습니다.';
      return res.status(400).json({ ok: false, message: msg, details: payParsed, paymentId });
    }

    const amountTotal = Number(amount);
    /** @type {string} PortOne `timeToPay`: RFC 3339 date-time 문자열 */
    const timeToPay = isoTimeNextMonthUtc();
    const schedulePaymentId = createNewPaymentId('noticesched');

    const scheduleResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(schedulePaymentId)}/schedule`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            storeId: PORTONE_STORE_ID,
            billingKey,
            channelKey: PORTONE_BILLING_CHANNEL_KEY,
            orderName: '월간 이용권 정기결제',
            customer: customerPayload,
            amount: {
              total: amountTotal,
            },
            currency: 'KRW',
          },
          timeToPay, // JSON 상에서 `"timeToPay":"2026-05-07T12:34:56.789Z"` — string, RFC 3339
        }),
      },
    );

    const schedRaw = await scheduleResponse.text();
    let schedParsed = null;
    try {
      schedParsed = schedRaw ? JSON.parse(schedRaw) : null;
    } catch {
      schedParsed = { raw: schedRaw?.slice(0, 500) };
    }
    if (!scheduleResponse.ok) {
      const msg =
        (schedParsed && (schedParsed.pgMessage || schedParsed.message)) ||
        '다음 결제 예약에 실패했습니다. 첫 결제는 완료되었을 수 있으니 고객센터로 문의해 주세요.';
      return res.status(400).json({
        ok: false,
        message: msg,
        details: schedParsed,
        paymentId,
        schedulePaymentId,
        firstPaymentSucceeded: true,
        payment: payParsed,
      });
    }

    const scheduleInfo = schedParsed && typeof schedParsed === 'object' ? schedParsed.schedule ?? schedParsed : null;

    const paidAtResolved = pickPaidAt(payParsed);
    const scheduleIdResolved = pickScheduleId(
      scheduleInfo && typeof scheduleInfo === 'object' && !Array.isArray(scheduleInfo) ? scheduleInfo : null,
    );
    const userAccount = customData && typeof customData === 'object' ? String(customData.userAccount ?? '') : '';
    const templateIdFromCustom = customData && typeof customData === 'object' ? customData.templateId : null;
    const ordererName =
      (customer && typeof customer === 'object' && String(customer.fullName || '').trim()) ||
      (customerPayload.name && customerPayload.name.full) ||
      '';
    const ordererPhone =
      (customer && typeof customer === 'object' && String(customer.phoneNumber || '').replace(/\s/g, '')) ||
      String(customerPayload.phoneNumber || '').replace(/\s/g, '') ||
      '';

    const orderTitleNorm = orderTitle != null ? String(orderTitle).trim() : '';
    const createBody = {
      userAccount,
      templateId: templateIdFromCustom,
      ordererName,
      ordererPhone,
      orderTitle: orderTitleNorm,
    };
    if (paymentId) {
      createBody.portonePaymentId = paymentId;
      createBody.portonePaidAmount = amountTotal;
      createBody.portoneOrderName = '월간 이용권 정기결제';
      createBody.portonePlan = 'monthly';
      createBody.schedulePaymentId = schedulePaymentId;
      createBody.billingKey = billingKey;
      createBody.portonePaidAt = paidAtResolved;
      createBody.portoneTimeToPay = timeToPay;
      createBody.portoneScheduleId = scheduleIdResolved;
    }

    let churchMainId;
    try {
      churchMainId = await insertChurchMainRow(bookletnoticedb, createBody);
    } catch (dbErr) {
      if (dbErr && dbErr.code === 'DUPLICATE_PORTONE' && dbErr.existingId != null) {
        return res.status(409).json({
          ok: false,
          message: dbErr.message || '이 결제로 이미 전단지가 생성되었습니다.',
          churchMainId: dbErr.existingId,
          paymentId,
          schedulePaymentId,
          firstPaymentSucceeded: true,
          scheduleSucceeded: true,
        });
      }
      console.error('churchMain INSERT after billing', dbErr);
      return res.status(500).json({
        ok: false,
        message: '결제·예약은 완료되었으나 전단지(교회 메인) 저장에 실패했습니다. 고객센터로 문의해 주세요.',
        paymentId,
        schedulePaymentId,
        firstPaymentSucceeded: true,
        scheduleSucceeded: true,
      });
    }

    return res.json({
      ok: true,
      paymentId,
      schedulePaymentId,
      billingKey,
      customerId,
      customData,
      paidAt: paidAtResolved,
      payment: payParsed,
      timeToPay,
      schedule: scheduleInfo,
      churchMainId,
    });

    
  } catch (e) {
    console.error('billingkey handler', e);
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
    
  }
});

router.post('/homeinapp/billingkey', async (req, res) => {
  const {
    billingKey,
    customerId,
    customer,
    amount,
    churchName,
    ordererName,
    ordererPhone,
    ordererEmail,
    memo,
    userAccount,
    orderTitle,
  } = req.body || {};

  const billingKeyNorm = billingKey != null ? String(billingKey).trim() : '';
  const churchNameNorm = churchName != null ? String(churchName).trim() : '';
  const ordererNameNorm = ordererName != null ? String(ordererName).trim() : '';
  const ordererPhoneNorm = ordererPhone != null ? String(ordererPhone).replace(/\s/g, '') : '';
  const ordererEmailNorm = ordererEmail != null ? String(ordererEmail).trim() : '';
  const userAccountNorm = userAccount != null ? String(userAccount).trim() : '';
  const memoNorm = memo != null ? String(memo) : '';
  const amountTotal = Number(amount);

  if (!billingKeyNorm) {
    return res.status(400).json({ ok: false, message: 'billingKey가 필요합니다.' });
  }
  if (!churchNameNorm || !ordererNameNorm || !ordererPhoneNorm) {
    return res.status(400).json({ ok: false, message: '교회명, 주문자명, 전화번호는 필수입니다.' });
  }
  if (!Number.isFinite(amountTotal) || amountTotal <= 0) {
    return res.status(400).json({ ok: false, message: 'amount 값이 올바르지 않습니다.' });
  }

  try {
    const customerPayload = { id: String(customerId || `homeinapp_${Date.now()}`) };
    if (customer && typeof customer === 'object') {
      if (customer.fullName) customerPayload.name = { full: String(customer.fullName).trim() };
      if (customer.phoneNumber) customerPayload.phoneNumber = String(customer.phoneNumber).replace(/\s/g, '');
      if (customer.email) customerPayload.email = String(customer.email).trim();
    } else {
      if (ordererNameNorm) customerPayload.name = { full: ordererNameNorm };
      if (ordererPhoneNorm) customerPayload.phoneNumber = ordererPhoneNorm;
      if (ordererEmailNorm) customerPayload.email = ordererEmailNorm;
    }

    const paymentId = createNewPaymentId('homeinapp');
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingKey: billingKeyNorm,
          storeId: PORTONE_STORE_ID,
          channelKey: PORTONE_BILLING_CHANNEL_KEY,
          orderName: orderTitle ? String(orderTitle).trim() : '홈인앱 상세페이지 제작',
          customer: customerPayload,
          amount: { total: amountTotal },
          currency: 'KRW',
        }),
      }
    );

    const payRaw = await paymentResponse.text();
    let payParsed = null;
    try {
      payParsed = payRaw ? JSON.parse(payRaw) : null;
    } catch {
      payParsed = { raw: payRaw?.slice(0, 300) };
    }
    if (!paymentResponse.ok) {
      const msg =
        (payParsed && (payParsed.pgMessage || payParsed.message)) || '빌링키 결제 요청에 실패했습니다.';
      return res.status(400).json({ ok: false, message: msg, details: payParsed, paymentId });
    }

    const existingId = await findHomeinappOrderByPaymentId(paymentId);
    if (existingId != null) {
      return res.status(409).json({
        ok: false,
        message: '이 결제로 이미 홈인앱 주문이 생성되었습니다.',
        homeinappMainId: existingId,
        paymentId,
      });
    }

    const homeinappMainId = await insertHomeinappOrderWithPayment({
      userAccount: userAccountNorm,
      churchName: churchNameNorm,
      ordererName: ordererNameNorm,
      ordererPhone: ordererPhoneNorm,
      ordererEmail: ordererEmailNorm,
      memo: memoNorm,
      paymentStatus: 'PAID',
      portonePaymentId: paymentId,
      portoneTxId: null,
      portonePaidAmount: amountTotal,
      portoneOrderName: orderTitle ? String(orderTitle).trim() : '홈인앱 상세페이지 제작',
      portonePlan: 'onetime',
      schedulePaymentId: null,
      billingKey: billingKeyNorm,
      portonePaidAt: pickPaidAt(payParsed),
      portoneTimeToPay: null,
      portoneScheduleId: null,
    });

    return res.json({
      ok: true,
      paymentId,
      billingKey: billingKeyNorm,
      homeinappMainId,
      payment: payParsed,
    });
  } catch (e) {
    console.error('homeinapp billingkey handler', e);
    return res.status(500).json({ ok: false, message: e?.message || String(e) });
  }
});



module.exports = router;
