const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const { bulletindb } = require('../../dbdatas/bulletindb');
const { toInt, parseWorshipRows } = require('./bulletinShared');

function escapeHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toEnglishFilenamePart(name) {
  const asciiOnly = String(name || '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return asciiOnly || 'bulletin';
}

function parseBulletinMainImageName(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const first = parsed.find((v) => String(v || '').trim() !== '');
        return first ? String(first).trim() : '';
      }
    } catch (_) {
      // noop
    }
  }
  return s;
}

function makeBulletinHtml({ bulletinMainId, title, imageUrl }) {
  const safeTitle = escapeHtml(title || '교회 주보');
  const safeImageUrl = escapeHtml(imageUrl || '');
  const linkUrl = `https://ministermore.co.kr/bulletin?id=${bulletinMainId}`;
  const safeLinkUrl = escapeHtml(linkUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${safeLinkUrl}" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />

    <meta name="description" content="${safeTitle}"/>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeTitle}">
    <meta property="og:image" content="${safeImageUrl}">
    <meta property="og:url" content="${safeLinkUrl}">

    <title>${safeTitle}</title>

  </head>
  <body>
    <script>window.location.replace("${safeLinkUrl}");</script>
    <p>이동 중... <a href="${safeLinkUrl}">여기를 클릭하세요</a></p>
  </body>
</html>
`;
}

function insertMainRow(body, cb) {
  const userAccount = body?.userAccount || '';
  const templateId = body?.templateId || 'classic';
  const query = `
    INSERT INTO bulletinMain (userAccount, templateId, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())
  `;
  bulletindb.query(query, [userAccount, templateId], (err, result) => {
    if (err) return cb(err);
    return cb(null, result.insertId);
  });
}

router.post('/create', (req, res) => {
  insertMainRow(req.body || {}, (err, newId) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    return res.json({ success: true, id: newId });
  });
});

router.post('/save', (req, res) => {
  const body = req.body || {};
  const parsedId = toInt(body.bulletinMainId || body.id);
  const finishSave = (bulletinMainId) => {
    const churchName = String(body.churchName || '').trim();
    const bulletinTitle = String(body.bulletinTitle || '').trim();
    const bulletinDate = String(body.bulletinDate || '').trim();
    const imageMainName = String(body.imageMainName || '').trim();
    const introText = String(body.introText || '').trim();
    const newsText = String(body.newsText || '').trim();
    const quiry = String(body.quiry || '').trim();
    const templateId = String(body.templateId || 'classic').trim() || 'classic';
    const worshipRows = parseWorshipRows(body.worshipRows);

    bulletindb.query('UPDATE bulletinMain SET templateId = ?, updated_at = NOW() WHERE id = ?', [templateId, bulletinMainId], (upErr) => {
      if (upErr) return res.status(500).json({ success: false, message: upErr.message });

      const infoUpsert = `
        INSERT INTO bulletinInfo (bulletinMainId, churchName, bulletinTitle, bulletinDate, imageMainName, introText, newsText, quiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          churchName = VALUES(churchName),
          bulletinTitle = VALUES(bulletinTitle),
          bulletinDate = VALUES(bulletinDate),
          imageMainName = VALUES(imageMainName),
          introText = VALUES(introText),
          newsText = VALUES(newsText),
          quiry = VALUES(quiry)
      `;
      const infoValues = [bulletinMainId, churchName, bulletinTitle, bulletinDate, imageMainName, introText, newsText, quiry];

      bulletindb.query(infoUpsert, infoValues, (infoErr) => {
        if (infoErr) return res.status(500).json({ success: false, message: infoErr.message });

        bulletindb.query('DELETE FROM bulletinWorshipOrder WHERE bulletinMainId = ?', [bulletinMainId], (delErr) => {
          if (delErr) return res.status(500).json({ success: false, message: delErr.message });

          const rows = (worshipRows || [])
            .map((r, i) => ({
              sortOrder: i,
              num: r?.num != null ? String(r.num) : String(i + 1),
              title: r?.title != null ? String(r.title) : '',
              sub: r?.sub != null ? String(r.sub) : '',
              rightText: r?.right != null ? String(r.right) : '',
            }))
            .filter((r) => r.title.trim() || r.sub.trim() || r.rightText.trim());

          if (rows.length === 0) {
            return res.json({ success: true, id: bulletinMainId });
          }

          const insertOne = (idx) => {
            if (idx >= rows.length) return res.json({ success: true, id: bulletinMainId });
            const row = rows[idx];
            const insertOrder = `
              INSERT INTO bulletinWorshipOrder (bulletinMainId, sortOrder, num, title, sub, rightText)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            bulletindb.query(
              insertOrder,
              [bulletinMainId, row.sortOrder, row.num, row.title, row.sub, row.rightText],
              (insErr) => {
                if (insErr) return res.status(500).json({ success: false, message: insErr.message });
                return insertOne(idx + 1);
              }
            );
          };

          return insertOne(0);
        });
      });
    });
  };

  if (parsedId != null) return finishSave(parsedId);
  return insertMainRow(body, (createErr, newId) => {
    if (createErr) return res.status(500).json({ success: false, message: createErr.message });
    return finishSave(newId);
  });
});

