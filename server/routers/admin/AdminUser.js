const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const argon2 = require('argon2');
const { admindb } = require('../dbdatas/admindb');
const { commondb } = require('../dbdatas/commondb');
const { canonicalAdminStatusFromDb } = require('./adminUserStatus');

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const ALLOWED_GRADES = new Set(['일반회원', '정회원']);

/** adminusers.role: admin=최종관리자, employee=일반 관리자 */
const ROLE_SUPER = 'admin';
const ROLE_EMPLOYEE = 'employee';

const CANONICAL_STATUS_PENDING = 'pending';
const CANONICAL_STATUS_ACTIVE = 'active';
const CANONICAL_STATUS_REJECTED = 'rejected';

let cachedAdminEnums = null;

const ORDER_COLUMN_CANDIDATES = [
  'createdAt',
  'created_at',
  'joinDate',
  'registerDate',
  'signUpDate',
  'date',
  'id',
];

let cachedListOrderBy = null;

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function queryAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function executeAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

const queryAdmin = (sql, params) => queryAsync(admindb, sql, params);
const executeAdmin = (sql, params) => executeAsync(admindb, sql, params);
const queryCommon = (sql, params) => queryAsync(commondb, sql, params);
const executeCommon = (sql, params) => executeAsync(commondb, sql, params);

function parseMysqlEnum(typeStr) {
  if (!typeStr) return null;
  const match = String(typeStr).match(/^enum\((.*)\)$/i);
  if (!match) return null;
  return match[1].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
}

function pickEnumValue(values, patterns, fallback) {
  if (!values?.length) return fallback;
  for (const pattern of patterns) {
    const found = values.find((v) => pattern.test(v));
    if (found) return found;
  }
  return fallback;
}

/** ENUM 정의에서 DB에 넣을 status 문자열 결정 (active가 첫 번째일 때 pending=active 오인 방지) */
function resolveAdminStatusEnums(statusValues) {
  if (!statusValues?.length) {
    return {
      statusPending: CANONICAL_STATUS_PENDING,
      statusActive: CANONICAL_STATUS_ACTIVE,
      statusRejected: CANONICAL_STATUS_REJECTED,
    };
  }

  const byLower = new Map(statusValues.map((v) => [String(v).toLowerCase(), v]));

  let statusPending =
    byLower.get('pending') ||
    pickEnumValue(
      statusValues,
      [/pending/i, /대기/, /waiting/i],
      null
    );
  let statusActive =
    byLower.get('active') ||
    pickEnumValue(statusValues, [/^active$/i, /approved/i, /활성/, /승인\s*완료/, /승인완료/], null) ||
    statusValues.find((v) => /승인/i.test(v) && !/대기|pending|waiting/i.test(v));
  let statusRejected =
    byLower.get('rejected') ||
    pickEnumValue(statusValues, [/reject/i, /거절/, /denied/i], null);

  if (!statusPending) {
    statusPending =
      statusValues.find((v) => v !== statusActive && v !== statusRejected) || statusValues[0];
  }
  if (!statusActive) {
    statusActive =
      statusValues.find((v) => v !== statusPending && v !== statusRejected) ||
      statusValues[1] ||
      statusValues[0];
  }
  if (!statusRejected) {
    statusRejected =
      statusValues.find((v) => v !== statusPending && v !== statusActive) || statusPending;
  }

  // ENUM('active','pending',...) 순서일 때 pending이 active로 잡히는 경우 복구
  if (statusPending === statusActive) {
    if (byLower.get('pending') && byLower.get('active')) {
      statusPending = byLower.get('pending');
      statusActive = byLower.get('active');
    } else {
      statusActive = statusValues.find((v) => v !== statusPending) || statusActive;
    }
  }

  return { statusPending, statusActive, statusRejected };
}

