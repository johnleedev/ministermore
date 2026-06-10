/**
 * POST /api/payments/webhook  (권장, /api/dashboard 와 동일 프록시)
 * POST /v1/payments/webhook   (하위 호환)
 * 사역자모아 결제 완료 → common.user_subscriptions 갱신
 *
 * 환경변수: MMSERVICE_WEBHOOK_API_KEY (요청 헤더 x-api-key 와 동일)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { upsertUserSubscription } = require('./subscriptionUpsert');

const router = express.Router();
router.use(cors());
router.use(express.json());

const WEBHOOK_API_KEY = process.env.MMSERVICE_WEBHOOK_API_KEY || '';

function verifyApiKey(req) {
  if (!WEBHOOK_API_KEY) {
    console.error('[PaymentWebhook] MMSERVICE_WEBHOOK_API_KEY 미설정');
    return false;
  }
  const incoming = req.headers['x-api-key'];
  return typeof incoming === 'string' && incoming === WEBHOOK_API_KEY;
}

router.post('/webhook', async (req, res) => {
  if (!verifyApiKey(req)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  try {
    const userId = String(req.body?.userId || '').trim();
    const serviceType = String(req.body?.serviceType || '').trim().toUpperCase();
    const durationMonths = parseInt(String(req.body?.durationMonths ?? ''), 10);

    if (!userId) {
      return res.status(400).json({ ok: false, message: 'userId가 필요합니다.' });
    }
    if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(serviceType)) {
      return res.status(400).json({
        ok: false,
        message: 'serviceType은 영문 대문자·숫자·밑줄 조합이어야 합니다. (예: FLYER, PUSH, RETREAT)',
      });
    }
    if (!Number.isFinite(durationMonths) || durationMonths < 1) {
      return res.status(400).json({ ok: false, message: 'durationMonths는 1 이상이어야 합니다.' });
    }

    const result = await upsertUserSubscription({ userId, serviceType, durationMonths });
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('POST /v1/payments/webhook', err);
    return res.status(500).json({ ok: false, message: err?.message || '구독 저장에 실패했습니다.' });
  }
});

module.exports = router;
