const express = require('express');
const router = express.Router();
const cors = require('cors');
const { rollbookdb } = require('../dbdatas/rollbookdb');

router.use(express.json());
router.use(cors());

// 교회 단위 로그인 (church_id + dept_id + name + password)
// dept_id=0: 관리자 로그인 (authlevel 0 또는 1)
// 반환: leaderId, leaderName, deptIds, isChief, leaderIdByDept
router.post('/loginbychurch', (req, res) => {
  const { church_id, dept_id, name, password } = req.body;
  if (!church_id || dept_id === undefined || dept_id === null || !name || !password) return res.status(400).json({ error: 'church_id, dept_id, name, password가 필요합니다.' });
  const deptIdNum = parseInt(dept_id, 10);

  if (deptIdNum === 0) {
    rollbookdb.query(
      `SELECT l.id, l.name, l.dept_id, l.group_id, l.isChief, l.is_approved, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l
       WHERE l.church_id = ? AND l.name = ? AND l.password = ? AND COALESCE(l.authlevel, 5) IN (0, 1)
       LIMIT 1`,
      [church_id, name.trim(), password],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
          return res.status(401).json({ success: false, error: '이름 또는 비밀번호가 맞지 않습니다.' });
        }
        rollbookdb.query(`SELECT id FROM departments WHERE church_id = ? ORDER BY name ASC`, [church_id], (dErr, deptRows) => {
          if (dErr) return res.status(500).json({ error: dErr.message });
          const allDeptIds = (deptRows || []).map((r) => r.id);
          const first = rows[0];
          const al = first.authlevel != null ? Math.min(5, Math.max(0, parseInt(first.authlevel, 10))) : 5;
          const leaderIdByDept = {};
          const authLevelByDept = {};
          allDeptIds.forEach((did) => {
            leaderIdByDept[did] = first.id;
            authLevelByDept[did] = al;
          });
          res.json({
            success: true,
            leaderId: first.id,
            leaderName: first.name,
            deptIds: allDeptIds,
            isChief: false,
            leaderIdByDept,
            authLevelByDept,
            churchAuthLevel: al,
            isApproved: true,
          });
        });
      }
    );
    return;
  }

  if (isNaN(deptIdNum)) return res.status(400).json({ error: '유효한 부서를 선택해주세요.' });
  rollbookdb.query(
    `SELECT l.id, l.name, l.dept_id, l.group_id, l.isChief, l.is_approved, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l
     WHERE l.church_id = ? AND l.dept_id = ? AND l.name = ? AND l.password = ?`,
    [church_id, deptIdNum, name.trim(), password],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) {
        rollbookdb.query(
          `SELECT l.id, l.name, g.dept_id, l.group_id, l.isChief, l.is_approved, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l
           JOIN smallgroups g ON g.id = l.group_id
           JOIN departments d ON d.id = g.dept_id
           WHERE d.church_id = ? AND g.dept_id = ? AND l.name = ? AND l.password = ?`,
          [church_id, deptIdNum, name.trim(), password],
          (err2, rows2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            if (!rows2 || rows2.length === 0) {
              return res.status(401).json({ success: false, error: '부서, 이름 또는 비밀번호가 맞지 않습니다.' });
            }
            return sendChurchLoginResponse(res, rows2);
          }
        );
        return;
      }
      return sendChurchLoginResponse(res, rows);
    }
  );
});

function sendChurchLoginResponse(res, rows) {
  const arr = Array.isArray(rows) ? rows : [rows];
  const isApproved = arr.some((r) => r.is_approved === 1);
  const deptIds = [];
  const leaderIdByDept = {};
  const authLevelByDept = {};
  let isChief = false;
  let churchAuthLevel = 5;
  if (isApproved) {
    for (const r of arr) {
      const did = r.dept_id != null ? parseInt(r.dept_id, 10) : null;
      const al = r.authlevel != null ? parseInt(r.authlevel, 10) : 5;
      if (!isNaN(did) && did != null) {
        deptIds.push(did);
        leaderIdByDept[did] = r.id;
        authLevelByDept[did] = isNaN(al) ? 5 : Math.min(5, Math.max(0, al));
      }
      if (r.isChief === 1) isChief = true;
      if (!isNaN(al)) churchAuthLevel = Math.min(churchAuthLevel, Math.min(5, Math.max(0, al)));
    }
  }
  const uniqueDeptIds = [...new Set(deptIds)].sort((a, b) => a - b);
  const first = arr[0];
  res.json({
    success: true,
    leaderId: first.id,
    leaderName: first.name,
    deptIds: uniqueDeptIds,
    isChief,
    leaderIdByDept,
    authLevelByDept,
    churchAuthLevel,
    isApproved,
  });
}