/** adminusers.status 실제 DB ENUM 값 (SHOW COLUMNS 1회 캐시) */
async function loadAdminEnums() {
  if (cachedAdminEnums) return cachedAdminEnums;

  const cols = await queryAdmin('SHOW COLUMNS FROM adminusers');
  const statusCol = cols.find((c) => c.Field === 'status');

  const statusValues = parseMysqlEnum(statusCol?.Type);
  const { statusPending, statusActive, statusRejected } = resolveAdminStatusEnums(statusValues);

  cachedAdminEnums = {
    roleSuper: ROLE_SUPER,
    roleEmployee: ROLE_EMPLOYEE,
    statusPending,
    statusActive,
    statusRejected,
    statusValues: statusValues || [statusPending, statusActive, statusRejected],
  };

  return cachedAdminEnums;
}

function statusToCanonical(dbStatus, enums) {
  return canonicalAdminStatusFromDb(dbStatus);
}

function safeEqualString(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifyAdminPassword(storedPassword, inputPassword) {
  if (!storedPassword || inputPassword == null) return false;
  const stored = String(storedPassword);
  if (stored.startsWith('$argon2')) {
    try {
      return await argon2.verify(stored, inputPassword);
    } catch {
      return false;
    }
  }
  return safeEqualString(stored, inputPassword);
}

function toPublicAdmin(row, enums) {
  if (!row) return null;
  const statusDb = row.status != null ? String(row.status).trim() : '';
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    department: row.department,
    position: row.position,
    role: row.role,
    statusDb,
    status: canonicalAdminStatusFromDb(statusDb),
  };
}

