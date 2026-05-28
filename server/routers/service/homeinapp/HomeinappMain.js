const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const { homeinappdb } = require('../../dbdatas/homeinappdb');
const { clearFirebaseAdmin, getFirebaseAdmin } = require('./firebaseAppManager');

router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const firebaseKeysDir = path.resolve(__dirname, '../homeinappkeys');
if (!fs.existsSync(firebaseKeysDir)) {
  fs.mkdirSync(firebaseKeysDir, { recursive: true });
}

const firebaseKeyUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, firebaseKeysDir),
    filename: (req, file, cb) => {
      const churchId = String(req.body?.churchId || 'church').replace(/[^a-zA-Z0-9_-]/g, '');
      cb(null, `${churchId}_${Date.now()}.json`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isJsonName = /\.json$/i.test(file.originalname || '');
    const isJsonMime =
      file.mimetype === 'application/json' ||
      file.mimetype === 'text/json' ||
      file.mimetype === 'application/octet-stream';
    if (isJsonName && isJsonMime) return cb(null, true);
    return cb(new Error('JSON 키 파일만 업로드할 수 있습니다.'));
  },
  limits: { fileSize: 1024 * 1024 },
});

// 로그인 계정 기준으로 최신 churches 데이터 1건 조회
router.get('/getChurchByUser/:userAccount', (req, res) => {
  const userAccount = String(req.params.userAccount || '').trim();
  if (!userAccount) {
    return res.status(400).json({ success: false, data: null, message: 'userAccount가 필요합니다.' });
  }

  const sql = `
    SELECT *
    FROM churches
    WHERE userAccount = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  homeinappdb.query(sql, [userAccount], (err, rows) => {
    if (err) {
      console.error('getChurchByUser error:', err.message);
      return res.status(500).json({ success: false, data: null, message: 'DB 조회 실패' });
    }
    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    return res.json({ success: true, data: rows[0] });
  });
});

/** 로그인 계정이 소유한 churches 전체(최신순) — 마이페이지 홈인앱알림 목록 */
router.get('/getChurchesByUser/:userAccount', (req, res) => {
  const userAccount = String(req.params.userAccount || '').trim();
  if (!userAccount) {
    return res.status(400).json({ success: false, data: [], message: 'userAccount가 필요합니다.' });
  }

  const sql = `
    SELECT *
    FROM churches
    WHERE userAccount = ?
    ORDER BY created_at DESC
  `;

  homeinappdb.query(sql, [userAccount], (err, rows) => {
    if (err) {
      console.error('getChurchesByUser error:', err.message);
      return res.status(500).json({ success: false, data: [], message: 'DB 조회 실패' });
    }
    return res.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  });
});

/** 특정 교회 1건 — 요청 계정이 소유한 경우에만 반환(타 교회 ID 조회 방지) */
router.get('/getChurchForUser/:userAccount/:churchId', (req, res) => {
  const userAccount = String(req.params.userAccount || '').trim();
  const churchId = String(req.params.churchId || '').trim();
  if (!userAccount || !churchId) {
    return res.status(400).json({ success: false, data: null, message: 'userAccount와 churchId가 필요합니다.' });
  }

  const sql = `
    SELECT *
    FROM churches
    WHERE id = ? AND userAccount = ?
    LIMIT 1
  `;

  homeinappdb.query(sql, [churchId, userAccount], (err, rows) => {
    if (err) {
      console.error('getChurchForUser error:', err.message);
      return res.status(500).json({ success: false, data: null, message: 'DB 조회 실패' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: '교회 정보를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data: rows[0] });
  });
});

router.get('/users/:churchId', async (req, res) => {
  const churchId = String(req.params.churchId || '').trim();
  if (!churchId) {
    return res.status(400).json({ success: false, message: 'churchId가 필요합니다.' });
  }

  try {
    const rows = await queryAsync(
      `SELECT id, church_id, deviceId, fcmToken, deviceType, isActive, created_at
       FROM users
       WHERE church_id = ?
       ORDER BY id DESC`,
      [churchId]
    );

    const total = rows.length;
    const active = rows.filter((r) => Boolean(r.isActive)).length;
    return res.json({
      success: true,
      data: rows,
      summary: { total, active, inactive: total - active },
    });
  } catch (error) {
    console.error('get church users error:', error);
    return res.status(500).json({
      success: false,
      message: 'users 조회 실패',
      error: error?.message || 'unknown error',
    });
  }
});

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    homeinappdb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });
}

async function churchExists(churchId) {
  const rows = await queryAsync('SELECT id FROM churches WHERE id = ? LIMIT 1', [churchId]);
  return rows.length > 0;
}

async function upsertUserTokenByDevice({ churchId, fcmToken, deviceType, deviceId }) {
  const did = String(deviceId || '').trim();
  if (!did) {
    throw new Error('deviceId is required for upsertUserTokenByDevice');
  }

  const updateResult = await queryAsync(
    `UPDATE users
     SET fcmToken = ?, deviceType = ?, isActive = TRUE
     WHERE church_id = ? AND deviceId = ?`,
    [fcmToken, deviceType, churchId, did],
  );
  if (updateResult && Number(updateResult.affectedRows) > 0) {
    return;
  }

  await queryAsync(
    `INSERT INTO users (church_id, deviceId, fcmToken, deviceType, isActive)
     VALUES (?, ?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       church_id = VALUES(church_id),
       deviceId = VALUES(deviceId),
       fcmToken = VALUES(fcmToken),
       deviceType = VALUES(deviceType),
       isActive = TRUE`,
    [churchId, did, fcmToken, deviceType],
  );
}

async function upsertUserTokenByToken({ churchId, fcmToken, deviceType }) {
  await queryAsync(
    `INSERT INTO users (church_id, fcmToken, deviceType, isActive)
     VALUES (?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       church_id = VALUES(church_id),
       deviceType = VALUES(deviceType),
       isActive = TRUE`,
    [churchId, fcmToken, deviceType]
  );
}

async function registerUserPushToken({ churchId, fcmToken, deviceType, deviceId }) {
  const did = String(deviceId ?? '').trim();
  if (did) {
    try {
      await upsertUserTokenByDevice({ churchId, fcmToken, deviceType, deviceId: did });
      return { mode: 'deviceId' };
    } catch (error) {
      // Backward compatibility for schemas without deviceId column
      if (!(error && error.code === 'ER_BAD_FIELD_ERROR')) throw error;
    }
  }
  await upsertUserTokenByToken({ churchId, fcmToken, deviceType });
  return { mode: 'token' };
}

async function deactivateInvalidTokens(tokens) {
  if (!tokens.length) return 0;
  const placeholders = tokens.map(() => '?').join(', ');
  await queryAsync(`UPDATE users SET isActive = FALSE WHERE fcmToken IN (${placeholders})`, tokens);
  return tokens.length;
}

async function updateUserActiveByToken({ churchId, fcmToken, isActive }) {
  const activeValue = isActive === '1' ? 1 : 0;
  const updateResult = await queryAsync(
    `UPDATE users
     SET isActive = ?
     WHERE church_id = ? AND fcmToken = ?`,
    [activeValue, churchId, fcmToken]
  );

  if (!updateResult || !updateResult.affectedRows) {
    return { updated: false, data: null };
  }

  const rows = await queryAsync(
    `SELECT id, church_id, fcmToken, isActive, deviceType, created_at
     FROM users
     WHERE church_id = ? AND fcmToken = ?
     ORDER BY id DESC
     LIMIT 1`,
    [churchId, fcmToken]
  );

  return { updated: true, data: rows[0] || null };
}

async function insertNotificationHistory({ churchId, adminLoginId, title, content }) {
  await queryAsync(
    `INSERT INTO notifications (church_id, adminLoginId, title, content)
     VALUES (?, ?, ?, ?)`,
    [churchId, adminLoginId || null, title, content]
  );
}

async function incrementNotificationReadCount({ id, churchId }) {
  const baseSql = `UPDATE notifications
                   SET readCount = COALESCE(readCount, 0) + 1
                   WHERE id = ?`;
  const sql = churchId ? `${baseSql} AND church_id = ?` : baseSql;
  const params = churchId ? [id, churchId] : [id];

  const updateResult = await queryAsync(sql, params);
  if (!updateResult || !updateResult.affectedRows) {
    return { updated: false };
  }

  const rows = await queryAsync(
    `SELECT id, church_id, title, readCount, sent_at
     FROM notifications
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return { updated: true, data: rows[0] || null };
}

async function getNotificationListByChurch({ churchId, limit = 30, offset = 0 }) {
  const rows = await queryAsync(
    `SELECT id, church_id, adminLoginId, title, content, COALESCE(readCount, 0) AS readCount, sent_at
     FROM notifications
     WHERE church_id = ?
     ORDER BY sent_at DESC
     LIMIT ? OFFSET ?`,
    [churchId, limit, offset]
  );

  const countRows = await queryAsync(
    `SELECT COUNT(*) AS totalCount
     FROM notifications
     WHERE church_id = ?`,
    [churchId]
  );

  return {
    list: rows,
    totalCount: Number(countRows?.[0]?.totalCount || 0),
  };
}

router.get('/notifications/summary/:churchId', async (req, res) => {
  const churchId = String(req.params.churchId || '').trim();
  if (!churchId) {
    return res.status(400).json({ success: false, message: 'churchId가 필요합니다.' });
  }

  try {
    const dailyRows = await queryAsync(
      `SELECT DATE_FORMAT(sent_at, '%Y-%m-%d') AS dayKey, COUNT(*) AS sentCount
       FROM notifications
       WHERE church_id = ? AND sent_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(sent_at, '%Y-%m-%d')
       ORDER BY DATE_FORMAT(sent_at, '%Y-%m-%d') ASC`,
      [churchId]
    );

    const historyRows = await queryAsync(
      `SELECT id, church_id, adminLoginId, title, content, sent_at, COALESCE(readCount, 0) AS readCount
       FROM notifications
       WHERE church_id = ?
       ORDER BY sent_at DESC
       LIMIT 20`,
      [churchId]
    );

    const [todayCountRow] = await queryAsync(
      `SELECT COUNT(*) AS c
       FROM notifications
       WHERE church_id = ? AND DATE(sent_at) = CURDATE()`,
      [churchId]
    );
    const todaySentCount = Number(todayCountRow?.c || 0);

    const notif7d = await queryAsync(
      `SELECT COALESCE(readCount, 0) AS readCount
       FROM notifications
       WHERE church_id = ? AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [churchId]
    );
    const [activeUsersRow] = await queryAsync(
      `SELECT COUNT(*) AS c FROM users WHERE church_id = ? AND isActive = 1`,
      [churchId]
    );
    const activeUserCount = Math.max(1, Number(activeUsersRow?.c || 0));
    let avgOpenRate7d = 0;
    if (notif7d.length) {
      const totalRate = notif7d.reduce((sum, row) => {
        const r = Math.min(100, (Number(row.readCount || 0) / activeUserCount) * 100);
        return sum + r;
      }, 0);
      avgOpenRate7d = totalRate / notif7d.length;
    }

    const map = new Map();
    for (const row of dailyRows) {
      map.set(String(row.dayKey), Number(row.sentCount || 0));
    }

    const daily = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily.push({
        dayKey: key,
        sentCount: map.get(key) || 0,
      });
    }

    return res.json({
      success: true,
      data: {
        daily,
        history: historyRows,
        stats: {
          todaySentCount,
          avgOpenRate7d,
          openRateDenominator: activeUserCount,
        },
      },
    });
  } catch (error) {
    console.error('notifications summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'notifications 조회 실패',
      error: error?.message || 'unknown error',
    });
  }
});


router.get('/notifications/:churchId/list', async (req, res) => {
  const churchId = String(req.params.churchId || '').trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  if (!churchId) {
    return res.status(400).json({ success: false, message: '유효한 church_id가 필요합니다.' });
  }

  try {
    const result = await getNotificationListByChurch({ churchId, limit, offset });
    return res.json({
      success: true,
      data: {
        churchId,
        list: result.list,
        paging: {
          limit,
          offset,
          count: result.list.length,
          totalCount: result.totalCount,
          hasNext: offset + result.list.length < result.totalCount,
        },
      },
    });
  } catch (error) {
    console.error('get notification list error:', error);
    return res.status(500).json({
      success: false,
      message: '알림 목록 조회 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});


router.post('/notifications/:churchId/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  const churchId = String(req.params.churchId || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: '유효한 notifications.id가 필요합니다.' });
  }
  if (!churchId) {
    return res.status(400).json({ success: false, message: '유효한 church_id가 필요합니다.' });
  }

  try {
    const result = await incrementNotificationReadCount({
      id,
      churchId,
    });

    if (!result.updated) {
      return res.status(404).json({
        success: false,
        message: '해당 알림을 찾을 수 없습니다.',
      });
    }

    return res.json({
      success: true,
      message: 'readCount가 증가되었습니다.',
      data: result.data,
    });
  } catch (error) {
    console.error('increment notification readCount error:', error);
    return res.status(500).json({
      success: false,
      message: 'readCount 증가 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

router.delete('/notifications/:churchId/:id', async (req, res) => {
  const id = Number(req.params.id);
  const churchId = String(req.params.churchId || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: '유효한 notifications.id가 필요합니다.' });
  }
  if (!churchId) {
    return res.status(400).json({ success: false, message: '유효한 church_id가 필요합니다.' });
  }

  try {
    const result = await queryAsync(
      'DELETE FROM notifications WHERE id = ? AND church_id = ? LIMIT 1',
      [id, churchId],
    );
    const affected = Number(result?.affectedRows ?? 0);
    if (!affected) {
      return res.status(404).json({
        success: false,
        message: '해당 알림을 찾을 수 없습니다.',
      });
    }
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    console.error('delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: '알림 삭제 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

router.post('/updateUserActive', async (req, res) => {
  const churchId = String(req.body?.churchId || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  const isActive = String(req.body?.isActive || '').trim();

  if (!churchId || !fcmToken || !['0', '1'].includes(isActive)) {
    return res.status(400).json({
      success: false,
      message: 'churchId, fcmToken, isActive(0|1)은 필수입니다.',
    });
  }

  try {
    const result = await updateUserActiveByToken({ churchId, fcmToken, isActive });
    if (!result.updated) {
      return res.status(404).json({
        success: false,
        message: '해당 사용자 토큰을 찾을 수 없습니다.',
      });
    }

    return res.json({
      success: true,
      message: 'isActive가 업데이트되었습니다.',
      data: result.data,
    });
  } catch (error) {
    console.error('updateUserActive error:', error);
    return res.status(500).json({
      success: false,
      message: 'isActive 업데이트 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

// 홈입앱 관련 코드 ------------------------------------------------------------------------------------

// 토큰 등록 확인
router.post('/registerUserToken', async (req, res) => {
  const churchId = String(req.body?.churchId || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  const deviceType = String(req.body?.deviceType || '').trim().toLowerCase() || 'android';
  const deviceId = String(req.body?.deviceId || '').trim();

  if (!churchId || !fcmToken) {
    return res.status(400).json({
      success: false,
      message: 'churchId, fcmToken은 필수입니다.',
    });
  }

  try {
    const exists = await churchExists(churchId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '유효하지 않은 교회 코드입니다.',
      });
    }

    const result = await registerUserPushToken({
      churchId,
      fcmToken,
      deviceType: ['android', 'ios', 'web'].includes(deviceType) ? deviceType : 'android',
      deviceId,
    });

    return res.json({
      success: true,
      message: '토큰이 등록/갱신되었습니다.',
      data: { churchId, mode: result.mode },
    });
  } catch (error) {
    console.error('registerUserToken error:', error);
    return res.status(500).json({
      success: false,
      message: '토큰 등록 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

router.post('/refreshUserToken', async (req, res) => {
  const churchId = String(req.body?.churchId || '').trim();
  const fcmToken = String(req.body?.fcmToken || '').trim();
  const deviceType = String(req.body?.deviceType || '').trim().toLowerCase() || 'android';
  const deviceId = String(req.body?.deviceId || '').trim();

  if (!churchId || !fcmToken) {
    return res.status(400).json({
      success: false,
      message: 'churchId, fcmToken은 필수입니다.',
    });
  }

  try {
    const exists = await churchExists(churchId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '유효하지 않은 교회 코드입니다.',
      });
    }

    const result = await registerUserPushToken({
      churchId,
      fcmToken,
      deviceType: ['android', 'ios', 'web'].includes(deviceType) ? deviceType : 'android',
      deviceId,
    });

    return res.json({
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: { churchId, mode: result.mode },
    });
  } catch (error) {
    console.error('refreshUserToken error:', error);
    return res.status(500).json({
      success: false,
      message: '토큰 갱신 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

async function getChurchFirebaseKeyName(churchId) {
  try {
    const rows = await queryAsync(
      'SELECT id, firebaseKeyPath FROM churches WHERE id = ? LIMIT 1',
      [churchId],
    );
    if (!rows.length) return { exists: false, keyName: '' };
    const raw = String(rows[0].firebaseKeyPath ?? '').trim();
    return {
      exists: true,
      keyName: raw ? path.basename(raw) : '',
    };
  } catch (error) {
    if (!(error && error.code === 'ER_BAD_FIELD_ERROR')) throw error;
    const rows = await queryAsync('SELECT id, firebaseKey FROM churches WHERE id = ? LIMIT 1', [churchId]);
    if (!rows.length) return { exists: false, keyName: '' };
    const raw = String(rows[0].firebaseKey || '').trim();
    return { exists: true, keyName: raw ? path.basename(raw) : '' };
  }
}

async function updateChurchFirebaseKeyName(churchId, keyName) {
  const fileOnly = path.basename(String(keyName || '').trim());
  try {
    await queryAsync('UPDATE churches SET firebaseKeyPath = ? WHERE id = ?', [fileOnly, churchId]);
    return 'firebaseKeyPath';
  } catch (error) {
    if (!(error && error.code === 'ER_BAD_FIELD_ERROR')) throw error;
    await queryAsync('UPDATE churches SET firebaseKey = ? WHERE id = ?', [fileOnly, churchId]);
    return 'firebaseKey';
  }
}

router.post('/uploadFirebaseKey', firebaseKeyUpload.single('firebaseKey'), async (req, res) => {
  const churchId = String(req.body?.churchId || '').trim();
  const uploaded = req.file;

  if (!churchId) {
    if (uploaded?.path) fs.unlink(uploaded.path, () => {});
    return res.status(400).json({ success: false, message: 'churchId는 필수입니다.' });
  }

  if (!uploaded) {
    return res.status(400).json({ success: false, message: 'firebaseKey 파일이 필요합니다.' });
  }

  const keyFileName = path.basename(uploaded.filename || uploaded.originalname || '').trim();

  try {
    // uploaded JSON validity check
    const raw = fs.readFileSync(uploaded.path, 'utf8');
    JSON.parse(raw);

    const churchInfo = await getChurchFirebaseKeyName(churchId);
    if (!churchInfo.exists) {
      fs.unlink(uploaded.path, () => {});
      return res.status(404).json({ success: false, message: '해당 churchId를 찾을 수 없습니다.' });
    }

    const oldKeyName = churchInfo.keyName;

    const updatedColumn = await updateChurchFirebaseKeyName(churchId, keyFileName);
    await clearFirebaseAdmin(churchId);

    if (oldKeyName && oldKeyName !== keyFileName) {
      const oldAbs = path.resolve(firebaseKeysDir, path.basename(oldKeyName));
      if (fs.existsSync(oldAbs)) fs.unlink(oldAbs, () => {});
    }

    return res.json({
      success: true,
      message: `Firebase 키 파일이 업로드되었고 churches.${updatedColumn} 값이 갱신되었습니다.`,
      data: { churchId, firebaseKeyPath: keyFileName },
    });
  } catch (error) {
    fs.unlink(uploaded.path, () => {});
    return res.status(400).json({
      success: false,
      message: '키 파일 처리 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

router.post('/sendPushByChurch', async (req, res) => {
  const churchId = String(req.body?.churchId || '').trim();
  const adminLoginId = String(req.body?.adminLoginId || '').trim();
  const title = String(req.body?.title || '').trim();
  const content = String(req.body?.content || '').trim();

  if (!churchId || !title || !content) {
    return res.status(400).json({
      success: false,
      message: 'churchId, title, content는 필수입니다.',
    });
  }

  try {
    const churchInfo = await getChurchFirebaseKeyName(churchId);
    if (!churchInfo.exists) {
      return res.status(404).json({
        success: false,
        message: '해당 churchId를 찾을 수 없습니다.',
      });
    }
    const keyName = String(churchInfo.keyName || '').trim();
    if (!keyName) {
      return res.status(404).json({
        success: false,
        message: '해당 교회의 firebaseKeyPath(키 파일명)가 없습니다. 키 파일을 먼저 등록해주세요.',
      });
    }

    const users = await queryAsync(
      'SELECT fcmToken FROM users WHERE church_id = ? AND isActive = TRUE AND fcmToken IS NOT NULL',
      [churchId]
    );
    const tokens = [
      ...new Set(
        users
          .map((row) => String(row.fcmToken || '').trim())
          .filter(Boolean)
      ),
    ];

    if (!tokens.length) {
      return res.json({
        success: true,
        message: '활성 사용자 토큰이 없어 발송을 생략했습니다.',
        result: { successCount: 0, failureCount: 0, total: 0 },
      });
    }

    await clearFirebaseAdmin(churchId);
    const app = getFirebaseAdmin(churchId, keyName);
    const messaging = app.messaging();

    /** FCM multicast 상한(초과 시 sendEachForMulticast / sendMulticast 가 예외) */
    const FCM_MULTICAST_MAX = 500;
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    const sendOneBatch = async (batchTokens) => {
      const payload = {
        notification: { title, body: content },
        data: {
          source: 'homeinapp',
          title: String(title),
          body: String(content),
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        tokens: batchTokens,
      };
      if (typeof messaging.sendEachForMulticast === 'function') {
        return messaging.sendEachForMulticast(payload);
      }
      return messaging.sendMulticast(payload);
    };

    for (let offset = 0; offset < tokens.length; offset += FCM_MULTICAST_MAX) {
      const batch = tokens.slice(offset, offset + FCM_MULTICAST_MAX);
      const response = await sendOneBatch(batch);
      successCount += Number(response.successCount || 0);
      failureCount += Number(response.failureCount || 0);
      const failed = response.responses || [];
      for (let i = 0; i < failed.length; i += 1) {
        const item = failed[i];
        if (item.success) continue;
        const code = String(item.error?.code || '');
        const lower = code.toLowerCase();
        if (
          lower.includes('registration-token-not-registered') ||
          lower.includes('invalid-registration-token')
        ) {
          invalidTokens.push(batch[i]);
        }
      }
    }

    const cleanedCount = await deactivateInvalidTokens(invalidTokens);
    await insertNotificationHistory({ churchId, adminLoginId, title, content });

    return res.json({
      success: true,
      message: `${churchId} 프로젝트를 통해 ${successCount}건 발송 완료`,
      result: {
        successCount,
        failureCount,
        total: tokens.length,
        cleanedCount,
      },
    });
  } catch (error) {
    console.error('sendPushByChurch error:', error);
    const detail = error?.message || 'unknown error';
    return res.status(500).json({
      success: false,
      message: '푸시 발송 중 오류가 발생했습니다.',
      error: detail,
    });
  }
});

/** 관리자: churches.status 갱신 — applied | process | completed (process는 DB에 progress로 저장) */
router.post('/admin/church-status', async (req, res) => {
  try {
    const id = req.body?.id ?? req.body?.churchId;
    const raw = String(req.body?.status ?? '').trim().toLowerCase();
    if (id == null || id === '') {
      return res.status(400).json({ success: false, message: 'id가 필요합니다.' });
    }

    let status = raw;
    if (status === 'process') status = 'progress';
    const allowed = new Set(['applied', 'progress', 'completed']);
    if (!allowed.has(status)) {
      return res.status(400).json({
        success: false,
        message: 'status는 applied, process(또는 progress), completed 중 하나여야 합니다.',
      });
    }

    const result = await queryAsync('UPDATE churches SET status = ? WHERE id = ? LIMIT 1', [
      status,
      String(id),
    ]);
    const affected = result?.affectedRows ?? 0;
    if (!affected) {
      return res.status(404).json({ success: false, message: '해당 id의 교회 레코드를 찾을 수 없습니다.' });
    }

    const rows = await queryAsync('SELECT * FROM churches WHERE id = ? LIMIT 1', [String(id)]);
    return res.json({ success: true, data: rows[0] || null, message: '상태가 갱신되었습니다.' });
  } catch (error) {
    console.error('admin/church-status error:', error);
    return res.status(500).json({
      success: false,
      message: '상태 갱신 실패',
      error: error?.message || 'unknown error',
    });
  }
});

/** 관리자: churches.firebaseKeyPath(우선) 또는 레거시 firebaseKey — homeinappkeys 기준 JSON 파일명만 저장 */
router.post('/admin/church-firebase-key', async (req, res) => {
  try {
    const id = req.body?.id ?? req.body?.churchId;
    const rawKey = req.body?.firebaseKeyPath ?? req.body?.firebaseKey ?? '';
    if (id == null || id === '') {
      return res.status(400).json({ success: false, message: 'id가 필요합니다.' });
    }

    const fileOnly = path.basename(String(rawKey || '').trim());
    if (!fileOnly) {
      return res.status(400).json({
        success: false,
        message: 'firebase JSON 파일명(또는 경로)을 입력해 주세요.',
      });
    }
    if (!/\.json$/i.test(fileOnly)) {
      return res.status(400).json({
        success: false,
        message: '파일명은 .json으로 끝나야 합니다.',
      });
    }

    const absKey = path.resolve(firebaseKeysDir, fileOnly);
    if (!fs.existsSync(absKey)) {
      return res.status(400).json({
        success: false,
        message: `server/.../homeinappkeys 폴더에 파일이 없습니다: ${fileOnly}`,
      });
    }

    try {
      const raw = fs.readFileSync(absKey, 'utf8');
      JSON.parse(raw);
    } catch {
      return res.status(400).json({
        success: false,
        message: '해당 파일이 유효한 JSON이 아닙니다.',
      });
    }

    const existsRows = await queryAsync('SELECT id FROM churches WHERE id = ? LIMIT 1', [String(id)]);
    if (!existsRows.length) {
      return res.status(404).json({ success: false, message: '해당 id의 교회 레코드를 찾을 수 없습니다.' });
    }

    await updateChurchFirebaseKeyName(String(id), fileOnly);
    await clearFirebaseAdmin(String(id));

    const rows = await queryAsync('SELECT * FROM churches WHERE id = ? LIMIT 1', [String(id)]);
    return res.json({
      success: true,
      data: rows[0] || null,
      message: 'firebase 키 파일명이 갱신되었습니다.',
    });
  } catch (error) {
    console.error('admin/church-firebase-key error:', error);
    return res.status(500).json({
      success: false,
      message: 'firebase 키 저장 실패',
      error: error?.message || 'unknown error',
    });
  }
});

module.exports = router;
