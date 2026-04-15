const express = require('express');
const router = express.Router();
const cors = require('cors');
const { rollbookdb } = require('../dbdatas/rollbookdb');
const { rollbookbychurchdb } = require('../dbdatas/rollbookbychurchdb');

router.use(express.json());
router.use(cors());

function getChurchPrefix(churchId, cb) {
  rollbookdb.query('SELECT eng_name FROM churches WHERE id = ?', [churchId], (err, rows) => {
    if (err) return cb(err, null);
    if (!rows || rows.length === 0) return cb(new Error('교회를 찾을 수 없습니다.'), null);
    const eng = String(rows[0].eng_name).toLowerCase().replace(/\s+/g, '');
    return cb(null, `ch${churchId}${eng}`);
  });
}

function ensureStudentColumns(studentsTable, cb) {
  const cols = [
    ['birth_date', 'DATE NULL'],
    ['school', 'VARCHAR(100) NULL'],
    ['phone', 'VARCHAR(500) NULL'],
    ['dept_id', 'INT NULL'],
  ];
  let i = 0;
  function next() {
    if (i >= cols.length) {
      rollbookbychurchdb.query(`ALTER TABLE ${studentsTable} MODIFY COLUMN phone VARCHAR(500) NULL`, (modErr) => {
        cb(null);
      });
      return;
    }
    rollbookbychurchdb.query(`ALTER TABLE ${studentsTable} ADD COLUMN ${cols[i][0]} ${cols[i][1]}`, (err) => {
      i++;
      if (err && err.errno !== 1060) return cb(err);
      next();
    });
  }
  next();
}

function ensureAttendanceColumns(attendanceTable, cb) {
  const cols = [
    ['dept_id', 'INT NULL'],
    ['group_id', 'INT NULL'],
  ];
  let i = 0;
  function next() {
    if (i >= cols.length) return cb(null);
    rollbookbychurchdb.query(`ALTER TABLE ${attendanceTable} ADD COLUMN ${cols[i][0]} ${cols[i][1]}`, (err) => {
      i++;
      if (err && err.errno !== 1060) return cb(err);
      next();
    });
  }
  next();
}

function doAttendanceQuery(students, attendanceTable, yearNum, startDate, endDate, res) {
  if (!students || students.length === 0) return res.json([]);
  const studentIds = students.map((s) => s.id);
  const placeholders = studentIds.map(() => '?').join(',');
  rollbookbychurchdb.query(
    `SELECT student_id, att_date, status FROM ${attendanceTable}
     WHERE student_id IN (${placeholders}) AND att_date BETWEEN ? AND ?`,
    [...studentIds, startDate, endDate],
    (aErr, rows) => {
      const byStudent = {};
      if (!aErr && rows) {
        rows.forEach((r) => {
          const raw = r.att_date;
          let dayStr = '';
          if (raw != null) {
            if (typeof raw === 'string') {
              dayStr = raw.replace(/-/g, '').slice(4, 8);
            } else if (raw instanceof Date) {
              const m = String(raw.getMonth() + 1).padStart(2, '0');
              const d = String(raw.getDate()).padStart(2, '0');
              dayStr = m + d;
            } else {
              dayStr = String(raw).replace(/-/g, '').slice(4, 8);
            }
          }
          if (!dayStr) return;
          if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
          byStudent[r.student_id].push({ day: dayStr, present: Boolean(r.status) });
        });
      }
      const birthDate = (s) => {
        if (!s.birth_date) return { birthYear: '', birthMonth: '', birthDay: '' };
        const d = typeof s.birth_date === 'string' ? s.birth_date : (s.birth_date.toISOString ? s.birth_date.toISOString().slice(0, 10) : '');
        const parts = d.split('-');
        return { birthYear: parts[0] || '', birthMonth: parts[1] || '', birthDay: parts[2] || '' };
      };
      const result = students.map((s) => {
        const bd = birthDate(s);
        return {
          id: s.id,
          name: s.name,
          birth_date: s.birth_date,
          phone: s.phone || null,
          school: s.school || null,
          birthYear: bd.birthYear,
          birthMonth: bd.birthMonth,
          birthDay: bd.birthDay,
          presents2025: JSON.stringify(byStudent[s.id] || []),
        };
      });
      res.json(result);
    }
  );
}

// 해당 연도 주일(일요일) 목록 - day 형식 "MMdd"
router.post('/getyearstate', (req, res) => {
  const { thisyear } = req.body;
  const year = parseInt(thisyear || new Date().getFullYear(), 10);
  if (isNaN(year)) return res.status(400).json({ error: '유효한 연도를 입력해 주세요.' });
  const daysList = [];
  for (let month = 1; month <= 12; month++) {
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month - 1, d);
      if (date.getMonth() !== month - 1 || date.getDate() !== d) continue;
      if (date.getDay() === 0) {
        daysList.push({ day: String(month).padStart(2, '0') + String(d).padStart(2, '0') });
      }
    }
  }
  res.json(daysList);
});