async function getAdminById(id) {
  const rows = await queryAdmin(
    `SELECT id, email, password, name, department, position, role, status
       FROM adminusers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getAdminByEmail(email) {
  const rows = await queryAdmin(
    `SELECT id, email, password, name, department, position, role, status
       FROM adminusers WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function requireSuperAdmin(requesterId) {
  const enums = await loadAdminEnums();
  const admin = await getAdminById(requesterId);
  const statusCanon = statusToCanonical(admin?.status, enums);
  if (!admin || statusCanon !== CANONICAL_STATUS_ACTIVE || admin.role !== enums.roleSuper) {
    return { ok: false, admin: null };
  }
  return { ok: true, admin, enums };
}

async function getUserListOrderBy() {
  if (cachedListOrderBy) return cachedListOrderBy;

  const columns = await queryCommon('SHOW COLUMNS FROM `user`');
  const fields = columns.map((c) => ({
    name: c.Field,
    extra: String(c.Extra || ''),
  }));
  const has = (name) => fields.some((f) => f.name === name);

  const dateCol = ORDER_COLUMN_CANDIDATES.find((name) => name !== 'id' && has(name));
  if (dateCol) {
    cachedListOrderBy = `\`${dateCol}\` DESC`;
    return cachedListOrderBy;
  }
  if (has('id')) {
    cachedListOrderBy = '`id` DESC';
    return cachedListOrderBy;
  }
  const autoInc = fields.find((f) => f.extra.toLowerCase().includes('auto_increment'));
  if (autoInc) {
    cachedListOrderBy = `\`${autoInc.name}\` DESC`;
    return cachedListOrderBy;
  }
  cachedListOrderBy = '`userAccount` DESC';
  return cachedListOrderBy;
}

/** POST /adminuser/register — 관리자 가입 (승인 전 pending) */
router.post('/register', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    const name = String(req.body?.name ?? '').trim();
    const department = req.body?.department != null ? String(req.body.department).trim() : null;
    const position = req.body?.position != null ? String(req.body.position).trim() : null;

    if (!email || !password || !name) {
      return res.status(400).json({ ok: false, message: 'email, password, name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'password must be at least 6 characters' });
    }

    const existing = await getAdminByEmail(email);
    if (existing) {
      return res.status(409).json({ ok: false, message: '이미 등록된 아이디(이메일)입니다.' });
    }

    const enums = await loadAdminEnums();
    const superCountRows = await queryAdmin(
      'SELECT COUNT(*) AS cnt FROM adminusers WHERE role = ?',
      [ROLE_SUPER]
    );
    const isFirstSuper = Number(superCountRows[0]?.cnt ?? 0) === 0;

    const roleDb = isFirstSuper ? enums.roleSuper : enums.roleEmployee;
    const statusDb = isFirstSuper ? enums.statusActive : enums.statusPending;
    const hashedPassword = await argon2.hash(password);

    const result = await executeAdmin(
      `INSERT INTO adminusers (email, password, name, department, position, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, department || null, position || null, roleDb, statusDb]
    );

    const created = await getAdminById(result.insertId);

    if (isFirstSuper) {
      return res.status(201).json({
        ok: true,
        message: '최초 관리자로 등록되었습니다. 바로 로그인할 수 있습니다.',
        admin: toPublicAdmin(created, enums),
        isFirstSuper: true,
      });
    }

    return res.status(201).json({
      ok: true,
      message: '가입 신청이 완료되었습니다. 최종관리자 승인 후 로그인할 수 있습니다.',
      admin: toPublicAdmin(created, enums),
      isFirstSuper: false,
    });
  } catch (error) {
    console.error('adminuser /register error:', error);
    if (error?.code === 'WARN_DATA_TRUNCATED' || error?.errno === 1265) {
      return res.status(500).json({
        ok: false,
        message:
          'adminusers.role 또는 status 컬럼 ENUM 값이 맞지 않습니다. role은 admin, employee 여야 합니다.',
      });
    }
    return res.status(500).json({ ok: false, message: '가입 처리 중 오류가 발생했습니다.' });
  }
});

/** POST /adminuser/login */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? req.body?.user ?? '').trim();
    const password = String(req.body?.password ?? req.body?.passwd ?? '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'email and password are required' });
    }

    const enums = await loadAdminEnums();
    const admin = await getAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const valid = await verifyAdminPassword(admin.password, password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const statusCanon = statusToCanonical(admin.status, enums);

    // 최종관리자(admin)는 pending 이어도 로그인 허용·자동 활성화 (DB 불일치 복구)
    if (admin.role === enums.roleSuper && statusCanon === CANONICAL_STATUS_PENDING) {
      await executeAdmin('UPDATE adminusers SET status = ? WHERE id = ?', [
        enums.statusActive,
        admin.id,
      ]);
      admin.status = enums.statusActive;
    }

    // 최종관리자가 한 명도 없으면 승인 대기 계정을 최초 최종관리자로 승격
    if (
      admin.role !== enums.roleSuper &&
      statusToCanonical(admin.status, enums) === CANONICAL_STATUS_PENDING
    ) {
      const superCountRows = await queryAdmin(
        'SELECT COUNT(*) AS cnt FROM adminusers WHERE role = ?',
        [ROLE_SUPER]
      );
      if (Number(superCountRows[0]?.cnt ?? 0) === 0) {
        await executeAdmin(
          'UPDATE adminusers SET role = ?, status = ? WHERE id = ?',
          [enums.roleSuper, enums.statusActive, admin.id]
        );
        admin.role = enums.roleSuper;
        admin.status = enums.statusActive;
      }
    }

    const loginStatus = statusToCanonical(admin.status, enums);

    if (admin.role !== enums.roleSuper && loginStatus === CANONICAL_STATUS_PENDING) {
      return res.status(403).json({
        ok: false,
        code: 'PENDING_APPROVAL',
        message: '최종관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.',
      });
    }
    if (loginStatus === CANONICAL_STATUS_REJECTED) {
      return res.status(403).json({
        ok: false,
        code: 'REJECTED',
        message: '가입이 거절되었습니다. 최종관리자에게 문의해 주세요.',
      });
    }
    if (loginStatus !== CANONICAL_STATUS_ACTIVE) {
      return res.status(403).json({
        ok: false,
        message: '로그인할 수 없는 계정 상태입니다.',
      });
    }

    return res.status(200).json({
      ok: true,
      admin: toPublicAdmin(admin, enums),
    });
  } catch (error) {
    console.error('adminuser /login error:', error);
    return res.status(500).json({ ok: false, message: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

/** GET /adminuser/admins — adminusers 목록 (최종관리자 전용) */
router.get('/admins', async (req, res) => {
  try {
    const requesterId = parsePositiveInt(req.query.requesterId);
    if (!requesterId) {
      return res.status(400).json({ ok: false, message: 'requesterId is required' });
    }

    const auth = await requireSuperAdmin(requesterId);
    if (!auth.ok) {
      return res.status(403).json({ ok: false, message: '최종관리자만 조회할 수 있습니다.' });
    }

    const enums = auth.enums;
    const statusFilter = String(req.query.status || '').trim();
    const where = [];
    const params = [];
    if (statusFilter) {
      const statusDb =
        statusFilter === CANONICAL_STATUS_PENDING
          ? enums.statusPending
          : statusFilter === CANONICAL_STATUS_ACTIVE
            ? enums.statusActive
            : statusFilter === CANONICAL_STATUS_REJECTED
              ? enums.statusRejected
              : statusFilter;
      where.push('status = ?');
      params.push(statusDb);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAdmin(
      `SELECT id, email, name, department, position, role, status
         FROM adminusers
         ${whereSql}
         ORDER BY id DESC`,
      params
    );

    return res.status(200).json({
      ok: true,
      data: rows.map((row) => toPublicAdmin(row, enums)),
    });
  } catch (error) {
    console.error('adminuser /admins error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch admin users' });
  }
});

/** POST /adminuser/approve — 가입 승인 */
router.post('/approve', async (req, res) => {
  try {
    const requesterId = parsePositiveInt(req.body?.requesterId);
    const targetId = parsePositiveInt(req.body?.targetId);

    if (!requesterId || !targetId) {
      return res.status(400).json({ ok: false, message: 'requesterId and targetId are required' });
    }

    const auth = await requireSuperAdmin(requesterId);
    if (!auth.ok) {
      return res.status(403).json({ ok: false, message: '최종관리자만 승인할 수 있습니다.' });
    }

    const enums = auth.enums;
    const result = await executeAdmin(
      `UPDATE adminusers SET status = ? WHERE id = ? AND status = ?`,
      [enums.statusActive, targetId, enums.statusPending]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: '승인 대기 중인 계정을 찾을 수 없습니다.' });
    }

    const updated = await getAdminById(targetId);
    return res.status(200).json({ ok: true, data: toPublicAdmin(updated, enums) });
  } catch (error) {
    console.error('adminuser /approve error:', error);
    return res.status(500).json({ ok: false, message: '승인 처리 중 오류가 발생했습니다.' });
  }
});

/** POST /adminuser/reject — 가입 거절 */
router.post('/reject', async (req, res) => {
  try {
    const requesterId = parsePositiveInt(req.body?.requesterId);
    const targetId = parsePositiveInt(req.body?.targetId);

    if (!requesterId || !targetId) {
      return res.status(400).json({ ok: false, message: 'requesterId and targetId are required' });
    }

    const auth = await requireSuperAdmin(requesterId);
    if (!auth.ok) {
      return res.status(403).json({ ok: false, message: '최종관리자만 거절할 수 있습니다.' });
    }

    const enums = auth.enums;
    const target = await getAdminById(targetId);
    if (!target) {
      return res.status(404).json({ ok: false, message: '계정을 찾을 수 없습니다.' });
    }
    if (target.role === enums.roleSuper) {
      return res.status(400).json({ ok: false, message: '최종관리자 계정은 거절할 수 없습니다.' });
    }

    const result = await executeAdmin(
      `UPDATE adminusers SET status = ? WHERE id = ? AND status = ?`,
      [enums.statusRejected, targetId, enums.statusPending]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: '승인 대기 중인 계정을 찾을 수 없습니다.' });
    }

    const updated = await getAdminById(targetId);
    return res.status(200).json({ ok: true, data: toPublicAdmin(updated, enums) });
  } catch (error) {
    console.error('adminuser /reject error:', error);
    return res.status(500).json({ ok: false, message: '거절 처리 중 오류가 발생했습니다.' });
  }
});

/** POST /adminuser/set-super — 최종관리자 지정 (1명) */
router.post('/set-super', async (req, res) => {
  try {
    const requesterId = parsePositiveInt(req.body?.requesterId);
    const targetId = parsePositiveInt(req.body?.targetId);

    if (!requesterId || !targetId) {
      return res.status(400).json({ ok: false, message: 'requesterId and targetId are required' });
    }

    const auth = await requireSuperAdmin(requesterId);
    if (!auth.ok) {
      return res.status(403).json({ ok: false, message: '최종관리자만 지정할 수 있습니다.' });
    }

    const enums = auth.enums;
    const target = await getAdminById(targetId);
    if (!target || target.status !== enums.statusActive) {
      return res.status(400).json({ ok: false, message: '승인된(active) 관리자만 최종관리자로 지정할 수 있습니다.' });
    }

    await executeAdmin(`UPDATE adminusers SET role = ? WHERE role = ?`, [enums.roleEmployee, enums.roleSuper]);
    await executeAdmin(`UPDATE adminusers SET role = ? WHERE id = ?`, [enums.roleSuper, targetId]);

    const updated = await getAdminById(targetId);
    return res.status(200).json({
      ok: true,
      message: '최종관리자가 변경되었습니다. 본인이 이전 최종관리자였다면 일반 관리자 권한만 유지됩니다.',
      data: toPublicAdmin(updated, enums),
    });
  } catch (error) {
    console.error('adminuser /set-super error:', error);
    return res.status(500).json({ ok: false, message: '최종관리자 지정 중 오류가 발생했습니다.' });
  }
});

/** GET /adminuser/list — 사이트 회원(common.user) 목록 */
router.get('/list', async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit);
    const rawOffset = Number(req.query.offset);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 200;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const q = String(req.query.q || '').trim();
    const grade = String(req.query.grade || '').trim();

    const where = [];
    const params = [];

    if (q) {
      where.push('(userAccount LIKE ? OR userNickName LIKE ? OR userChurch LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (grade) {
      where.push('grade = ?');
      params.push(grade);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderBy = await getUserListOrderBy();

    const [rows, countRows] = await Promise.all([
      queryCommon(
        `SELECT userAccount, userNickName, userChurch, userSort, userDetail, userURL, grade, isPosting
           FROM user
           ${whereSql}
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      queryCommon(`SELECT COUNT(*) AS total FROM user ${whereSql}`, params),
    ]);

    return res.status(200).json({
      ok: true,
      rows,
      total: countRows[0]?.total ?? 0,
    });
  } catch (error) {
    console.error('adminuser /list error:', error);
    return res.status(500).json({ ok: false, message: 'failed to fetch user list' });
  }
});

/** POST /adminuser/grade — 사이트 회원 등급 변경 */
router.post('/grade', async (req, res) => {
  try {
    const userAccount = String(req.body?.userAccount || '').trim();
    const grade = String(req.body?.grade || '').trim();

    if (!userAccount) {
      return res.status(400).json({ ok: false, message: 'userAccount is required' });
    }
    if (!ALLOWED_GRADES.has(grade)) {
      return res.status(400).json({
        ok: false,
        message: `grade must be one of: ${[...ALLOWED_GRADES].join(', ')}`,
      });
    }

    const result = await executeCommon('UPDATE user SET grade = ? WHERE userAccount = ?', [
      grade,
      userAccount,
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: 'user not found' });
    }

    return res.status(200).json({ ok: true, userAccount, grade });
  } catch (error) {
    console.error('adminuser /grade error:', error);
    return res.status(500).json({ ok: false, message: 'failed to update grade' });
  }
});

module.exports = router;