// 리더 로그인 (deptId + name + password, 부서 페이지용)
// - 소그룹 소속 리더 (group_id → smallgroups)
// - 부서에 직접 등록된 리더 (dept_id: INT)
router.post('/loginbyname', (req, res) => {
  const { deptId, name, password } = req.body;
  if (!deptId || !name || !password) return res.status(400).json({ error: 'deptId, name, password가 필요합니다.' });
  rollbookdb.query(
    `(SELECT l.id, l.name, l.group_id, g.dept_id, l.isChief, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l
     JOIN smallgroups g ON g.id = l.group_id
     WHERE g.dept_id = ? AND l.name = ? AND l.password = ? AND l.is_approved = 1)
     UNION
     (SELECT l.id, l.name, l.group_id, l.dept_id, l.isChief, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l
     WHERE l.dept_id = ? AND l.name = ? AND l.password = ? AND l.is_approved = 1)`,
    [deptId, name, password, deptId, name, password],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) {
        return res.status(401).json({ success: false, error: '이름 또는 비밀번호가 맞지 않거나, 부서가 다르거나, 아직 승인되지 않았습니다.' });
      }
      const leader = rows[0];
      const deptIdVal = leader.dept_id != null ? leader.dept_id : deptId;
      const token = `leader_${leader.id}_${Date.now()}_${deptIdVal}`;
      const authlevel = leader.authlevel != null ? Math.min(5, Math.max(0, parseInt(leader.authlevel, 10))) : 5;
      res.json({ success: true, token, leaderId: leader.id, leaderName: leader.name, deptId: String(deptIdVal), isChief: leader.isChief === 1, authlevel });
    }
  );
});

// 부서별 리더 목록 (소그룹 담당자 선택용 - group 소속 + dept_id 직접 소속 모두 포함)
router.post('/getleadersbydept', (req, res) => {
  const { deptId } = req.body;
  if (!deptId) return res.status(400).json({ error: 'deptId가 필요합니다.' });
  rollbookdb.query(
    `SELECT DISTINCT l.id, l.name FROM leaders l
     LEFT JOIN smallgroups g ON g.id = l.group_id
     WHERE l.dept_id = ? OR g.dept_id = ?
     ORDER BY l.name ASC`,
    [deptId, deptId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, data: rows || [] });
    }
  );
});

// 부서별 교사 목록 (승인 상태, 담당 소그룹 포함, authlevel) - 교사 탭용
router.post('/getteachersbydept', (req, res) => {
  const { deptId } = req.body;
  if (!deptId) return res.status(400).json({ error: 'deptId가 필요합니다.' });
  rollbookdb.query(
    `SELECT l.id, l.name, l.is_approved, COALESCE(l.authlevel, 5) AS authlevel,
      COALESCE(g.group_name, g.leader_name) AS group_name
     FROM leaders l
     LEFT JOIN smallgroups g ON g.id = l.group_id AND g.dept_id = ?
     WHERE l.dept_id = ? OR g.dept_id = ?
     ORDER BY l.name ASC`,
    [deptId, deptId, deptId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const seen = new Set();
      const unique = (rows || []).filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      const data = unique.map((r) => ({
        id: r.id,
        name: r.name,
        is_approved: r.is_approved,
        authlevel: r.authlevel != null ? Math.min(5, Math.max(0, parseInt(r.authlevel, 10))) : 5,
        group_name: r.group_name || '-',
      }));
      res.json({ success: true, data });
    }
  );
});

// 교사 승인 (authlevel 2 부서관리자만 가능)
router.post('/approveleader', (req, res) => {
  const { leaderId, deptId, callerLeaderId } = req.body;
  if (!leaderId || !deptId || !callerLeaderId) return res.status(400).json({ error: 'leaderId, deptId, callerLeaderId가 필요합니다.' });
  rollbookdb.query(
    `SELECT l.id, l.isChief, COALESCE(l.authlevel, 5) AS authlevel FROM leaders l WHERE l.id = ? AND (l.dept_id = ? OR l.group_id IN (SELECT id FROM smallgroups WHERE dept_id = ?))`,
    [callerLeaderId, deptId, deptId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const caller = rows && rows[0];
      const callerAuth = caller && caller.authlevel != null ? parseInt(caller.authlevel, 10) : 5;
      if (!rows || rows.length === 0 || callerAuth !== 2) {
        return res.status(403).json({ success: false, error: '부서관리자만 승인할 수 있습니다.' });
      }
      rollbookdb.query(
        `UPDATE leaders SET is_approved = 1 WHERE id = ? AND (dept_id = ? OR group_id IN (SELECT id FROM smallgroups WHERE dept_id = ?))`,
        [leaderId, deptId, deptId],
        (upErr, result) => {
          if (upErr) return res.status(500).json({ error: upErr.message });
          if (result.affectedRows === 0) return res.status(404).json({ success: false, error: '해당 교사를 찾을 수 없습니다.' });
          res.json({ success: true, message: '승인되었습니다.' });
        }
      );
    }
  );
});

