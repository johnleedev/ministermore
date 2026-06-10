/**
 * service DB 결제 기록 API
 * GET /payment/my/list?userAccount= — 마이페이지 결제 목록
 */
const express = require('express');
const cors = require('cors');
const { listMyPayments } = require('./paymentRecordService');

const router = express.Router();
router.use(cors());
router.use(express.json());

router.get('/my/list', async (req, res) => {
  try {
    const userAccount = String(req.query.userAccount || '').trim();
    if (!userAccount) {
      return res.status(400).json({ ok: false, message: 'userAccount가 필요합니다.' });
    }

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const rows = await listMyPayments(userAccount, {
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return res.json({ ok: true, rows });
  } catch (err) {
    console.error('GET /payment/my/list', err);
    return res.status(500).json({ ok: false, message: '결제 목록 조회에 실패했습니다.' });
  }
});

module.exports = router;
