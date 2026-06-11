/**
 * 구 common.serviceApply — ministermore service DB(oneTimePayment/billingPayment)로 프록시
 * admin/service-detail 만 mmservice DB 조회 유지
 */
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { bookletnoticedb, bookleteventdb } = require('../dbdatas/bookletdb');
const { homeinappdb } = require('../dbdatas/homeinappdb');

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const MINISTERMORE_BASE = String(process.env.MINISTERMORE_API_URL || 'https://ministermore.co.kr').replace(/\/$/, '');

function queryPool(pool, sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function proxyToMinistermore(req, res, method, path) {
  try {
    const url = `${MINISTERMORE_BASE}/serviceapply${path}`;
    const response = await axios({
      method,
      url,
      data: req.body,
      params: req.query,
      timeout: 15000,
      validateStatus: () => true,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`serviceapply proxy ${method} ${path}:`, error?.message || error);
    return res.status(502).json({ ok: false, message: 'ministermore serviceapply proxy failed' });
  }
}

router.post('/record', (req, res) => proxyToMinistermore(req, res, 'post', '/record'));
router.post('/updateStatus', (req, res) => proxyToMinistermore(req, res, 'post', '/updateStatus'));
router.post('/delete', (req, res) => proxyToMinistermore(req, res, 'post', '/delete'));
router.get('/list', (req, res) => proxyToMinistermore(req, res, 'get', '/list'));

/**
 * 관리자: 서비스별 실데이터 상세 목록 (mmservice DB)
 * ?kind=homeinapp | churchapp | bookletNotice | bookletevent
 */
router.get('/admin/service-detail', async (req, res) => {
  const kind = String(req.query.kind || '').trim();
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 300;

  try {
    if (kind === 'homeinapp') {
      const rows = await queryPool(
        homeinappdb,
        'SELECT * FROM churches ORDER BY created_at DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    if (kind === 'churchapp') {
      return res.status(200).json({ ok: true, rows: [] });
    }
    if (kind === 'bookletNotice') {
      const rows = await queryPool(
        bookletnoticedb,
        'SELECT * FROM churchMain ORDER BY id DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    if (kind === 'bookletEvent') {
      const rows = await queryPool(
        bookleteventdb,
        'SELECT * FROM eventMain ORDER BY id DESC LIMIT ?',
        [limit],
      );
      return res.status(200).json({ ok: true, rows });
    }
    return res.status(400).json({
      ok: false,
      message: 'kind must be one of: homeinapp, churchapp, bookletNotice, bookletevent',
    });
  } catch (error) {
    console.error('serviceapply /admin/service-detail error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch service detail rows' });
  }
});

module.exports = router;
