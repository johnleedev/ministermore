/**
 * 수련회 전단지 결제 완료 → mmservice retreatMain 프로비저닝
 */
require('dotenv').config();

const axios = require('axios');

const PROVISION_PATH = '/api/retreat/provision-from-payment';
const API_KEY = process.env.MMSERVICE_WEBHOOK_API_KEY || '';

function resolveProvisionUrl() {
  const envUrl = String(process.env.MMSERVICE_WEBHOOK_URL || '').trim();
  if (envUrl) {
    const base = envUrl.replace(/\/$/, '').replace(/\/api\/payments\/webhook$/, '');
    return `${base}${PROVISION_PATH}`;
  }
  return `https://mmservice.co.kr${PROVISION_PATH}`;
}

const PROVISION_URL = resolveProvisionUrl();

async function notifyMmserviceRetreatProvision(payload) {
  if (!API_KEY) {
    console.warn('[mmserviceRetreatProvision] MMSERVICE_WEBHOOK_API_KEY 미설정 — 프로비저닝 생략');
    return null;
  }

  const eventMainId = payload?.eventMainId;
  if (eventMainId == null) return null;

  try {
    const res = await axios.post(PROVISION_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      timeout: 15000,
    });
    return res.data;
  } catch (err) {
    console.error('[mmserviceRetreatProvision] 실패:', err?.response?.data || err?.message || err);
    return null;
  }
}

module.exports = {
  notifyMmserviceRetreatProvision,
};
