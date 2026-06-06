const express = require('express');
const router = express.Router();
const cors = require('cors');
const { rollbookdb } = require('../dbdatas/rollbookdb');
const { rollbookbychurchdb } = require('../dbdatas/rollbookbychurchdb');

router.use(express.json());
router.use(cors());

// 운영 비밀번호 확인 (부서관리 등)
router.post('/verifyadminpass', (req, res) => {
  const { church_id, password } = req.body;
  if (!church_id || password === undefined) {
    return res.status(400).json({ success: false, error: 'church_id와 password가 필요합니다.' });
  }
  rollbookdb.query(
    `SELECT adminpasswd FROM churches WHERE id = ?`,
    [church_id],
    (error, result) => {
      if (error) {
        console.error('verifyadminpass:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      if (!result || result.length === 0) {
        return res.json({ success: false, error: '교회를 찾을 수 없습니다.' });
      }
      const stored = result[0].adminpasswd;
      if (!stored) {
        return res.json({ success: false, error: '운영 비밀번호가 설정되지 않았습니다.' });
      }
      if (String(password) !== String(stored)) {
        return res.json({ success: false, error: '비밀번호가 올바르지 않습니다.' });
      }
      res.json({ success: true });
    }
  );
});

// 교회 목록 조회
router.get('/getchurchlist', (req, res) => {
  rollbookdb.query(
    `SELECT id, kor_name, eng_name, description, created_at FROM churches ORDER BY id ASC`,
    (error, result) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
      }
      const data = (result || []).map((r) => ({
        id: r.id,
        churchName: r.kor_name,
        kor_name: r.kor_name,
        eng_name: r.eng_name,
        location: r.description || '',
        description: r.description,
      }));
      res.json({ count: data.length, data });
    }
  );
});

// 교회 검색
router.post('/getdatabookletsearch', (req, res) => {
  const { word } = req.body;
  if (!word || word.length < 2) {
    return res.json({ count: 0, data: [] });
  }
  const like = `%${word}%`;
  rollbookdb.query(
    `SELECT id, kor_name, eng_name, description, created_at
     FROM churches
     WHERE kor_name LIKE ? OR eng_name LIKE ? OR description LIKE ?
     ORDER BY created_at DESC`,
    [like, like, like],
    (error, result) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
      }
      const data = (result || []).map((r) => ({
        id: r.id,
        churchName: r.kor_name,
        kor_name: r.kor_name,
        eng_name: r.eng_name,
        location: r.description || '',
        description: r.description,
      }));
      res.json({ count: data.length, data });
    }
  );
});

// 교회 등록 + rollbookbychurch 내 테이블 자동 생성
router.post('/addchurch', (req, res) => {
  const { kor_name, eng_name, description, adminpasswd } = req.body;
  if (!kor_name || !eng_name) {
    return res.status(400).json({ error: 'kor_name, eng_name이 필요합니다.' });
  }
  const eng = String(eng_name).toLowerCase().replace(/\s+/g, '');
  rollbookdb.query(
    `INSERT INTO churches (kor_name, eng_name, description, adminpasswd) VALUES (?, ?, ?, ?)`,
    [kor_name, eng_name, description || null, adminpasswd || null],
    (err, insertResult) => {
      if (err) {
        console.error('addchurch:', err);
        return res.status(500).json({ error: err.message });
      }
      const churchId = insertResult.insertId;
      const prefix = `ch${churchId}${eng}`;
      const studentsTable = `${prefix}_students`;
      const attendanceTable = `${prefix}_attendance`;
      const createStudents = `CREATE TABLE IF NOT EXISTS ${studentsTable} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        dept_id INT NULL,
        name VARCHAR(50) NOT NULL,
        birth_date DATE NULL,
        school VARCHAR(100) NULL,
        phone VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      const createAttendance = `CREATE TABLE IF NOT EXISTS ${attendanceTable} (
        student_id INT NOT NULL,
        att_date DATE NOT NULL,
        status TINYINT(1) DEFAULT 1,
        dept_id INT NULL,
        group_id INT NULL,
        PRIMARY KEY (student_id, att_date)
      )`;
      rollbookbychurchdb.query(createStudents, (e1) => {
        if (e1) console.error('create students table:', e1);
        rollbookbychurchdb.query(createAttendance, (e2) => {
          if (e2) console.error('create attendance table:', e2);
          res.json({
            success: true,
            message: '교회가 등록되었습니다.',
            data: { id: churchId, kor_name, eng_name }
          });
        });
      });
    }
  );
});

module.exports = router;
