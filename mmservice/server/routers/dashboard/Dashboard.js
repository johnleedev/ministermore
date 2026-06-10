/**
 * 대시보드 API
 * GET /api/dashboard/subscriptions?userId={userAccount}
 *
 * - DB: MySQL (common.user_subscriptions)
 * - userId: 사역자모아 common.user.userAccount 와 동일한 로그인 ID
 * - 구독 행이 없으면 5종 서비스 모두 hasAccess: false, expireDate: null
 * - service_type: FLYER_RETREAT, CHURCH_APP, ATTENDANCE, FLYER_INTRO, FLYER_EVENT
 */
const express = require('express');
const cors = require('cors');
const { getUserSubscriptions } = require('./subscriptionService');

const router = express.Router();
router.use(cors());
router.use(express.json());

router.get('/subscriptions', async (req, res) => {
  try {
    const userId = String(req.query.userId || req.query.userAccount || '').trim();
    if (!userId) {
      return res.status(400).json({ ok: false, message: 'userId가 필요합니다.' });
    }

    const data = await getUserSubscriptions(userId);
    return res.json({ ok: true, ...data });
  } catch (err) {
    console.error('GET /api/dashboard/subscriptions', err);
    return res.status(500).json({ ok: false, message: '구독 정보 조회에 실패했습니다.' });
  }
});

module.exports = router;
