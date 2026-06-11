/**
 * service DB 결제 기록 — oneTimePayment / billingPayment
 * (구 common.serviceApply 대체)
 */
const express = require('express');
const cors = require('cors');
const {
  listAdminPayments,
  deleteAdminPayment,
  updateAdminPaymentStatus,
  recordLegacyServiceApply,
} = require('../payment/paymentRecordService');

const router = express.Router();
router.use(cors());
router.use(express.json());

router.post('/record', async (req, res) => {
  try {
    const result = await recordLegacyServiceApply(req.body || {});
    return res.status(200).json({ ok: true, id: result.id, paymentKind: result.paymentKind });
  } catch (error) {
    console.error('serviceapply /record error:', error);
    return res.status(500).json({ ok: false, message: 'failed to save service apply record' });
  }
});

router.post('/updateStatus', async (req, res) => {
  try {
    const affectedRows = await updateAdminPaymentStatus(req.body || {});
    return res.status(200).json({ ok: true, affectedRows });
  } catch (error) {
    const status = error.message?.includes('must be one of') || error.message?.includes('필요')
      ? 400
      : 500;
    if (status >= 500) console.error('serviceapply /updateStatus error:', error);
    return res.status(status).json({ ok: false, message: error.message || 'failed to update status' });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { id, paymentKind } = req.body || {};
    if (id == null || !Number.isFinite(Number(id))) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }
    if (!paymentKind) {
      return res.status(400).json({ ok: false, message: 'paymentKind is required (billing | oneTime)' });
    }
    const affectedRows = await deleteAdminPayment(paymentKind, Number(id));
    return res.status(200).json({ ok: true, affectedRows });
  } catch (error) {
    console.error('serviceapply /delete error:', error);
    return res.status(500).json({ ok: false, message: 'failed to delete service apply record' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit);
    const rawOffset = Number(req.query.offset);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 100;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const serviceType = String(req.query.serviceType || '').trim();

    const rows = await listAdminPayments({
      serviceType: serviceType || undefined,
      limit,
      offset,
    });

    return res.status(200).json({ ok: true, rows });
  } catch (error) {
    console.error('serviceapply /list error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch service apply list' });
  }
});

module.exports = router;