// 교회 소속 리더 전체 (부서관리 담당자 선택용, authlevel 포함)
router.post('/getleadersbychurch', (req, res) => {
  const { church_id } = req.body;
  if (!church_id) return res.status(400).json({ error: 'church_id가 필요합니다.' });
  rollbookdb.query(
    `SELECT id, name, COALESCE(authlevel, 5) AS authlevel FROM leaders WHERE church_id = ? ORDER BY name ASC`,
    [church_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const data = (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        authlevel: r.authlevel != null ? Math.min(5, Math.max(0, parseInt(r.authlevel, 10))) : 5,
      }));
      res.json({ success: true, data });
    }
  );
});

// authlevel 지정 (authlevel 0 전체관리자만 authlevel 1 지정 가능)
router.post('/setauthlevel', (req, res) => {
  const { church_id, leaderId, authlevel, callerLeaderId } = req.body;
  if (!church_id || !leaderId || authlevel === undefined || !callerLeaderId) {
    return res.status(400).json({ error: 'church_id, leaderId, authlevel, callerLeaderId가 필요합니다.' });
  }
  const targetLevel = parseInt(authlevel, 10);
  if (isNaN(targetLevel) || targetLevel < 0 || targetLevel > 5) {
    return res.status(400).json({ error: 'authlevel은 0~5 사이여야 합니다.' });
  }
  if (targetLevel !== 1) {
    return res.status(400).json({ error: '전체관리자만 authlevel 1(전체운영자)를 지정할 수 있습니다.' });
  }
  rollbookdb.query(
    `SELECT id, COALESCE(authlevel, 5) AS authlevel FROM leaders WHERE id = ? AND church_id = ?`,
    [callerLeaderId, church_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const caller = rows && rows[0];
      const callerAuth = caller && caller.authlevel != null ? parseInt(caller.authlevel, 10) : 5;
      if (!rows || rows.length === 0 || callerAuth !== 0) {
        return res.status(403).json({ success: false, error: '전체관리자만 운영자를 지정할 수 있습니다.' });
      }
      rollbookdb.query(
        `SELECT church_id, name FROM leaders WHERE id = ? AND church_id = ?`,
        [leaderId, church_id],
        (selErr, targetRows) => {
          if (selErr || !targetRows || targetRows.length === 0) {
            return res.status(404).json({ success: false, error: '해당 리더를 찾을 수 없습니다.' });
          }
          const { church_id: cid, name: targetName } = targetRows[0];
          rollbookdb.query(
            `UPDATE leaders SET authlevel = ? WHERE church_id = ? AND name = ?`,
            [targetLevel, cid, targetName],
            (upErr, result) => {
              if (upErr) return res.status(500).json({ error: upErr.message });
              if (result.affectedRows === 0) return res.status(404).json({ success: false, error: '해당 리더를 찾을 수 없습니다.' });
              res.json({ success: true, message: '권한이 지정되었습니다.' });
            }
          );
        }
      );
    }
  );
});

// 비밀번호 변경 (동일 church_id, name인 모든 부서 등록에 적용)
router.post('/changepassword', (req, res) => {
  const { leaderId, currentPassword, newPassword } = req.body;
  if (!leaderId || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'leaderId, 현재 비밀번호, 새 비밀번호가 필요합니다.' });
  }
  if (String(newPassword).length !== 4) {
    return res.status(400).json({ success: false, error: '새 비밀번호는 4자리로 입력해주세요.' });
  }
  rollbookdb.query(
    'SELECT id, church_id, name, password FROM leaders WHERE id = ?',
    [leaderId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: '리더를 찾을 수 없습니다.' });
      const leader = rows[0];
      if (leader.password !== currentPassword) {
        return res.status(401).json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' });
      }
      rollbookdb.query('UPDATE leaders SET password = ? WHERE church_id = ? AND name = ?', [newPassword, leader.church_id, leader.name], (upErr) => {
        if (upErr) return res.status(500).json({ success: false, error: upErr.message });
        res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
      });
    }
  );
});

