/**
 * 직원 출퇴근 API (mysql2/promise, async/await)
 *
 * POST /api/attendance/clock-in
 * POST /api/attendance/clock-out
 * GET  /api/attendance/today-status
 * GET  /api/admin/attendance?date=YYYY-MM-DD&requesterId=
 * POST /api/admin/attendance/revert-clock-out — 최종관리자, 퇴근 시각 되돌리기
 */
const express = require('express');
const cors = require('cors');
const { admindb } = require('../dbdatas/admindb');
const { isActiveAdminStatus } = require('./adminUserStatus');

const employeeRouter = express.Router();
const adminRouter = express.Router();

const ROLE_SUPER = 'admin';

let ensuredAttendanceTable = false;

employeeRouter.use(cors());
employeeRouter.use(express.json());
adminRouter.use(cors());
adminRouter.use(express.json());

function sendError(res, status, code, message) {
  return res.status(status).json({
    ok: false,
    error: { code, message },
  });
}

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseRequesterId(req) {
  return parsePositiveInt(req.query.requesterId ?? req.body?.requesterId);
}

function normalizeDateOnly(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return s;
}

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatAttendanceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    workDate: row.work_date,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    name: row.name ?? undefined,
    department: row.department ?? undefined,
    position: row.position ?? undefined,
  };
}

