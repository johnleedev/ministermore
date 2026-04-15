const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const { bulletindb } = require('../../dbdatas/bulletindb');
const { toInt } = require('./bulletinShared');

function sendDetailById(id, res) {
  const infoQuery = `
    SELECT m.id, m.userAccount, m.templateId, m.created_at, m.updated_at,
           i.churchName, i.bulletinTitle, i.bulletinDate, i.imageMainName, i.introText, i.newsText, i.quiry
    FROM bulletinMain m
    LEFT JOIN bulletinInfo i ON m.id = i.bulletinMainId
    WHERE m.id = ?
    LIMIT 1
  `;

  bulletindb.query(infoQuery, [id], (err, infoRows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!infoRows || infoRows.length === 0) return res.send(false);

    bulletindb.query(
      'SELECT sortOrder, num, title, sub, rightText FROM bulletinWorshipOrder WHERE bulletinMainId = ? ORDER BY sortOrder ASC, id ASC',
      [id],
      (orderErr, orderRows) => {
        if (orderErr) return res.status(500).json({ success: false, message: orderErr.message });
        const row = infoRows[0];
        const worshipRows = (orderRows || []).map((r, i) => ({
          num: r.num != null && String(r.num).trim() !== '' ? String(r.num) : String(i + 1),
          title: r.title || '',
          sub: r.sub || '',
          right: r.rightText || '',
        }));
        return res.json([{ ...row, worshipRows }]);
      }
    );
  });
}

router.post('/getdatabookletspart', (req, res) => {
  const id = toInt(req.body?.id);
  if (id == null) return res.send(false);
  return sendDetailById(id, res);
});

router.get('/getUserBulletins/:userAccount', (req, res) => {
  const userAccount = req.params?.userAccount;
  if (!userAccount) return res.status(400).json({ success: false, data: [] });

  const query = `
    SELECT m.id, m.userAccount, m.templateId, m.created_at, m.updated_at,
           i.churchName, i.bulletinTitle, i.bulletinDate, i.imageMainName
    FROM bulletinMain m
    LEFT JOIN bulletinInfo i ON m.id = i.bulletinMainId
    WHERE m.userAccount = ?
    ORDER BY m.id DESC
  `;
  bulletindb.query(query, [userAccount], (err, rows) => {
    if (err) return res.status(500).json({ success: false, data: [] });
    return res.json({ success: true, data: rows || [] });
  });
});

router.post('/getdatabookletsearch', (req, res) => {
  const word = String(req.body?.word || '').trim();
  const likeWord = `%${word}%`;
  const query = `
    SELECT m.id, m.userAccount, m.templateId,
           i.churchName, i.bulletinTitle, i.bulletinDate, i.imageMainName
    FROM bulletinMain m
    LEFT JOIN bulletinInfo i ON m.id = i.bulletinMainId
    WHERE i.bulletinTitle LIKE ? OR i.churchName LIKE ?
    ORDER BY m.id DESC
  `;
  bulletindb.query(query, [likeWord, likeWord], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows || rows.length === 0) return res.json({ count: 0, data: false });
    return res.json({ count: rows.length, data: rows });
  });
});

module.exports = router;
