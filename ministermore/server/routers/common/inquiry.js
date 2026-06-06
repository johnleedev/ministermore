const express = require('express');
const router = express.Router();
const cors = require('cors');
const { commondb } = require('../dbdatas/commondb');

router.use(cors());
router.use(express.json());

const INQUIRY_CATEGORIES = ['오류 신고', '기능 제안', '이용 문의', '광고·제휴', '기타'];
const PLATFORMS = ['web', 'app'];

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

router.get('/categories', (_req, res) => {
  res.json({ categories: INQUIRY_CATEGORIES });
});

router.post('/submit', async (req, res) => {
  try {
    const category = String(req.body?.category || '').trim();
    const content = String(req.body?.content || '').trim();
    const userAccount = String(req.body?.userAccount || '').trim() || null;
    const userNickName = String(req.body?.userNickName || '').trim() || null;
    const contactRaw = String(req.body?.contact || '').trim();
    const contact = contactRaw || null;
    const platformRaw = String(req.body?.platform || 'web').trim().toLowerCase();
    const platform = PLATFORMS.includes(platformRaw) ? platformRaw : 'web';

    if (!INQUIRY_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: '문의 종류를 선택해주세요.' });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: '문의 내용을 입력해주세요.' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ success: false, message: '문의 내용은 5000자 이내로 입력해주세요.' });
    }
    if (contact && contact.length > 100) {
      return res.status(400).json({ success: false, message: '연락처는 100자 이내로 입력해주세요.' });
    }

    const result = await execCommon(
      `INSERT INTO userInquiry
        (userAccount, userNickName, contact, category, content, platform, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [userAccount, userNickName, contact, category, content, platform],
    );

    return res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('inquiry submit error:', error);
    return res.status(500).json({ success: false, message: '문의 접수에 실패했습니다.' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    const category = String(req.query.category || '').trim();
    const q = String(req.query.q || '').trim();
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;

    let sql = `SELECT id, userAccount, userNickName, contact, category, content, platform, status, createdAt
       FROM userInquiry
       WHERE 1=1`;
    const params = [];

    if (status && ['pending', 'answered', 'closed'].includes(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category && INQUIRY_CATEGORIES.includes(category)) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (q) {
      sql += ' AND (userAccount LIKE ? OR userNickName LIKE ? OR contact LIKE ? OR content LIKE ? OR category LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const rows = await queryCommon(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error('inquiry list error:', error);
    return res.status(500).json([]);
  }
});

router.post('/updatestatus', async (req, res) => {
  try {
    const id = Number(req.body?.id);
    const status = String(req.body?.status || '').trim();
    const STATUSES = ['pending', 'answered', 'closed'];

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: '잘못된 문의 ID입니다.' });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: '처리 상태를 확인해주세요.' });
    }

    const result = await execCommon('UPDATE userInquiry SET status = ? WHERE id = ?', [status, id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('inquiry updatestatus error:', error);
    return res.status(500).json({ success: false, message: '상태 변경에 실패했습니다.' });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const id = Number(req.body?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: '잘못된 문의 ID입니다.' });
    }

    const result = await execCommon('DELETE FROM userInquiry WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('inquiry delete error:', error);
    return res.status(500).json({ success: false, message: '문의 삭제에 실패했습니다.' });
  }
});

module.exports = router;
