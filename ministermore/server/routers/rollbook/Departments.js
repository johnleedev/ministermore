const express = require('express');
const router = express.Router();
const cors = require('cors');
const { rollbookdb } = require('../dbdatas/rollbookdb');

router.use(express.json());
router.use(cors());

router.post('/getdepartments', (req, res) => {
  const { church_id } = req.body;
  if (!church_id) return res.status(400).json({ error: 'church_id가 필요합니다.' });
  rollbookdb.query(
    `SELECT id, church_id, name, chief_id, chief_name, group_sort, leader_sort, student_sort FROM departments WHERE church_id = ? ORDER BY name ASC`,
    [church_id],
    (error, result) => {
      if (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || (error.message && (error.message.includes('chief_id') || error.message.includes('group_sort') || error.message.includes('student_sort')))) {
          rollbookdb.query(
            `SELECT id, church_id, name, chief_name FROM departments WHERE church_id = ? ORDER BY name ASC`,
            [church_id],
            (err2, result2) => {
              if (err2) return res.status(500).json({ error: err2.message });
              const data = (result2 || []).map((r) => ({
                id: r.id,
                church_id: r.church_id,
                name: r.name,
                chief_id: null,
                chief_name: r.chief_name || '',
                group_sort: '소그룹',
                leader_sort: '교사',
                student_sort: '학생',
              }));
              return res.json({ success: true, data });
            }
          );
          return;
        }
        return res.status(500).json({ error: error.message });
      }
      const data = (result || []).map((r) => ({
        id: r.id,
        church_id: r.church_id,
        name: r.name,
        chief_id: r.chief_id || null,
        chief_name: r.chief_name || '',
        group_sort: r.group_sort || '소그룹',
        leader_sort: r.leader_sort || '교사',
        student_sort: r.student_sort || '학생',
      }));
      res.json({ success: true, data });
    }
  );
});

