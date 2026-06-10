/**
 * PortOne 빌링키 + 첫 결제 + 다음 회차 예약(월간 구독)
 *
 * POST /paymentbilling/billingkey — `customData.serviceType` 으로 DB 분기:
 * | serviceType     | DB              | 테이블      | 클라이언트              |
 * |-----------------|-----------------|-------------|-------------------------|
 * | bookletNotice   | bookletnotice   | churchMain  | NoticeApplyPay.tsx      |
 * | homeinapp       | homeinapp       | churches    | HomeinappPayment.tsx    |
 *
 * 행사 전단지 브라우저 일반결제: PortoneRequestPay.js → POST /paymentrequestpay/event/complete-browser
 *
 * 카드 유형 확인: 빌링키 발급 직후 100원 승인 → 결제 단건 조회로 card_type 확인 → 즉시 취소.
 * card_type 0(신용) / 1(체크), V2: CREDIT/DEBIT. 본 결제 승인 후에도 재확인·체크 시 승인 취소.
 */
const BILLING_SERVICE_BOOKLET_NOTICE = 'bookletNotice';
const CARD_VERIFY_AMOUNT = 100;
const CHECK_CARD_NOT_ALLOWED_MESSAGE =
  '체크카드는 정기결제에 사용할 수 없습니다. 신용카드를 등록해 주세요.';
const BILLING_SERVICE_HOMEINAPP = 'homeinapp';

/** @returns {'bookletNotice'|'homeinapp'|null} */
function resolveBillingServiceType(customData) {
  const raw =
    customData && typeof customData === 'object' ? String(customData.serviceType || '').trim() : '';
  if (raw === BILLING_SERVICE_HOMEINAPP) return BILLING_SERVICE_HOMEINAPP;
  if (raw === '' || raw === BILLING_SERVICE_BOOKLET_NOTICE) return BILLING_SERVICE_BOOKLET_NOTICE;
  return null;
}
const express = require('express');
const router = express.Router()
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const crypto = require('crypto');
const { bookletnoticedb } = require('../dbdatas/bookletdb');
const { homeinappdb } = require('../dbdatas/homeinappdb');
const { insertChurchMainRow } = require('../service/bookletNotice/bookletNoticeShared');
const {
  findHomeinappOrderByPaymentId,
  insertHomeinappOrderWithPayment,
} = require('../service/homeinapp/homeinappPaymentService');
const { safeInsertBillingPayment } = require('./paymentRecordService');
const { notifyMmserviceSubscription } = require('./mmserviceWebhook');
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

function portoneAuthHeaders() {
  return {
    Authorization: `PortOne ${PORTONE_API_SECRET}`,
    'Content-Type': 'application/json',
  };
}

async function portoneJsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...portoneAuthHeaders(), ...(options.headers || {}) },
  });
  const raw = await response.text();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { raw: raw?.slice(0, 500) };
  }
  return { ok: response.ok, status: response.status, parsed };
}

function portoneErrorMessage(parsed, fallback) {
  return (parsed && (parsed.pgMessage || parsed.message)) || fallback;
}

function pickPaymentRoot(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed.payment && typeof parsed.payment === 'object' ? parsed.payment : parsed;
}