// 소그룹 학생 목록 (관리용 - 이름, 생년월일, 학교/직장, 연락처)
router.post('/getstudentlist', (req, res) => {
  const { churchId, groupId } = req.body;
  const churchIdNum = parseInt(churchId, 10);
  const groupIdNum = parseInt(groupId, 10);
  if (!churchIdNum || !groupIdNum) return res.status(400).json({ error: 'churchId, groupId가 필요합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    rollbookbychurchdb.query(
      `SELECT id, group_id, name, birth_date, school, phone, created_at FROM ${studentsTable} WHERE group_id = ? ORDER BY name ASC`,
      [groupIdNum],
      (sErr, students) => {
        if (sErr) {
          if (sErr.code === 'ER_BAD_FIELD_ERROR') {
            rollbookbychurchdb.query(
              `SELECT id, group_id, name, created_at FROM ${studentsTable} WHERE group_id = ? ORDER BY name ASC`,
              [groupIdNum],
              (e2, rows) => {
                if (e2) return res.status(500).json({ error: e2.message });
                const data = (rows || []).map((r) => ({
                  id: r.id,
                  name: r.name,
                  birth_date: null,
                  school: null,
                  phone: null,
                }));
                return res.json(data);
              }
            );
            return;
          }
          if (sErr.code === 'ER_NO_SUCH_TABLE') return res.json([]);
          return res.status(500).json({ error: sErr.message });
        }
        const data = (students || []).map((s) => ({
          id: s.id,
          name: s.name,
          birth_date: s.birth_date,
          school: s.school || null,
          phone: s.phone || null,
        }));
        res.json(data);
      }
    );
  });
});

// 학생 추가
router.post('/addstudent', (req, res) => {
  const { churchId, groupId, name, birth_date, school, phone } = req.body;
  const churchIdNum = parseInt(churchId, 10);
  const groupIdNum = parseInt(groupId, 10);
  if (!churchIdNum || !groupIdNum || !name || !name.trim()) return res.status(400).json({ error: 'churchId, groupId, name이 필요합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    ensureStudentColumns(studentsTable, (ecErr) => {
      if (ecErr) return res.status(500).json({ error: ecErr.message });
      rollbookdb.query('SELECT dept_id FROM smallgroups WHERE id = ?', [groupIdNum], (dErr, deptRows) => {
        const deptId = (deptRows && deptRows[0] && deptRows[0].dept_id != null) ? deptRows[0].dept_id : null;
        rollbookbychurchdb.query(
          `SELECT id FROM ${studentsTable} WHERE group_id = ? AND name = ?`,
          [groupIdNum, name.trim()],
          (cErr, existing) => {
            if (cErr) return res.status(500).json({ error: cErr.message });
            if (existing && existing.length > 0) return res.status(400).json({ success: false, error: '이미 등록된 이름입니다.' });
            rollbookbychurchdb.query(
              `INSERT INTO ${studentsTable} (group_id, dept_id, name, birth_date, school, phone) VALUES (?, ?, ?, ?, ?, ?)`,
              [groupIdNum, deptId, name.trim(), birth_date || null, school || null, phone || null],
              (iErr, result) => {
                if (iErr) return res.status(500).json({ error: iErr.message });
                res.json({ success: true, message: '학생이 등록되었습니다.', id: result.insertId });
              }
            );
          }
        );
      });
    });
  });
});

// 학생 수정
router.post('/updatestudent', (req, res) => {
  const { churchId, studentId, name, birth_date, school, phone } = req.body;
  const churchIdNum = parseInt(churchId, 10);
  const studentIdNum = parseInt(studentId, 10);
  if (!churchIdNum || !studentIdNum || !name || !name.trim()) return res.status(400).json({ error: 'churchId, studentId, name이 필요합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    ensureStudentColumns(studentsTable, (ecErr) => {
      if (ecErr) return res.status(500).json({ error: ecErr.message });
      rollbookbychurchdb.query(
        `UPDATE ${studentsTable} SET name = ?, birth_date = ?, school = ?, phone = ? WHERE id = ?`,
        [name.trim(), birth_date || null, school || null, phone || null, studentIdNum],
        (uErr) => {
          if (uErr) return res.status(500).json({ error: uErr.message });
          res.json({ success: true, message: '수정되었습니다.' });
        }
      );
    });
  });
});

// 학생 삭제
router.post('/deletestudent', (req, res) => {
  const { churchId, studentId } = req.body;
  const churchIdNum = parseInt(churchId, 10);
  const studentIdNum = parseInt(studentId, 10);
  if (!churchIdNum || !studentIdNum) return res.status(400).json({ error: 'churchId, studentId가 필요합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    const attendanceTable = `${prefix}_attendance`;
    rollbookbychurchdb.query(`DELETE FROM ${attendanceTable} WHERE student_id = ?`, [studentIdNum], (aErr) => {
      if (aErr) return res.status(500).json({ error: aErr.message });
      rollbookbychurchdb.query(`DELETE FROM ${studentsTable} WHERE id = ?`, [studentIdNum], (sErr) => {
        if (sErr) return res.status(500).json({ error: sErr.message });
        res.json({ success: true, message: '삭제되었습니다.' });
      });
    });
  });
});

