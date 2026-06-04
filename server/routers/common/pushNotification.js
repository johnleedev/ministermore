const express = require('express');
const router = express.Router();
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { admindb } = require('../dbdatas/admindb');
const { commondb } = require('../dbdatas/commondb');
const { isActiveAdminStatus } = require('../admin/adminUserStatus');
const { getFirebaseAdmin } = require('./firebaseAppManager');
const secretKey = require('../../secretKey');

router.use(cors());
router.use(express.json());

function parseTokens(rawTokens) {
  if (Array.isArray(rawTokens)) {
    return rawTokens
      .map((v) => String(v || '').trim())
      .filter(Boolean);
  }
  if (typeof rawTokens === 'string') {
    return rawTokens
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

const FIXED_APP_NAME = 'ministermore-admin-push';
const FIXED_FIREBASE_KEY_PATH = path.resolve(
  __dirname,
  'ministermore-firebase-adminsdk-fbsvc-04e7f9667a.json'
);
const MULTICAST_CHUNK_SIZE = 500;

function queryAdmin(sql, params = []) {
  return new Promise((resolve, reject) => {
    admindb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryCommon(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function execCommon(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function readRequesterId(req) {
  const candidates = [
    req.body?.requesterId,
    req.query?.requesterId,
    req.headers['x-admin-id'],
    req.headers['x-requester-id'],
  ];
  for (const value of candidates) {
    const id = Number(value);
    if (Number.isInteger(id) && id > 0) return id;
  }
  return null;
}


async function adminAuthMiddleware(req, res, next) {
  try {
    const requesterId = readRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: '관리자 인증 정보가 없습니다. requesterId를 전달해 주세요.',
      });
    }
    const rows = await queryAdmin(
      'SELECT id, role, status FROM adminusers WHERE id = ? LIMIT 1',
      [requesterId]
    );
    const admin = rows[0];
    if (!admin || !isActiveAdminStatus(admin.status)) {
      return res.status(403).json({
        success: false,
        message: '활성화된 관리자만 푸시를 발송할 수 있습니다.',
      });
    }
    req.adminAuth = {
      id: admin.id,
      role: admin.role,
    };
    return next();
  } catch (error) {
    console.error('push adminAuthMiddleware error:', error);
    return res.status(500).json({
      success: false,
      message: '관리자 인증 처리 중 오류가 발생했습니다.',
    });
  }
}

function makePushPayload(title, body) {
  return {
    notification: { title, body },
    data: {
      title,
      body,
      sentAt: new Date().toISOString(),
    },
  };
}

function normalizeCategory(raw) {
  const key = String(raw || '').trim().toLowerCase();
  if (!key) return '';
  if (['notice', '공지'].includes(key)) return 'notice';
  if (['job', 'recruit', '구인구직'].includes(key)) return 'job';
  if (['retreat', '수련회'].includes(key)) return 'retreat';
  if (['community', 'board', '게시판'].includes(key)) return 'community';
  if (['worship', '예배사역'].includes(key)) return 'worship';
  return String(raw || '').trim();
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function loadUserTableTokens() {
  const rows = await queryCommon(
    `SELECT token
     FROM user
     WHERE token IS NOT NULL AND TRIM(token) <> ''`
  );
  return rows
    .map((row) => String(row?.token || '').trim())
    .filter(Boolean);
}

async function savePushHistory({
  adminId,
  mode,
  topic,
  title,
  body,
  total,
  successCount,
  failureCount,
  chunkSize,
  chunkCount,
}) {
  await execCommon(
    `INSERT INTO pushSendHistory
      (adminId, mode, topic, title, body, total, successCount, failureCount, chunkSize, chunkCount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(adminId) || 0,
      String(mode || ''),
      topic ? String(topic) : null,
      String(title || ''),
      String(body || ''),
      Number(total) || 0,
      Number(successCount) || 0,
      Number(failureCount) || 0,
      Number(chunkSize) || 0,
      Number(chunkCount) || 0,
    ]
  );
}

function resolveUserAccountFromUserToken(userToken) {
  const token = String(userToken || '').trim();
  if (!token) return '';
  try {
    const payload = jwt.verify(token, secretKey.key);
    return String(payload?.USER_ID || '').trim();
  } catch (error) {
    return '';
  }
}

async function resolveUserAccountByRefreshToken(refreshToken) {
  const userAccount = resolveUserAccountFromUserToken(refreshToken);
  if (!userAccount) {
    return '';
  }
  const rows = await queryCommon(
    'SELECT userAccount FROM user WHERE userAccount = ? LIMIT 1',
    [userAccount]
  );
  return String(rows[0]?.userAccount || '').trim();
}

async function syncUserTokenColumn(userAccount, fcmToken) {
  const account = String(userAccount || '').trim();
  const token = String(fcmToken || '').trim();
  if (!account || !token) return;
  await execCommon('UPDATE user SET token = ? WHERE userAccount = ?', [token, account]);
}

router.post('/registerusertoken', async (req, res) => {
  const userToken = String(req.body?.userToken || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  if (!userToken || !fcmToken) {
    return res.status(400).json({ success: false, message: 'userToken, fcmToken은 필수입니다.' });
  }
  try {
    const userAccount = await resolveUserAccountByRefreshToken(userToken);
    if (!userAccount) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자 토큰입니다.' });
    }
    await syncUserTokenColumn(userAccount, fcmToken);
    return res.json({ success: true, message: '사역자모아 푸시 토큰이 등록되었습니다.' });
  } catch (error) {
    console.error('registerusertoken error:', error);
    return res.status(500).json({ success: false, message: '토큰 등록 중 오류가 발생했습니다.' });
  }
});

router.post('/refreshusertoken', async (req, res) => {
  const userToken = String(req.body?.userToken || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  if (!userToken || !fcmToken) {
    return res.status(400).json({ success: false, message: 'userToken, fcmToken은 필수입니다.' });
  }
  try {
    const userAccount = await resolveUserAccountByRefreshToken(userToken);
    if (!userAccount) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자 토큰입니다.' });
    }
    await syncUserTokenColumn(userAccount, fcmToken);
    return res.json({ success: true, message: '사역자모아 푸시 토큰이 갱신되었습니다.' });
  } catch (error) {
    console.error('refreshusertoken error:', error);
    return res.status(500).json({ success: false, message: '토큰 갱신 중 오류가 발생했습니다.' });
  }
});

router.post('/updateuseractive', async (req, res) => {
  const userToken = String(req.body?.userToken || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  const isActive = String(req.body?.isActive || '').trim();
  if (!userToken || !fcmToken || !['0', '1'].includes(isActive)) {
    return res.status(400).json({ success: false, message: 'userToken, fcmToken, isActive(0|1)은 필수입니다.' });
  }
  try {
    const userAccount = await resolveUserAccountByRefreshToken(userToken);
    if (!userAccount) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자 토큰입니다.' });
    }
    // user.token 단일 컬럼만 관리하므로 isActive는 별도 저장하지 않습니다.
    await syncUserTokenColumn(userAccount, fcmToken);
    return res.json({ success: true, message: '사역자모아 푸시 토큰이 동기화되었습니다.' });
  } catch (error) {
    console.error('updateuseractive error:', error);
    return res.status(500).json({ success: false, message: '활성 상태 업데이트 중 오류가 발생했습니다.' });
  }
});

router.get('/usertokencount', adminAuthMiddleware, async (req, res) => {
  try {
    const rows = await queryCommon(
      `SELECT COUNT(*) AS tokenUserCount
       FROM user
       WHERE token IS NOT NULL AND TRIM(token) <> ''`
    );
    return res.json({
      success: true,
      result: {
        tokenUserCount: Number(rows[0]?.tokenUserCount || 0),
      },
    });
  } catch (error) {
    console.error('usertokencount error:', error);
    return res.status(500).json({
      success: false,
      message: 'user 토큰 카운트 조회 중 오류가 발생했습니다.',
    });
  }
});

router.get('/sendhistory', adminAuthMiddleware, async (req, res) => {
  try {
    const rows = await queryCommon(
      `SELECT id, adminId, mode, topic, title, body, total, successCount, failureCount, chunkSize, chunkCount, createdAt
       FROM pushSendHistory
       ORDER BY id DESC
       LIMIT 50`
    );
    return res.json({ success: true, result: rows || [] });
  } catch (error) {
    console.error('sendhistory error:', error);
    return res.status(500).json({
      success: false,
      message: '푸시 발송 이력 조회 중 오류가 발생했습니다.',
    });
  }
});

router.get('/mylist', async (req, res) => {
  try {
    const userToken = String(req.query?.userToken || '').trim();
    const userAccount = await resolveUserAccountByRefreshToken(userToken);
    if (!userAccount) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자 토큰입니다.' });
    }

    const rawLimit = Number(req.query?.limit);
    const rawOffset = Number(req.query?.offset);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, rawLimit)) : 30;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

    const rows = await queryCommon(
      `SELECT id, topic, title, body, createdAt
       FROM pushSendHistory
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const list = (rows || []).map((row) => ({
      id: Number(row.id),
      church_id: '',
      adminLoginId: '',
      topic: row.topic != null ? String(row.topic) : null,
      title: String(row.title || ''),
      content: String(row.body || ''),
      readCount: 0,
      sent_at: row.createdAt,
    }));

    return res.json({
      success: true,
      data: { list },
    });
  } catch (error) {
    console.error('mylist error:', error);
    return res.status(500).json({
      success: false,
      message: '알림 목록 조회 중 오류가 발생했습니다.',
    });
  }
});

router.post('/myread/:id', async (req, res) => {
  try {
    const userToken = String(req.body?.userToken || '').trim();
    const userAccount = await resolveUserAccountByRefreshToken(userToken);
    if (!userAccount) {
      return res.status(401).json({ success: false, message: '유효하지 않은 사용자 토큰입니다.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('myread error:', error);
    return res.status(500).json({
      success: false,
      message: '알림 읽음 처리 중 오류가 발생했습니다.',
    });
  }
});

router.post('/send', adminAuthMiddleware, async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const topic = String(req.body?.topic || '').trim();
  const category = normalizeCategory(req.body?.category);
  const inputTokens = parseTokens(req.body?.tokens);

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'title, body는 필수입니다.' });
  }
  try {
    const app = getFirebaseAdmin(FIXED_APP_NAME, FIXED_FIREBASE_KEY_PATH);
    const messaging = app.messaging();

    if (topic) {
      const messageId = await messaging.send({
        topic,
        ...makePushPayload(title, body),
      });
      await savePushHistory({
        adminId: req.adminAuth?.id,
        mode: 'topic',
        topic: category || topic,
        title,
        body,
        total: 0,
        successCount: 1,
        failureCount: 0,
        chunkSize: 0,
        chunkCount: 0,
      });
      return res.json({
        success: true,
        message: '토픽 푸시 발송이 완료되었습니다.',
        result: { mode: 'topic', topic, messageId },
      });
    }

    const tokens = inputTokens.length > 0 ? inputTokens : await loadUserTableTokens();
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: '발송 가능한 토큰이 없습니다. user.token 값을 먼저 확인해 주세요.',
      });
    }
    const tokenChunks = chunkArray(tokens, MULTICAST_CHUNK_SIZE);
    let successCount = 0;
    let failureCount = 0;
    for (const chunk of tokenChunks) {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        ...makePushPayload(title, body),
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
    }
    await savePushHistory({
      adminId: req.adminAuth?.id,
      mode: 'tokens',
      topic: category || null,
      title,
      body,
      total: tokens.length,
      successCount,
      failureCount,
      chunkSize: MULTICAST_CHUNK_SIZE,
      chunkCount: tokenChunks.length,
    });

    return res.json({
      success: true,
      message: `푸시 발송 완료: ${successCount}/${tokens.length}`,
      result: {
        mode: 'tokens',
        total: tokens.length,
        chunkSize: MULTICAST_CHUNK_SIZE,
        chunkCount: tokenChunks.length,
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    console.error('admin push send error:', error);
    return res.status(500).json({
      success: false,
      message: '푸시 발송 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

module.exports = router;
