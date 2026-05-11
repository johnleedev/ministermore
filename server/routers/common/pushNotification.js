const express = require('express');
const router = express.Router();
const cors = require('cors');
const path = require('path');
const { getFirebaseAdmin } = require('./firebaseAppManager');

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
const FIXED_FIREBASE_KEY_PATH = path.resolve(__dirname, 'ministermore-firebase-adminsdk-fbsvc-04e7f9667a.json');

router.post('/send', async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const topic = String(req.body?.topic || '').trim();
  const tokens = parseTokens(req.body?.tokens);

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'title, body는 필수입니다.' });
  }
  if (!topic && tokens.length === 0) {
    return res.status(400).json({ success: false, message: 'topic 또는 tokens 중 하나는 필수입니다.' });
  }

  try {
    const app = getFirebaseAdmin(FIXED_APP_NAME, FIXED_FIREBASE_KEY_PATH);
    const messaging = app.messaging();

    if (topic) {
      const messageId = await messaging.send({
        topic,
        notification: { title, body },
        data: {
          title,
          body,
          sentAt: new Date().toISOString(),
        },
      });
      return res.json({
        success: true,
        message: '토픽 푸시 발송이 완료되었습니다.',
        result: { mode: 'topic', topic, messageId },
      });
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        title,
        body,
        sentAt: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: `푸시 발송 완료: ${response.successCount}/${tokens.length}`,
      result: {
        mode: 'tokens',
        total: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
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
