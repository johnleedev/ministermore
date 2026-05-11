const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { commondb } = require('../dbdatas/commondb');

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

const CREATE_SERVICE_APPLY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS serviceApply (
  id INT NOT NULL AUTO_INCREMENT,
  serviceType VARCHAR(64) NOT NULL,
  orderName VARCHAR(255) DEFAULT NULL,
  userAccount VARCHAR(255) DEFAULT NULL,
  churchName VARCHAR(255) DEFAULT NULL,
  ordererName VARCHAR(120) DEFAULT NULL,
  ordererPhone VARCHAR(40) DEFAULT NULL,
  amount INT DEFAULT NULL,
  vat INT DEFAULT NULL,
  totalAmount INT DEFAULT NULL,
  paymentStatus VARCHAR(32) NOT NULL DEFAULT 'paid',
  paymentId VARCHAR(255) DEFAULT NULL,
  billingKey VARCHAR(255) DEFAULT NULL,
  memo TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_serviceApply_serviceType_createdAt (serviceType, createdAt),
  KEY idx_serviceApply_userAccount (userAccount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let ensureTablePromise = null;
function ensureServiceApplyTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = queryAsync(CREATE_SERVICE_APPLY_TABLE_SQL).catch((err) => {
      ensureTablePromise = null;
      throw err;
    });
  }
  return ensureTablePromise;
}

router.post('/record', async (req, res) => {
  try {
    await ensureServiceApplyTable();
    const {
      serviceType,
      orderName,
      userAccount,
      churchName,
      ordererName,
      ordererPhone,
      amount,
      vat,
      totalAmount,
      paymentStatus,
      paymentId,
      billingKey,
      memo,
    } = req.body || {};

    const normalizedServiceType = String(serviceType || '').trim();
    if (!normalizedServiceType) {
      return res.status(400).json({ ok: false, message: 'serviceType is required' });
    }

    const result = await queryAsync(
      `INSERT INTO serviceApply (
        serviceType, orderName, userAccount, churchName, ordererName, ordererPhone,
        amount, vat, totalAmount, paymentStatus, paymentId, billingKey, memo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedServiceType,
        orderName != null ? String(orderName).trim().slice(0, 255) : null,
        userAccount != null ? String(userAccount).trim().slice(0, 255) : null,
        churchName != null ? String(churchName).trim().slice(0, 255) : null,
        ordererName != null ? String(ordererName).trim().slice(0, 120) : null,
        ordererPhone != null ? String(ordererPhone).trim().slice(0, 40) : null,
        Number.isFinite(Number(amount)) ? Number(amount) : null,
        Number.isFinite(Number(vat)) ? Number(vat) : null,
        Number.isFinite(Number(totalAmount)) ? Number(totalAmount) : null,
        paymentStatus != null ? String(paymentStatus).trim().slice(0, 32) : 'paid',
        paymentId != null ? String(paymentId).trim().slice(0, 255) : null,
        billingKey != null ? String(billingKey).trim().slice(0, 255) : null,
        memo != null ? String(memo).trim().slice(0, 5000) : null,
      ]
    );

    return res.status(200).json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error('serviceapply /record error:', error);
    return res.status(500).json({ ok: false, message: 'failed to save service apply record' });
  }
});

router.get('/list', async (req, res) => {
  try {
    await ensureServiceApplyTable();
    const rawLimit = Number(req.query.limit);
    const rawOffset = Number(req.query.offset);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 100;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const serviceType = String(req.query.serviceType || '').trim();

    const where = [];
    const params = [];
    if (serviceType) {
      where.push('serviceType = ?');
      params.push(serviceType);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAsync(
      `SELECT id, serviceType, orderName, userAccount, churchName, ordererName, ordererPhone,
              amount, vat, totalAmount, paymentStatus, paymentId, billingKey, memo, createdAt
         FROM serviceApply
         ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({ ok: true, rows });
  } catch (error) {
    console.error('serviceapply /list error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch service apply list' });
  }
});

module.exports = router;