async function ensureAdminAttendanceTable() {
  if (ensuredAttendanceTable) return;
  await admindb.query(`
    CREATE TABLE IF NOT EXISTS admin_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      work_date DATE NOT NULL,
      clock_in DATETIME NOT NULL,
      clock_out DATETIME NULL,
      UNIQUE KEY uk_user_work_date (user_id, work_date),
      KEY idx_work_date (work_date),
      CONSTRAINT fk_admin_attendance_user
        FOREIGN KEY (user_id) REFERENCES adminusers(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  ensuredAttendanceTable = true;
}

async function getAdminById(id) {
  const [rows] = await admindb.query(
    `SELECT id, name, department, position, role, status
       FROM adminusers WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function resolveRequester(req, res) {
  const requesterId = parseRequesterId(req);
  if (!requesterId) {
    sendError(res, 400, 'VALIDATION_ERROR', 'requesterId is required');
    return null;
  }

  const admin = await getAdminById(requesterId);
  if (!admin || !isActiveAdminStatus(admin.status)) {
    sendError(res, 403, 'FORBIDDEN', '로그인 정보가 유효하지 않습니다.');
    return null;
  }

  return {
    requesterId,
    isSuper: admin.role === ROLE_SUPER,
    admin,
  };
}

async function getTodayAttendance(userId) {
  const [rows] = await admindb.query(
    `SELECT id, user_id, work_date, clock_in, clock_out
       FROM admin_attendance
      WHERE user_id = ? AND work_date = CURDATE()
      LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

/** POST /api/attendance/clock-in */
employeeRouter.post('/clock-in', async (req, res) => {
  try {
    await ensureAdminAttendanceTable();
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const existing = await getTodayAttendance(ctx.requesterId);
    if (existing) {
      return sendError(res, 409, 'ALREADY_CLOCKED_IN', '오늘은 이미 출근 처리되었습니다.');
    }

    const [result] = await admindb.query(
      `INSERT INTO admin_attendance (user_id, work_date, clock_in)
       VALUES (?, CURDATE(), NOW())`,
      [ctx.requesterId],
    );

    const [rows] = await admindb.query(
      `SELECT id, user_id, work_date, clock_in, clock_out
         FROM admin_attendance WHERE id = ? LIMIT 1`,
      [result.insertId],
    );

    return res.status(201).json({
      ok: true,
      data: formatAttendanceRow(rows[0]),
    });
  } catch (err) {
    console.error('POST /api/attendance/clock-in', err);
    return sendError(res, 500, 'INTERNAL_ERROR', '출근 등록 중 오류가 발생했습니다.');
  }
});

/** POST /api/attendance/clock-out */
employeeRouter.post('/clock-out', async (req, res) => {
  try {
    await ensureAdminAttendanceTable();
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const today = await getTodayAttendance(ctx.requesterId);
    if (!today) {
      return sendError(res, 404, 'NOT_CLOCKED_IN', '오늘 출근 기록이 없습니다. 먼저 출근해 주세요.');
    }
    if (today.clock_out != null) {
      return sendError(res, 409, 'ALREADY_CLOCKED_OUT', '오늘은 이미 퇴근 처리되었습니다.');
    }

    await admindb.query(
      `UPDATE admin_attendance
          SET clock_out = NOW()
        WHERE id = ? AND user_id = ? AND work_date = CURDATE()`,
      [today.id, ctx.requesterId],
    );

    const [rows] = await admindb.query(
      `SELECT id, user_id, work_date, clock_in, clock_out
         FROM admin_attendance WHERE id = ? LIMIT 1`,
      [today.id],
    );

    return res.json({
      ok: true,
      data: formatAttendanceRow(rows[0]),
    });
  } catch (err) {
    console.error('POST /api/attendance/clock-out', err);
    return sendError(res, 500, 'INTERNAL_ERROR', '퇴근 등록 중 오류가 발생했습니다.');
  }
});

/** GET /api/attendance/today-status */
employeeRouter.get('/today-status', async (req, res) => {
  try {
    await ensureAdminAttendanceTable();
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const today = await getTodayAttendance(ctx.requesterId);
    const hasClockIn = Boolean(today);
    const hasClockOut = Boolean(today?.clock_out);

    return res.json({
      ok: true,
      data: {
        workDate: todayDateString(),
        hasClockIn,
        hasClockOut,
        canClockIn: !hasClockIn,
        canClockOut: hasClockIn && !hasClockOut,
        record: formatAttendanceRow(today),
      },
    });
  } catch (err) {
    console.error('GET /api/attendance/today-status', err);
    return sendError(res, 500, 'INTERNAL_ERROR', '출퇴근 상태 조회 중 오류가 발생했습니다.');
  }
});

/** GET /api/admin/attendance — 최종관리자 전 직원 현황 */
adminRouter.get('/attendance', async (req, res) => {
  try {
    await ensureAdminAttendanceTable();
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    if (!ctx.isSuper) {
      return sendError(res, 403, 'FORBIDDEN', '전 직원 출퇴근 조회는 최종관리자만 가능합니다.');
    }

    const dateParam = req.query.date;
    const workDate =
      dateParam != null && String(dateParam).trim() !== ''
        ? normalizeDateOnly(dateParam)
        : todayDateString();

    if (workDate === undefined) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'date는 YYYY-MM-DD 형식이어야 합니다.');
    }

    const [rows] = await admindb.query(
      `SELECT
          a.id,
          a.user_id,
          a.work_date,
          a.clock_in,
          a.clock_out,
          u.name,
          u.department,
          u.position
         FROM admin_attendance a
         INNER JOIN adminusers u ON a.user_id = u.id
        WHERE a.work_date = ?
        ORDER BY a.clock_in ASC, u.name ASC`,
      [workDate],
    );

    return res.json({
      ok: true,
      data: {
        workDate,
        items: rows.map((row) => formatAttendanceRow(row)),
        total: rows.length,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/attendance', err);
    return sendError(res, 500, 'INTERNAL_ERROR', '출퇴근 현황 조회 중 오류가 발생했습니다.');
  }
});

/** POST /api/admin/attendance/revert-clock-out — 퇴근 잘못 입력 시 clock_out 제거 */
adminRouter.post('/attendance/revert-clock-out', async (req, res) => {
  try {
    await ensureAdminAttendanceTable();
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    if (!ctx.isSuper) {
      return sendError(res, 403, 'FORBIDDEN', '퇴근 되돌리기는 최종관리자만 가능합니다.');
    }

    const attendanceId = parsePositiveInt(req.body?.attendanceId);
    if (!attendanceId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'attendanceId가 필요합니다.');
    }

    const [existingRows] = await admindb.query(
      `SELECT id, user_id, work_date, clock_in, clock_out
         FROM admin_attendance WHERE id = ? LIMIT 1`,
      [attendanceId],
    );
    const existing = existingRows[0];
    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', '출퇴근 기록을 찾을 수 없습니다.');
    }
    if (existing.clock_out == null) {
      return sendError(res, 400, 'NOT_CLOCKED_OUT', '퇴근 처리된 기록이 없습니다.');
    }

    await admindb.query(
      `UPDATE admin_attendance SET clock_out = NULL WHERE id = ?`,
      [attendanceId],
    );

    const [rows] = await admindb.query(
      `SELECT
          a.id,
          a.user_id,
          a.work_date,
          a.clock_in,
          a.clock_out,
          u.name,
          u.department,
          u.position
         FROM admin_attendance a
         INNER JOIN adminusers u ON a.user_id = u.id
        WHERE a.id = ?
        LIMIT 1`,
      [attendanceId],
    );

    return res.json({
      ok: true,
      data: formatAttendanceRow(rows[0]),
    });
  } catch (err) {
    console.error('POST /api/admin/attendance/revert-clock-out', err);
    return sendError(res, 500, 'INTERNAL_ERROR', '퇴근 되돌리기 중 오류가 발생했습니다.');
  }
});

module.exports = {
  employeeRouter,
  adminRouter,
};