// 교사/리더 탈퇴 (동일 church_id, name인 모든 부서 등록 삭제)
router.post('/withdraw', (req, res) => {
  const { leaderId, password } = req.body;
  if (!leaderId || !password) {
    return res.status(400).json({ success: false, error: 'leaderId, 비밀번호가 필요합니다.' });
  }
  rollbookdb.query(
    'SELECT id, church_id, name, password FROM leaders WHERE id = ?',
    [leaderId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: '리더를 찾을 수 없습니다.' });
      const leader = rows[0];
      if (leader.password !== password) {
        return res.status(401).json({ success: false, error: '비밀번호가 올바르지 않습니다.' });
      }
      rollbookdb.query('SELECT id FROM leaders WHERE church_id = ? AND name = ?', [leader.church_id, leader.name], (selErr, allRows) => {
        if (selErr || !allRows || allRows.length === 0) return res.status(500).json({ success: false, error: '처리 중 오류가 발생했습니다.' });
        const ids = allRows.map((r) => r.id);
        const placeholders = ids.map(() => '?').join(',');
        rollbookdb.query(`UPDATE smallgroups SET leader_id = NULL WHERE leader_id IN (${placeholders})`, ids, (sgErr) => {
          if (sgErr) return res.status(500).json({ success: false, error: sgErr.message });
          rollbookdb.query(`DELETE FROM leaders WHERE church_id = ? AND name = ?`, [leader.church_id, leader.name], (delErr) => {
            if (delErr) return res.status(500).json({ success: false, error: delErr.message });
            res.json({ success: true, message: '탈퇴가 완료되었습니다.' });
          });
        });
      });
    }
  );
});

// 리더/교사 등록 (dept_id: INT, 부서별로 각각 등록. dept_id=0: 관리자 등록)
router.post('/registerbychurch', (req, res) => {
  const { church_id, dept_id, name, password, authlevel: reqAuthlevel } = req.body;
  if (!church_id || dept_id === undefined || dept_id === null || !name || !password) {
    return res.status(400).json({ error: 'church_id, dept_id, name, password가 필요합니다.' });
  }
  if (String(password).length !== 4) {
    return res.status(400).json({ error: '비밀번호는 4자리로 입력해주세요.' });
  }
  const deptIdNum = parseInt(dept_id, 10);

  if (deptIdNum === 0) {
    rollbookdb.query(
      `SELECT id FROM leaders WHERE church_id = ? AND name = ? AND (dept_id = 0 OR dept_id IS NULL)`,
      [church_id, name.trim()],
      (selErr, selRows) => {
        if (selErr) return res.status(500).json({ error: selErr.message });
        if (selRows && selRows.length > 0) {
          return res.json({ success: true, message: '이미 관리자로 등록되어 있습니다.' });
        }
        const adminAuthlevel = (reqAuthlevel === 0 || reqAuthlevel === 1) ? parseInt(reqAuthlevel, 10) : 1;
        rollbookdb.query(
          `INSERT INTO leaders (group_id, dept_id, church_id, name, password, is_approved, isChief, authlevel) VALUES (NULL, 0, ?, ?, ?, 1, 0, ?)`,
          [church_id, name.trim(), password, adminAuthlevel],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: '관리자가 등록되었습니다. 바로 로그인 가능합니다.' });
          }
        );
      }
    );
    return;
  }

  if (isNaN(deptIdNum)) return res.status(400).json({ error: '유효한 부서를 선택해주세요.' });
  rollbookdb.query(
    `SELECT id FROM leaders WHERE church_id = ? AND name = ? AND dept_id = ?`,
    [church_id, name.trim(), deptIdNum],
    (selErr, selRows) => {
      if (selErr) return res.status(500).json({ error: selErr.message });
      if (selRows && selRows.length > 0) {
        return res.json({ success: true, message: '이미 해당 부서에 등록되어 있습니다.' });
      }
      rollbookdb.query(
        `INSERT INTO leaders (group_id, dept_id, church_id, name, password, is_approved, isChief, authlevel) VALUES (NULL, ?, ?, ?, ?, 0, 0, 5)`,
        [deptIdNum, church_id, name.trim(), password],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: '리더/교사가 등록되었습니다. 부서 담당자 승인 후 로그인 가능합니다.' });
        }
      );
    }
  );
});

module.exports = router;