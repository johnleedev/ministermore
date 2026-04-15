const express = require('express');
const router = express.Router();
const cors = require('cors');
const { rollbookdb } = require('../dbdatas/rollbookdb');

router.use(express.json());
router.use(cors());

// smallgroups: church_id, dept_id, group_name, leader_name, leader_id
router.post('/getgrouplist', (req, res) => {
  const { deptId, departmentId } = req.body;
  const dept = deptId || departmentId;
  if (!dept) return res.status(400).json({ error: 'deptId가 필요합니다.' });
  rollbookdb.query(
    `SELECT id, dept_id, church_id, group_name, leader_name, leader_id FROM smallgroups WHERE dept_id = ? ORDER BY COALESCE(group_name, leader_name) ASC`,
    [dept],
    (error, result) => {
      if (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes('group_name'))) {
        rollbookdb.query(
          `SELECT id, dept_id, church_id, leader_name, leader_id FROM smallgroups WHERE dept_id = ? ORDER BY leader_name ASC`,
          [dept],
          (err2, result2) => {
            if (err2) return res.status(500).json({ error: err2.message });
      const data = (result2 || []).map((r) => ({
        id: r.id,
        church_id: r.church_id,
        dept_id: r.dept_id,
        name: r.leader_name || '',
        teacher: r.leader_name || '',
        leader_id: r.leader_id,
      }));
            return res.json(data);
          }
        );
        return;
      }
      if (error) return res.status(500).json({ error: error.message });
      const data = (result || []).map((r) => ({
        id: r.id,
        church_id: r.church_id,
        dept_id: r.dept_id,
        name: r.group_name || r.leader_name || '',
        teacher: r.leader_name || '',
        leader_id: r.leader_id,
      }));
      res.json(data);
    }
  );
});

router.post('/addgroup', (req, res) => {
  const { churchId, church_id, deptId, name } = req.body;
  const church = churchId || church_id;
  if (!deptId || !name) return res.status(400).json({ error: 'deptId, name이 필요합니다.' });
  const leaderName = req.body.leader_name || req.body.teacher_name || req.body.teacherName || '';
  const leaderId = req.body.leader_id || req.body.teacher_id || null;

  rollbookdb.query(
    `SELECT church_id FROM departments WHERE id = ?`,
    [deptId],
    (deptErr, deptRows) => {
      if (deptErr) return res.status(500).json({ error: deptErr.message });
      const row = deptRows && deptRows[0];
      const churchIdVal = church || (row ? row.church_id : null);
      if (!churchIdVal) return res.status(400).json({ error: 'church_id를 확인할 수 없습니다.' });

      const checkDup = () => {
        rollbookdb.query(
          `SELECT id FROM smallgroups WHERE dept_id = ? AND LOWER(group_name) = LOWER(?)`,
          [deptId, name],
          (checkErr, checkRows) => {
            if (checkErr && (checkErr.code === 'ER_BAD_FIELD_ERROR' || checkErr.message?.includes('group_name'))) {
              doInsert();
              return;
            }
            if (checkErr) return res.status(500).json({ error: checkErr.message });
            if (checkRows && checkRows.length > 0) return res.status(400).json({ error: '이미 등록된 소그룹명입니다.' });
            doInsert();
          }
        );
      };

      const doInsert = () => {
        rollbookdb.query(
          `INSERT INTO smallgroups (church_id, dept_id, group_name, leader_name, leader_id) VALUES (?, ?, ?, ?, ?)`,
          [churchIdVal, deptId, name, leaderName, leaderId],
          (insertErr, insertResult) => {
            if (insertErr && (insertErr.code === 'ER_BAD_FIELD_ERROR' || insertErr.message?.includes('group_name'))) {
              rollbookdb.query(
                `INSERT INTO smallgroups (church_id, dept_id, leader_name, leader_id) VALUES (?, ?, ?, ?)`,
                [churchIdVal, deptId, leaderName, leaderId],
                (e2, r2) => {
                  if (e2) return res.status(500).json({ error: e2.message });
                  res.json({ success: true, message: '소그룹이 추가되었습니다.', data: { id: r2.insertId } });
                }
              );
              return;
            }
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.json({ success: true, message: '소그룹이 추가되었습니다.', data: { id: insertResult.insertId } });
          }
        );
      };

      checkDup();
    }
  );
});

router.post('/updategroup', (req, res) => {
  const { id, name, leader_name, leader_id, teacher_name, teacherName } = req.body;
  if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });
  const leader = leader_name ?? teacher_name ?? teacherName ?? '';
  const leaderIdVal = leader_id ?? req.body.teacher_id ?? null;

  const doUpdate = (sql, params) => {
    rollbookdb.query(sql, params, (error, result) => {
      if (error) return res.status(500).json({ error: error.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: '소그룹을 찾을 수 없습니다.' });
      res.json({ success: true, message: '소그룹이 수정되었습니다.' });
    });
  };

  if (name) {
    rollbookdb.query(
      `UPDATE smallgroups SET leader_name = ?, leader_id = ?, group_name = ? WHERE id = ?`,
      [leader, leaderIdVal, name, id],
      (error, result) => {
        if (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes('group_name'))) {
          doUpdate(`UPDATE smallgroups SET leader_name = ?, leader_id = ? WHERE id = ?`, [leader, leaderIdVal, id]);
          return;
        }
        if (error) return res.status(500).json({ error: error.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: '소그룹을 찾을 수 없습니다.' });
        res.json({ success: true, message: '소그룹이 수정되었습니다.' });
      }
    );
  } else {
    doUpdate(`UPDATE smallgroups SET leader_name = ?, leader_id = ? WHERE id = ?`, [leader, leaderIdVal, id]);
  }
});

router.post('/deletegroup', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });
  rollbookdb.query(`DELETE FROM smallgroups WHERE id = ?`, [id], (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: '소그룹을 찾을 수 없습니다.' });
    res.json({ success: true, message: '소그룹이 삭제되었습니다.' });
  });
});

module.exports = router;