router.post('/deleteBulletin', (req, res) => {
  const bulletinMainId = toInt(req.body?.bulletinMainId || req.body?.id);
  const userAccount = req.body?.userAccount;
  if (bulletinMainId == null || !userAccount) {
    return res.status(400).json({ success: false, message: 'bulletinMainId와 userAccount가 필요합니다.' });
  }

  bulletindb.query(
    'SELECT id FROM bulletinMain WHERE id = ? AND userAccount = ?',
    [bulletinMainId, userAccount],
    (authErr, rows) => {
      if (authErr) return res.status(500).json({ success: false, message: authErr.message });
      if (!rows || rows.length === 0) return res.status(403).json({ success: false, message: '권한이 없습니다.' });

      bulletindb.query('DELETE FROM bulletinWorshipOrder WHERE bulletinMainId = ?', [bulletinMainId], () => {});
      bulletindb.query('DELETE FROM bulletinInfo WHERE bulletinMainId = ?', [bulletinMainId], () => {});
      bulletindb.query('DELETE FROM bulletinMain WHERE id = ?', [bulletinMainId], (delErr) => {
        if (delErr) return res.status(500).json({ success: false, message: delErr.message });
        return res.json({ success: true });
      });
    }
  );
});

router.post('/generateBulletinHtml', (req, res) => {
  const bulletinMainId = toInt(req.body?.bulletinMainId || req.body?.id);
  const userAccount = String(req.body?.userAccount || '').trim();

  if (bulletinMainId == null && !userAccount) {
    return res.status(400).json({ success: false, message: 'bulletinMainId 또는 userAccount가 필요합니다.' });
  }

  const byIdQuery = `
    SELECT m.id, i.churchName, i.bulletinTitle, i.imageMainName
    FROM bulletinMain m
    LEFT JOIN bulletinInfo i ON i.bulletinMainId = m.id
    WHERE m.id = ?
    LIMIT 1
  `;
  const byUserQuery = `
    SELECT m.id, i.churchName, i.bulletinTitle, i.imageMainName
    FROM bulletinMain m
    LEFT JOIN bulletinInfo i ON i.bulletinMainId = m.id
    WHERE m.userAccount = ?
    ORDER BY m.id DESC
    LIMIT 1
  `;
  const query = bulletinMainId != null ? byIdQuery : byUserQuery;
  const params = bulletinMainId != null ? [bulletinMainId] : [userAccount];

  bulletindb.query(query, params, (err, rows) => {
    if (err) {
      console.error('generateBulletinHtml query error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '주보 정보를 찾을 수 없습니다.' });
    }

    const row = rows[0] || {};
    const id = Number(row.id);
    const title = String(row.bulletinTitle || row.churchName || '').trim() || `bulletin${id}`;
    const fileNamePart = toEnglishFilenamePart(String(row.churchName || row.bulletinTitle || ''));
    const fileName = `id${id}${fileNamePart}.html`;
    const firstImage = parseBulletinMainImageName(row.imageMainName);
    const imageUrl = firstImage
      ? `https://www.ministermore.co.kr/images/bulletin/mainimages/${firstImage}`
      : '';

    const html = makeBulletinHtml({
      bulletinMainId: id,
      title,
      imageUrl,
    });

    const targetDir = path.resolve(__dirname, '../../../build/hp/bulletin');
    const targetPath = path.join(targetDir, fileName);
    try {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, html, 'utf8');
      return res.json({
        success: true,
        bulletinMainId: id,
        fileName,
        filePath: `/hp/bulletin/${fileName}`,
      });
    } catch (writeErr) {
      console.error('generateBulletinHtml write error:', writeErr.message);
      return res.status(500).json({ success: false, message: writeErr.message });
    }
  });
});

module.exports = router;
