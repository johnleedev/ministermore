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
  await queryAsync(
    `INSERT INTO users (church_id, deviceId, fcmToken, deviceType, isActive)
     VALUES (?, ?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       church_id = VALUES(church_id),
       fcmToken = VALUES(fcmToken),
       deviceType = VALUES(deviceType),
       isActive = TRUE`,
    [churchId, deviceId, fcmToken, deviceType]
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
  if (deviceId) {
    try {
      await upsertUserTokenByDevice({ churchId, fcmToken, deviceType, deviceId });
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
    const rows = await queryAsync('SELECT id, firebaseKey FROM churches WHERE id = ? LIMIT 1', [churchId]);
    if (!rows.length) return { exists: false, keyName: '' };
    return {
      exists: true,
      keyName: String(rows[0].firebaseKey || '').trim(),
    };
  } catch (error) {
    // Backward compatibility for old schema (firebaseKeyPath)
    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
      const rows = await queryAsync('SELECT id, firebaseKeyPath FROM churches WHERE id = ? LIMIT 1', [churchId]);
      if (!rows.length) return { exists: false, keyName: '' };
      const oldPath = String(rows[0].firebaseKeyPath || '').trim();
      return {
        exists: true,
        keyName: path.basename(oldPath),
      };
    }
    throw error;
  }
}

async function updateChurchFirebaseKeyName(churchId, keyName) {
  try {
    await queryAsync('UPDATE churches SET firebaseKey = ? WHERE id = ?', [keyName, churchId]);
    return 'firebaseKey';
  } catch (error) {
    // Backward compatibility for old schema (firebaseKeyPath)
    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
      const legacyPath = `server/routers/service/homeinappkeys/${keyName}`;
      await queryAsync('UPDATE churches SET firebaseKeyPath = ? WHERE id = ?', [legacyPath, churchId]);
      return 'firebaseKeyPath';
    }
    throw error;
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
      data: { churchId, firebaseKey: keyFileName },
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
        message: '해당 교회의 firebaseKey가 없습니다. 키 파일을 먼저 업로드해주세요.',
      });
    }
    const firebaseKeyPath = path.resolve(firebaseKeysDir, path.basename(keyName));

    const users = await queryAsync(
      'SELECT fcmToken FROM users WHERE church_id = ? AND isActive = TRUE AND fcmToken IS NOT NULL',
      [churchId]
    );
    const tokens = users
      .map((row) => String(row.fcmToken || '').trim())
      .filter(Boolean);

    if (!tokens.length) {
      return res.json({
        success: true,
        message: '활성 사용자 토큰이 없어 발송을 생략했습니다.',
        result: { successCount: 0, failureCount: 0, total: 0 },
      });
    }

    const app = getFirebaseAdmin(churchId, firebaseKeyPath);
    const message = {
      notification: { title, body: content },
      tokens,
    };

    const response = await app.messaging().sendEachForMulticast(message);
    const failed = response.responses || [];
    const invalidTokens = [];
    for (let i = 0; i < failed.length; i += 1) {
      const item = failed[i];
      if (item.success) continue;
      const code = String(item.error?.code || '');
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        invalidTokens.push(tokens[i]);
      }
    }
    const cleanedCount = await deactivateInvalidTokens(invalidTokens);
    await insertNotificationHistory({ churchId, adminLoginId, title, content });

    return res.json({
      success: true,
      message: `${churchId} 프로젝트를 통해 ${response.successCount}건 발송 완료`,
      result: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        total: tokens.length,
        cleanedCount,
      },
    });
  } catch (error) {
    console.error('sendPushByChurch error:', error);
    return res.status(500).json({
      success: false,
      message: '푸시 발송 중 오류가 발생했습니다.',
      error: error?.message || 'unknown error',
    });
  }
});

module.exports = router;