router.post('/adddepartment', (req, res) => {
  const { church_id, name, chief_name, chief_id, group_sort, leader_sort, student_sort } = req.body;
  if (!church_id || !name) return res.status(400).json({ error: 'church_id, name이 필요합니다.' });
  const gSort = (group_sort && String(group_sort).trim()) || '소그룹';
  const lSort = (leader_sort && String(leader_sort).trim()) || '교사';
  const sSort = (student_sort && String(student_sort).trim()) || '학생';
  rollbookdb.query(
    `SELECT id FROM departments WHERE church_id = ? AND LOWER(name) = LOWER(?)`,
    [church_id, name],
    (checkErr, checkRows) => {
      if (checkErr) return res.status(500).json({ error: checkErr.message });
      if (checkRows && checkRows.length > 0) return res.status(400).json({ error: '이미 등록된 부서명입니다.' });
      rollbookdb.query(
        `INSERT INTO departments (church_id, name, chief_name, chief_id, group_sort, leader_sort, student_sort) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [church_id, name, chief_name || null, chief_id || null, gSort, lSort, sSort],
        (insertErr, insertResult) => {
          if (insertErr && (insertErr.code === 'ER_BAD_FIELD_ERROR' || (insertErr.message && (insertErr.message.includes('chief') || insertErr.message.includes('group_sort') || insertErr.message.includes('student_sort'))))) {
            rollbookdb.query(
              `INSERT INTO departments (church_id, name, chief_name) VALUES (?, ?, ?)`,
              [church_id, name, chief_name || null],
              (e2, r2) => {
                if (e2) return res.status(500).json({ error: e2.message });
                const newDeptId = r2.insertId;
                if (chief_id) addDeptToLeaderDeptId(chief_id, newDeptId, () => setLeaderChief(chief_id, true, () => res.json({ success: true, message: '부서가 등록되었습니다.', data: { id: newDeptId, church_id, name } })));
                else res.json({ success: true, message: '부서가 등록되었습니다.', data: { id: newDeptId, church_id, name } });
              }
            );
            return;
          }
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          const newDeptId = insertResult.insertId;
          if (chief_id) addDeptToLeaderDeptId(chief_id, newDeptId, () => setLeaderChief(chief_id, true, () => res.json({ success: true, message: '부서가 등록되었습니다.', data: { id: newDeptId, church_id, name } })));
          else res.json({ success: true, message: '부서가 등록되었습니다.', data: { id: newDeptId, church_id, name } });
        }
      );
    }
  );
});

router.post('/updatedepartment', (req, res) => {
  const { id, name, chief_name, chief_id, group_sort, leader_sort, student_sort } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id, name이 필요합니다.' });
  const deptId = id;
  const gSort = (group_sort && String(group_sort).trim()) || '소그룹';
  const lSort = (leader_sort && String(leader_sort).trim()) || '교사';
  const sSort = (student_sort && String(student_sort).trim()) || '학생';

  const afterDeptUpdate = (prevChiefId) => {
    const done = () => res.json({ success: true, message: '부서가 수정되었습니다.' });
    const setNewChief = () => {
      if (chief_id) addDeptToLeaderDeptId(chief_id, deptId, () => setLeaderChief(chief_id, true, done));
      else done();
    };
    if (prevChiefId && prevChiefId !== chief_id) {
      rollbookdb.query(
        `SELECT COUNT(*) AS cnt FROM departments WHERE chief_id = ? AND id != ?`,
        [prevChiefId, deptId],
        (cntErr, cntRows) => {
          const stillChiefElsewhere = cntRows && cntRows[0] && cntRows[0].cnt > 0;
          if (!stillChiefElsewhere) setLeaderChief(prevChiefId, false, setNewChief);
          else setNewChief();
        }
      );
    } else if (chief_id) {
      setLeaderChief(chief_id, true, done);
    } else {
      done();
    }
  };

  rollbookdb.query(
    `SELECT chief_id FROM departments WHERE id = ?`,
    [id],
    (selErr, selRows) => {
      const prevChiefId = selRows && selRows[0] ? selRows[0].chief_id : null;
      rollbookdb.query(
        `UPDATE departments SET name = ?, chief_name = ?, chief_id = ?, group_sort = ?, leader_sort = ?, student_sort = ? WHERE id = ?`,
        [name, chief_name || null, chief_id || null, gSort, lSort, sSort, id],
        (error, result) => {
          if (error && (error.code === 'ER_BAD_FIELD_ERROR' || (error.message && (error.message.includes('chief_id') || error.message.includes('group_sort') || error.message.includes('student_sort'))))) {
            rollbookdb.query(
              `UPDATE departments SET name = ?, chief_name = ? WHERE id = ?`,
              [name, chief_name || null, id],
              (e2, r2) => {
                if (e2) return res.status(500).json({ error: e2.message });
                if (r2.affectedRows === 0) return res.status(404).json({ error: '부서를 찾을 수 없습니다.' });
                afterDeptUpdate(prevChiefId);
              }
            );
            return;
          }
          if (error) return res.status(500).json({ error: error.message });
          if (result.affectedRows === 0) return res.status(404).json({ error: '부서를 찾을 수 없습니다.' });
          afterDeptUpdate(prevChiefId);
        }
      );
    }
  );
});

function setLeaderChief(leaderId, isChief, callback) {
  const sql = isChief
    ? `UPDATE leaders SET isChief = 1, is_approved = 1 WHERE id = ?`
    : `UPDATE leaders SET isChief = 0 WHERE id = ?`;
  rollbookdb.query(sql, [leaderId], (err) => {
    if (callback) callback();
  });
}

// 담당자 지정 시 해당 리더가 해당 부서에 없으면 새로 등록 (dept_id INT, 부서별 1행)
function addDeptToLeaderDeptId(leaderId, deptId, callback) {
  const deptIdNum = parseInt(deptId, 10);
  if (isNaN(deptIdNum)) return callback && callback();
  rollbookdb.query(
    `SELECT id, church_id, name, password, is_approved FROM leaders WHERE id = ?`,
    [leaderId],
    (selErr, selRows) => {
      if (selErr || !selRows || selRows.length === 0) return callback && callback();
      const src = selRows[0];
      rollbookdb.query(
        `SELECT id FROM leaders WHERE church_id = ? AND name = ? AND dept_id = ?`,
        [src.church_id, src.name, deptIdNum],
        (chkErr, chkRows) => {
          if (chkErr) return callback && callback();
          const existingForDept = chkRows && chkRows.length > 0 ? chkRows[0].id : null;
          const doUpdate = (targetLeaderId) => {
            rollbookdb.query(
              `UPDATE departments SET chief_id = ?, chief_name = ? WHERE id = ?`,
              [targetLeaderId, src.name, deptId],
              (upErr) => {
                if (callback) callback(targetLeaderId);
              }
            );
          };
          if (existingForDept) {
            setLeaderChief(existingForDept, true, () => doUpdate(existingForDept));
          } else {
            rollbookdb.query(
              `INSERT INTO leaders (group_id, dept_id, church_id, name, password, is_approved, isChief) VALUES (NULL, ?, ?, ?, ?, 1, 1)`,
              [deptIdNum, src.church_id, src.name, src.password],
              (insErr, insResult) => {
                if (insErr) return callback && callback();
                doUpdate(insResult.insertId);
              }
            );
          }
        }
      );
    }
  );
}

router.post('/deletedepartment', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });
  rollbookdb.query(`DELETE FROM departments WHERE id = ?`, [id], (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: '부서를 찾을 수 없습니다.' });
    res.json({ success: true, message: '부서가 삭제되었습니다.' });
  });
});

module.exports = router;
