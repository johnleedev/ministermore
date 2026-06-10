/**
 * 결제 완료 후 mmservice 서버에 user_subscriptions 갱신 요청
 * serviceType(subscriptionServiceType)은 프론트에서 보낸 값을 서버가 변환 없이 전달합니다.
 */
require('dotenv').config();

const axios = require('axios');

const WEBHOOK_PATH = '/api/payments/webhook';

function resolveWebhookUrl(raw) {
  const envUrl = String(raw || '').trim();
  if (envUrl) {
    const normalized = envUrl.replace(/\/$/, '');
    if (normalized.endsWith('/webhook')) return normalized;
    return `${normalized}${WEBHOOK_PATH}`;
  }
  return `https://mmservice.co.kr${WEBHOOK_PATH}`;
}

const WEBHOOK_URL = resolveWebhookUrl(process.env.MMSERVICE_WEBHOOK_URL);
const WEBHOOK_API_KEY = process.env.MMSERVICE_WEBHOOK_API_KEY || '';

function resolveDurationMonths({ plan, customData }) {
  if (customData && typeof customData === 'object' && customData.durationMonths != null) {
    const fromCustom = parseInt(String(customData.durationMonths), 10);
    if (Number.isFinite(fromCustom) && fromCustom > 0) return fromCustom;
  }
  if (String(plan || '').toLowerCase() === 'monthly') return 1;
  const fallback = parseInt(process.env.MMSERVICE_DEFAULT_ONETIME_MONTHS || '12', 10);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 12;
}

/**
 * @param {{ userAccount: string, subscriptionServiceType?: string, plan?: string, customData?: object }} payload
 */
async function notifyMmserviceSubscription(payload) {
  const userAccount = payload?.userAccount != null ? String(payload.userAccount).trim() : '';
  const serviceType = String(payload?.subscriptionServiceType || '')
    .trim()
    .toUpperCase();

  if (!userAccount || !serviceType) return null;

  if (!WEBHOOK_API_KEY) {
    console.warn('[mmserviceWebhook] MMSERVICE_WEBHOOK_API_KEY 미설정 — 구독 연동 생략');
    return null;
  }

  const durationMonths = resolveDurationMonths({
    plan: payload.plan,
    customData: payload.customData,
  });

  try {
    const res = await axios.post(
      WEBHOOK_URL,
      {
        userId: userAccount,
        serviceType,
        durationMonths,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': WEBHOOK_API_KEY,
        },
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 300,
      },
    );
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const detail = err?.response?.data || err?.message || err;
    console.error('[mmserviceWebhook] 구독 연동 실패:', { url: WEBHOOK_URL, status, detail });
    return null;
  }
}

module.exports = {
  notifyMmserviceSubscription,
};