/** 결제·빌링키 응답에서 card_type / cardType / Card.type 추출 */
function pickCardTypeFromParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const payment = pickPaymentRoot(parsed);
  const billingKeyInfo =
    parsed.billingKeyInfo && typeof parsed.billingKeyInfo === 'object' ? parsed.billingKeyInfo : null;

  const readers = [
    () => payment?.method?.card?.card?.type,
    () => payment?.method?.card?.card?.card_type,
    () => payment?.method?.card?.card?.cardType,
    () => payment?.method?.card?.detail?.card_type,
    () => payment?.method?.card?.detail?.cardType,
    () => payment?.method?.card?.card_type,
    () => payment?.method?.card?.cardType,
    () => payment?.card_type,
    () => payment?.cardType,
    () => parsed.card_type,
    () => parsed.cardType,
    () => billingKeyInfo?.paymentMethodDetail?.card?.detail?.cardType,
    () => billingKeyInfo?.paymentMethodDetail?.card?.detail?.card_type,
    () => billingKeyInfo?.payment_method_detail?.card?.detail?.card_type,
    () => billingKeyInfo?.payment_method_detail?.card?.detail?.cardType,
    () => billingKeyInfo?.method?.card?.card?.type,
    () => billingKeyInfo?.method?.card?.detail?.card_type,
    () => payment?.pgResponse?.card_type,
    () => payment?.pgResponse?.cardType,
  ];

  const txs = payment?.transactions;
  if (Array.isArray(txs)) {
    for (const tx of txs) {
      const fromTx = pickCardTypeFromParsed(tx);
      if (fromTx != null) return fromTx;
    }
  }

  for (const read of readers) {
    try {
      const v = read();
      if (v != null && String(v).trim() !== '') return v;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function resolveCardTypeFromSources(...sources) {
  for (const src of sources) {
    const t = pickCardTypeFromParsed(src);
    if (t != null) return t;
  }
  return null;
}

/** card_type 1 또는 V2 DEBIT 이면 체크카드 */
function isCheckCard(cardType) {
  if (cardType == null || cardType === '') return false;
  const normalized = String(cardType).trim().toUpperCase();
  if (normalized === '1') return true;
  if (cardType === 1) return true;
  if (normalized === 'DEBIT' || normalized === 'CHECK') return true;
  return false;
}

/** PG가 card_type을 안 줄 때 카드명 힌트(체크/직불 등) */
function isCheckCardHintFromPayment(parsed) {
  const payment = pickPaymentRoot(parsed);
  if (!payment || typeof payment !== 'object') return false;
  const cardBlock = payment.method?.card;
  const names = [
    cardBlock?.card?.name,
    cardBlock?.card?.issuer,
    cardBlock?.cardName,
    payment.card_name,
    payment.cardName,
  ];
  const combined = names
    .filter((n) => n != null && String(n).trim() !== '')
    .join(' ')
    .toLowerCase();
  if (!combined) return false;
  return /체크|check|debit|직불/.test(combined);
}

function isCheckCardDetected(...sources) {
  const cardType = resolveCardTypeFromSources(...sources);
  if (isCheckCard(cardType)) return { detected: true, cardType };
  for (const src of sources) {
    if (isCheckCardHintFromPayment(src)) {
      return { detected: true, cardType: cardType ?? 'HINT' };
    }
  }
  return { detected: false, cardType };
}

async function getPortonePayment(paymentId) {
  return portoneJsonRequest(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
  });
}

async function getPortoneBillingKey(billingKey) {
  return portoneJsonRequest(
    `https://api.portone.io/billing-keys/${encodeURIComponent(billingKey)}`,
    { method: 'GET' },
  );
}

async function inspectCardForBilling(billingKey, paymentId, ...extraSources) {
  const sources = extraSources.filter((s) => s && typeof s === 'object');
  if (paymentId) {
    const payGet = await getPortonePayment(paymentId);
    if (payGet.ok && payGet.parsed) sources.unshift(payGet.parsed);
  }
  if (billingKey) {
    const bkGet = await getPortoneBillingKey(billingKey);
    if (bkGet.ok && bkGet.parsed) sources.push(bkGet.parsed);
  }
  const cardType = resolveCardTypeFromSources(...sources);
  const check = isCheckCardDetected(...sources);
  return { cardType, check };
}

async function rejectCheckCardAndCleanup({ billingKey, paymentIdToCancel, cancelAmount, cardType }) {
  if (paymentIdToCancel && Number(cancelAmount) > 0) {
    const cancelResult = await cancelPortonePayment(paymentIdToCancel, cancelAmount);
    if (!cancelResult.ok) {
      console.error('check card: payment cancel failed', cancelResult.parsed);
    }
  }
  await deletePortoneBillingKey(billingKey);
  return {
    ok: false,
    isCheckCard: true,
    message: CHECK_CARD_NOT_ALLOWED_MESSAGE,
    cardType,
  };
}

async function deletePortoneBillingKey(billingKey) {
  const { ok, parsed } = await portoneJsonRequest(
    `https://api.portone.io/billing-keys/${encodeURIComponent(billingKey)}`,
    { method: 'DELETE' },
  );
  if (!ok) {
    console.error('billing key delete after check card', parsed);
  }
  return ok;
}

async function payWithBillingKey({
  paymentId,
  billingKey,
  amountTotal,
  orderName,
  customerPayload,
}) {
  return portoneJsonRequest(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
    {
      method: 'POST',
      body: JSON.stringify({
        billingKey,
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_BILLING_CHANNEL_KEY,
        orderName,
        customer: customerPayload,
        amount: { total: amountTotal },
        currency: 'KRW',
      }),
    },
  );
}

async function cancelPortonePayment(paymentId, amountTotal) {
  /** V2 취소 API의 amount는 PaymentAmountInput이 아니라 취소 금액 숫자. 미지정 시 전액 취소. */
  const body = {
    storeId: PORTONE_STORE_ID,
    reason: '카드 유형 확인용 검증 결제 취소',
  };
  const cancelAmount = Number(amountTotal);
  if (Number.isFinite(cancelAmount) && cancelAmount > 0) {
    body.amount = cancelAmount;
  }
  return portoneJsonRequest(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

/**
 * 빌링키 발급 정보 + 100원 승인 + 결제/빌링키 조회로 card_type 확인 후 검증 결제 취소.
 */
async function verifyCreditCardWithBillingKey(billingKey, customerPayload, issueParsed) {
  const issueCheck = isCheckCardDetected(issueParsed);
  if (issueCheck.detected) {
    await deletePortoneBillingKey(billingKey);
    return {
      ok: false,
      isCheckCard: true,
      message: CHECK_CARD_NOT_ALLOWED_MESSAGE,
      cardType: issueCheck.cardType,
    };
  }

  const verifyPaymentId = createNewPaymentId('cardverify');
  const { ok, parsed } = await payWithBillingKey({
    paymentId: verifyPaymentId,
    billingKey,
    amountTotal: CARD_VERIFY_AMOUNT,
    orderName: '카드 유형 확인',
    customerPayload,
  });
  if (!ok) {
    return {
      ok: false,
      message: portoneErrorMessage(parsed, '카드 확인 결제에 실패했습니다.'),
      details: parsed,
      verifyPaymentId,
    };
  }

  const inspect = await inspectCardForBilling(billingKey, verifyPaymentId, parsed, issueParsed);
  const cancelResult = await cancelPortonePayment(verifyPaymentId, CARD_VERIFY_AMOUNT);
  if (!cancelResult.ok) {
    console.error('card verify payment cancel failed', cancelResult.parsed);
  }

  const cardTypeResolved = inspect.cardType ?? inspect.check.cardType;
  if (isCheckCard(cardTypeResolved) || inspect.check.detected) {
    await deletePortoneBillingKey(billingKey);
    return {
      ok: false,
      isCheckCard: true,
      message: CHECK_CARD_NOT_ALLOWED_MESSAGE,
      cardType: cardTypeResolved ?? inspect.check.cardType,
      verifyPaymentId,
    };
  }

  if (cardTypeResolved == null) {
    console.warn('card type not resolved after verify payment', { verifyPaymentId, billingKey });
  }

  return { ok: true, cardType: cardTypeResolved, verifyPaymentId };
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

  const billingService = resolveBillingServiceType(customData);
  if (!billingService) {
    return res.status(400).json({
      ok: false,
      message: `serviceType은 "${BILLING_SERVICE_BOOKLET_NOTICE}" 또는 "${BILLING_SERVICE_HOMEINAPP}" 이어야 합니다.`,
    });
  }

  const isHomeinapp = billingService === BILLING_SERVICE_HOMEINAPP;
  const billingOrderName = isHomeinapp ? '홈인앱 상세페이지 제작' : '월간 이용권 정기결제';
  const orderTitleNorm = orderTitle != null ? String(orderTitle).trim() : '';

  try {
    const customerPayload = { id: String(customerId) };
    if (customer && typeof customer === 'object') {
      if (customer.fullName) customerPayload.name = { full: String(customer.fullName).trim() };
      if (customer.phoneNumber) {
        /** PortOne `customer.phoneNumber` 허용 문자: digits + `+- ` 만. 그 외(괄호/점/한글 등) 들어오면 400. */
        const sanitizedPhone = String(customer.phoneNumber).replace(/[^\d+\-\s]/g, '');
        if (sanitizedPhone) customerPayload.phoneNumber = sanitizedPhone;
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

    const cardVerify = await verifyCreditCardWithBillingKey(billingKey, customerPayload, issueParsed);
    if (!cardVerify.ok) {
      return res.status(400).json({
        ok: false,
        message: cardVerify.message,
        code: cardVerify.isCheckCard ? 'CHECK_CARD_NOT_ALLOWED' : 'CARD_VERIFY_FAILED',
        cardType: cardVerify.cardType,
        details: cardVerify.details,
        verifyPaymentId: cardVerify.verifyPaymentId,
      });
    }

    const paymentId = createNewPaymentId(isHomeinapp ? 'homeinapp' : 'notice');
    const amountTotal = Number(amount);

    const { ok: paymentOk, parsed: payParsed } = await payWithBillingKey({
      paymentId,
      billingKey,
      amountTotal,
      orderName: billingOrderName,
      customerPayload,
    });
    if (!paymentOk) {
      const msg = portoneErrorMessage(payParsed, '빌링키 결제 요청에 실패했습니다.');
      return res.status(400).json({ ok: false, message: msg, details: payParsed, paymentId });
    }

    const firstInspect = await inspectCardForBilling(billingKey, paymentId, payParsed, issueParsed);
    const cardTypeAfterFirst = firstInspect.cardType ?? firstInspect.check.cardType;
    if (isCheckCard(cardTypeAfterFirst) || firstInspect.check.detected) {
      const rejected = await rejectCheckCardAndCleanup({
        billingKey,
        paymentIdToCancel: paymentId,
        cancelAmount: amountTotal,
        cardType: cardTypeAfterFirst ?? firstInspect.check.cardType,
      });
      return res.status(400).json({
        ...rejected,
        code: 'CHECK_CARD_NOT_ALLOWED',
        paymentId,
        firstPaymentCancelled: true,
      });
    }
    /** @type {string} PortOne `timeToPay`: RFC 3339 date-time 문자열 */
    const timeToPay = isoTimeNextMonthUtc();
    const schedulePaymentId = createNewPaymentId(isHomeinapp ? 'homeiappsched' : 'noticesched');

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
            orderName: billingOrderName,
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

    if (isHomeinapp) {
      const homeinappChurchName =
        customData && typeof customData === 'object' ? String(customData.churchName || '').trim() : '';
      if (!homeinappChurchName) {
        return res.status(400).json({ ok: false, message: '교회명이 필요합니다.' });
      }

      let homeinappMainId;
      try {
        const existingH = await findHomeinappOrderByPaymentId(homeinappdb, paymentId);
        if (existingH != null) {
          return res.status(409).json({
            ok: false,
            message: '이 결제로 이미 홈인앱 주문이 생성되었습니다.',
            homeinappMainId: existingH,
            paymentId,
            schedulePaymentId,
            firstPaymentSucceeded: true,
            scheduleSucceeded: true,
          });
        }
        homeinappMainId = await insertHomeinappOrderWithPayment(homeinappdb, {
          userAccount,
          churchName: homeinappChurchName,
          ordererName,
          ordererPhone,
          portonePaymentId: paymentId,
          portonePaidAmount: amountTotal,
          portoneOrderName: billingOrderName,
          portonePlan: 'monthly',
          schedulePaymentId,
          billingKey,
          portonePaidAt: paidAtResolved,
          portoneTimeToPay: timeToPay,
          portoneScheduleId: scheduleIdResolved,
        });
      } catch (dbErr) {
        console.error('homeinapp churches INSERT after billing', dbErr);
        return res.status(500).json({
          ok: false,
          message: '결제·예약은 완료되었으나 홈인앱 주문 저장에 실패했습니다. 고객센터로 문의해 주세요.',
          paymentId,
          schedulePaymentId,
          firstPaymentSucceeded: true,
          scheduleSucceeded: true,
        });
      }

      await safeInsertBillingPayment({
        serviceType: BILLING_SERVICE_HOMEINAPP,
        userAccount,
        churchName: homeinappChurchName,
        ordererName,
        ordererPhone,
        orderTitle: orderTitleNorm,
        orderName: billingOrderName,
        totalAmount: amountTotal,
        portonePaymentId: paymentId,
        schedulePaymentId,
        billingKey,
        portoneScheduleId: scheduleIdResolved,
        portonePaidAt: paidAtResolved,
        portoneTimeToPay: timeToPay,
        plan: 'monthly',
        paymentStatus: 'PAID',
        resourceType: 'homeinappMain',
        resourceId: String(homeinappMainId),
        customData,
      });

      await notifyMmserviceSubscription({
        userAccount,
        subscriptionServiceType:
          customData && typeof customData === 'object' ? customData.subscriptionServiceType : null,
        plan: 'monthly',
        customData,
      });

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
        homeinappMainId,
      });
    }

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
      createBody.portoneOrderName = billingOrderName;
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

    await safeInsertBillingPayment({
      serviceType: BILLING_SERVICE_BOOKLET_NOTICE,
      userAccount,
      ordererName,
      ordererPhone,
      orderTitle: orderTitleNorm,
      orderName: billingOrderName,
      totalAmount: amountTotal,
      portonePaymentId: paymentId,
      schedulePaymentId,
      billingKey,
      portoneScheduleId: scheduleIdResolved,
      portonePaidAt: paidAtResolved,
      portoneTimeToPay: timeToPay,
      plan: 'monthly',
      paymentStatus: 'PAID',
      resourceType: 'churchMain',
      resourceId: String(churchMainId),
      customData,
    });

    await notifyMmserviceSubscription({
      userAccount,
      subscriptionServiceType:
        customData && typeof customData === 'object' ? customData.subscriptionServiceType : null,
      plan: 'monthly',
      customData,
    });

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



module.exports = router;