// 소그룹 학생 목록 + 출석 데이터 (ch{id}{eng}_students, ch{id}{eng}_attendance)
router.post('/getpersonalpresents', (req, res) => {
  const { churchId, groupId, year } = req.body;
  const yearNum = parseInt(year || new Date().getFullYear(), 10);
  const churchIdNum = parseInt(churchId, 10);
  const groupIdNum = parseInt(groupId, 10);
  if (!churchIdNum || !groupIdNum) return res.status(400).json({ error: 'churchId, groupId가 필요합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    const attendanceTable = `${prefix}_attendance`;
    const startDate = `${yearNum}-01-01`;
    const endDate = `${yearNum}-12-31`;

    const selectCols = 'id, group_id, name, birth_date, school, phone, created_at';
    rollbookbychurchdb.query(
      `SELECT ${selectCols} FROM ${studentsTable} WHERE group_id = ? ORDER BY name ASC`,
      [groupIdNum],
      (sErr, students) => {
        if (sErr) {
          if (sErr.code === 'ER_BAD_FIELD_ERROR') {
            rollbookbychurchdb.query(
              `SELECT id, group_id, name, created_at FROM ${studentsTable} WHERE group_id = ? ORDER BY name ASC`,
              [groupIdNum],
              (e2, students2) => {
                if (e2) return res.status(500).json({ error: e2.message });
                return doAttendanceQuery(students2 || [], attendanceTable, yearNum, startDate, endDate, res);
              }
            );
            return;
          }
          if (sErr.code === 'ER_NO_SUCH_TABLE') return res.json([]);
          return res.status(500).json({ error: sErr.message });
        }
        doAttendanceQuery(students || [], attendanceTable, yearNum, startDate, endDate, res);
      }
    );
  });
});

// 출석 저장
router.post('/revisepersonalpresents', (req, res) => {
  const { churchId, groupId, name, presents, year } = req.body;
  const yearNum = parseInt(year || new Date().getFullYear(), 10);
  const churchIdNum = parseInt(churchId, 10);
  const groupIdNum = parseInt(groupId, 10);
  if (!churchIdNum || !groupIdNum || !name) return res.status(400).json({ error: 'churchId, groupId, name이 필요합니다.' });

  let parsed;
  try {
    parsed = typeof presents === 'string' ? JSON.parse(presents) : presents;
  } catch (e) {
    return res.status(400).json({ error: 'presents JSON 형식이 올바르지 않습니다.' });
  }
  if (!Array.isArray(parsed)) return res.status(400).json({ error: 'presents는 배열이어야 합니다.' });

  getChurchPrefix(churchIdNum, (err, prefix) => {
    if (err) return res.status(500).json({ error: err.message });
    const studentsTable = `${prefix}_students`;
    const attendanceTable = `${prefix}_attendance`;

    rollbookdb.query('SELECT dept_id FROM smallgroups WHERE id = ?', [groupIdNum], (dErr, deptRows) => {
      const deptId = (deptRows && deptRows[0] && deptRows[0].dept_id != null) ? deptRows[0].dept_id : null;
      ensureAttendanceColumns(attendanceTable, (acErr) => {
        if (acErr) return res.status(500).json({ error: acErr.message });
        rollbookbychurchdb.query(
          `SELECT id FROM ${studentsTable} WHERE group_id = ? AND name = ?`,
          [groupIdNum, name],
          (sErr, studentRows) => {
            if (sErr) return res.status(500).json({ error: sErr.message });
            if (!studentRows || studentRows.length === 0) return res.status(404).json({ success: false, error: '학생을 찾을 수 없습니다.' });
            const studentId = studentRows[0].id;

            const upsert = (index) => {
              if (index >= parsed.length) return res.json({ success: true });
              const item = parsed[index];
              const dayStr = String(item.day || '').replace(/\D/g, '').slice(0, 4).padStart(4, '0');
              if (dayStr.length !== 4) return upsert(index + 1);
              const attDate = `${yearNum}-${dayStr.slice(0, 2)}-${dayStr.slice(2, 4)}`;
              const status = item.present === true || item.present === 'true' || item.present === 1 ? 1 : 0;

              rollbookbychurchdb.query(
                `INSERT INTO ${attendanceTable} (student_id, att_date, status, dept_id, group_id) VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), dept_id = VALUES(dept_id), group_id = VALUES(group_id)`,
                [studentId, attDate, status, deptId, groupIdNum],
                (uErr) => {
                  if (uErr) return res.status(500).json({ error: uErr.message });
                  upsert(index + 1);
                }
              );
            };
            upsert(0);
          }
        );
      });
    });
  });
});

module.exports = router;
