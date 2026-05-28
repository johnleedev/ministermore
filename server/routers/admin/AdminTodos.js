const express = require('express');
const cors = require('cors');
const { admindb } = require('../dbdatas/admindb');
const { isActiveAdminStatus } = require('./adminUserStatus');

const router = express.Router();

/** adminusers.role: admin=최종관리자(대표), employee=일반 관리자 */
const ROLE_SUPER = 'admin';

/** mysql2/promise 풀 — 콜백 래퍼(createDbPool)로 query / getConnection 호환 */
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    admindb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function executeAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    admindb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function getConnectionAsync() {
  return new Promise((resolve, reject) => {
    admindb.getConnection((err, connection) => {
      if (err) return reject(err);
      resolve(connection);
    });
  });
}

function connectionQueryAsync(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function beginTransactionAsync(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((err) => (err ? reject(err) : resolve()));
  });
}

function commitAsync(connection) {
  return new Promise((resolve, reject) => {
    connection.commit((err) => (err ? reject(err) : resolve()));
  });
}

function rollbackAsync(connection) {
  return new Promise((resolve, reject) => {
    connection.rollback((err) => (err ? reject(err) : resolve()));
  });
}

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
router.use(cors());
router.use(express.json());

const TODO_STATUSES = new Set(['todo', 'in_progress', 'done']);
const TODO_PRIORITIES = new Set(['low', 'medium', 'high']);

const TODO_SELECT_FIELDS = `
    t.id,
    t.assignee_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    u.name AS assignee_name,
    u.position AS assignee_position,
    u.department AS assignee_department`;

const TODO_LIST_BASE_SQL = `
  SELECT ${TODO_SELECT_FIELDS}
  FROM admintodos t
  INNER JOIN adminusers u ON t.assignee_id = u.id`;

const TODO_BY_ID_SQL = `
  SELECT ${TODO_SELECT_FIELDS}
  FROM admintodos t
  INNER JOIN adminusers u ON t.assignee_id = u.id
  WHERE t.id = ?
  LIMIT 1
`;

const TEMPLATE_SELECT_FIELDS = `
    tt.id,
    tt.assignee_id,
    tt.title,
    tt.description,
    tt.priority,
    u.name AS assignee_name,
    u.position AS assignee_position,
    u.department AS assignee_department`;

const TEMPLATE_LIST_BASE_SQL = `
  SELECT ${TEMPLATE_SELECT_FIELDS}
  FROM admintodo_templates tt
  INNER JOIN adminusers u ON tt.assignee_id = u.id`;

const TEMPLATE_BY_ID_SQL = `
  SELECT ${TEMPLATE_SELECT_FIELDS}
  FROM admintodo_templates tt
  INNER JOIN adminusers u ON tt.assignee_id = u.id
  WHERE tt.id = ?
  LIMIT 1
`;

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

async function getAdminById(id) {
  const rows = await queryAsync(
    `SELECT id, name, department, position, role, status
       FROM adminusers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** 요청자 검증 — 승인된(active) 관리자만 */
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

async function getActiveEmployeeById(assigneeId) {
  const rows = await queryAsync(
    `SELECT id, name, department, position, status
       FROM adminusers
      WHERE id = ?
      LIMIT 1`,
    [assigneeId]
  );
  const row = rows[0];
  if (!row || !isActiveAdminStatus(row.status)) return null;
  return row;
}

async function getTodoById(id) {
  const rows = await queryAsync(TODO_BY_ID_SQL, [id]);
  return rows[0] || null;
}

function canAccessTodo(todo, ctx) {
  if (!todo) return false;
  return ctx.isSuper || todo.assignee_id === ctx.requesterId;
}

async function getTemplateById(id) {
  const rows = await queryAsync(TEMPLATE_BY_ID_SQL, [id]);
  return rows[0] || null;
}

function canAccessTemplate(template, ctx) {
  if (!template) return false;
  return ctx.isSuper || template.assignee_id === ctx.requesterId;
}

/** GET /admintodos/employees — 최종관리자: 전체, 일반: 본인만 */
router.get('/employees', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    if (!ctx.isSuper) {
      const { id, name, department, position } = ctx.admin;
      return res.status(200).json({
        ok: true,
        data: [{ id, name, department, position }],
      });
    }

    const rows = await queryAsync(
      `SELECT id, name, department, position, status
         FROM adminusers
        ORDER BY name ASC`
    );
    const data = rows
      .filter((row) => isActiveAdminStatus(row.status))
      .map(({ id, name, department, position }) => ({ id, name, department, position }));
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('GET /admintodos/employees error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch employees');
  }
});

/** GET /admintodos/todos — 최종관리자: 전체, 일반: 본인 담당만 */
router.get('/todos', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    let sql = TODO_LIST_BASE_SQL;
    const params = [];
    if (!ctx.isSuper) {
      sql += ' WHERE t.assignee_id = ?';
      params.push(ctx.requesterId);
    }
    sql += ' ORDER BY t.due_date IS NULL, t.due_date ASC, t.id ASC';

    const rows = await queryAsync(sql, params);
    return res.status(200).json({ ok: true, data: rows });
  } catch (err) {
    console.error('GET /admintodos/todos error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch todos');
  }
});

/** POST /admintodos/todos — 일반 관리자는 본인에게만 등록 가능 */
router.post('/todos', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const body = req.body || {};
    let assigneeId = parsePositiveInt(body.assignee_id);
    const title = String(body.title || '').trim();
    const description =
      body.description != null ? String(body.description).trim() : null;
    const priority = String(body.priority || '').trim().toLowerCase();
    const dueDate = normalizeDateOnly(body.due_date);

    if (!ctx.isSuper) {
      assigneeId = ctx.requesterId;
    }

    if (!assigneeId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignee_id must be a positive integer');
    }
    if (!title) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'title is required');
    }
    if (!TODO_PRIORITIES.has(priority)) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        `priority must be one of: ${[...TODO_PRIORITIES].join(', ')}`
      );
    }
    if (dueDate === undefined) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'due_date must be YYYY-MM-DD or null');
    }

    const employee = await getActiveEmployeeById(assigneeId);
    if (!employee) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignee_id is not an active employee');
    }

    const result = await executeAsync(
      `INSERT INTO admintodos (assignee_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, 'todo', ?, ?)`,
      [assigneeId, title, description || null, priority, dueDate]
    );

    const created = await getTodoById(result.insertId);
    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error('POST /admintodos/todos error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create todo');
  }
});

/** PATCH /admintodos/todos/:id */
router.patch('/todos/:id', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid todo id');
    }

    const existing = await getTodoById(id);
    if (!canAccessTodo(existing, ctx)) {
      return sendError(res, 404, 'NOT_FOUND', 'Todo not found');
    }

    const body = req.body || {};
    const sets = [];
    const params = [];

    if (body.status !== undefined) {
      const status = String(body.status).trim().toLowerCase();
      if (!TODO_STATUSES.has(status)) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          `status must be one of: ${[...TODO_STATUSES].join(', ')}`
        );
      }
      sets.push('status = ?');
      params.push(status);
    }

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'title cannot be empty');
      }
      sets.push('title = ?');
      params.push(title);
    }

    if (body.description !== undefined) {
      sets.push('description = ?');
      params.push(body.description == null ? null : String(body.description).trim());
    }

    if (body.priority !== undefined) {
      const priority = String(body.priority).trim().toLowerCase();
      if (!TODO_PRIORITIES.has(priority)) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          `priority must be one of: ${[...TODO_PRIORITIES].join(', ')}`
        );
      }
      sets.push('priority = ?');
      params.push(priority);
    }

    if (body.due_date !== undefined) {
      const dueDate = normalizeDateOnly(body.due_date);
      if (dueDate === undefined) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'due_date must be YYYY-MM-DD or null');
      }
      sets.push('due_date = ?');
      params.push(dueDate);
    }

    if (body.assignee_id !== undefined) {
      if (!ctx.isSuper) {
        return sendError(res, 403, 'FORBIDDEN', '담당자 변경은 최종관리자만 가능합니다.');
      }
      const assigneeId = parsePositiveInt(body.assignee_id);
      if (!assigneeId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'assignee_id must be a positive integer');
      }
      const employee = await getActiveEmployeeById(assigneeId);
      if (!employee) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'assignee_id is not an active employee');
      }
      sets.push('assignee_id = ?');
      params.push(assigneeId);
    }

    if (sets.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No valid fields to update');
    }

    params.push(id);
    const result = await executeAsync(
      `UPDATE admintodos SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Todo not found');
    }

    const updated = await getTodoById(id);
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    console.error('PATCH /admintodos/todos/:id error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update todo');
  }
});

/** GET /admintodos/todo-templates — 본인 반복 업무 템플릿만 */
router.get('/todo-templates', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const rows = await queryAsync(
      `${TEMPLATE_LIST_BASE_SQL} WHERE tt.assignee_id = ? ORDER BY tt.id ASC`,
      [ctx.requesterId]
    );
    return res.status(200).json({ ok: true, data: rows });
  } catch (err) {
    console.error('GET /admintodos/todo-templates error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch todo templates');
  }
});

/** POST /admintodos/todo-templates — 반복 업무 템플릿 등록 */
router.post('/todo-templates', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const body = req.body || {};
    const assigneeId = ctx.requesterId;
    const title = String(body.title || '').trim();
    const description =
      body.description != null ? String(body.description).trim() : null;
    const priority = String(body.priority || 'medium').trim().toLowerCase();
    if (!title) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'title is required');
    }
    if (!TODO_PRIORITIES.has(priority)) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        `priority must be one of: ${[...TODO_PRIORITIES].join(', ')}`
      );
    }

    const employee = await getActiveEmployeeById(assigneeId);
    if (!employee) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignee_id is not an active employee');
    }

    const result = await executeAsync(
      `INSERT INTO admintodo_templates (assignee_id, title, description, priority)
       VALUES (?, ?, ?, ?)`,
      [assigneeId, title, description || null, priority]
    );

    const created = await getTemplateById(result.insertId);
    return res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error('POST /admintodos/todo-templates error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create todo template');
  }
});

/** PATCH /admintodos/todo-templates/:id */
router.patch('/todo-templates/:id', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid template id');
    }

    const existing = await getTemplateById(id);
    if (!canAccessTemplate(existing, ctx)) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found');
    }

    const body = req.body || {};
    const sets = [];
    const params = [];

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'title cannot be empty');
      }
      sets.push('title = ?');
      params.push(title);
    }

    if (body.description !== undefined) {
      sets.push('description = ?');
      params.push(body.description == null ? null : String(body.description).trim());
    }

    if (body.priority !== undefined) {
      const priority = String(body.priority).trim().toLowerCase();
      if (!TODO_PRIORITIES.has(priority)) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          `priority must be one of: ${[...TODO_PRIORITIES].join(', ')}`
        );
      }
      sets.push('priority = ?');
      params.push(priority);
    }

    if (sets.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No valid fields to update');
    }

    params.push(id, ctx.requesterId);
    const result = await executeAsync(
      `UPDATE admintodo_templates SET ${sets.join(', ')} WHERE id = ? AND assignee_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found');
    }

    const updated = await getTemplateById(id);
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    console.error('PATCH /admintodos/todo-templates/:id error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update todo template');
  }
});

/** DELETE /admintodos/todo-templates/:id */
router.delete('/todo-templates/:id', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid template id');
    }

    const existing = await getTemplateById(id);
    if (!canAccessTemplate(existing, ctx)) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found');
    }

    const result = await executeAsync(
      'DELETE FROM admintodo_templates WHERE id = ? AND assignee_id = ?',
      [id, ctx.requesterId]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found');
    }

    return res.status(200).json({ ok: true, data: { id } });
  } catch (err) {
    console.error('DELETE /admintodos/todo-templates/:id error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete todo template');
  }
});

/**
 * POST /admintodos/todos/generate-daily
 * 본인 admintodo_templates → 본인 admintodos 일괄 생성 (due_date=오늘, status=todo)
 */
router.post('/todos/generate-daily', async (req, res) => {
  const dueDate = todayDateString();
  let connection;

  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    connection = await getConnectionAsync();
    await beginTransactionAsync(connection);

    const templates = await connectionQueryAsync(
      connection,
      `SELECT assignee_id, title, description, priority
         FROM admintodo_templates
        WHERE assignee_id = ?
        ORDER BY id ASC`,
      [ctx.requesterId]
    );

    if (!templates.length) {
      await commitAsync(connection);
      return res.status(200).json({
        ok: true,
        data: {
          due_date: dueDate,
          insertedCount: 0,
          todos: [],
        },
      });
    }

    const rows = templates.map((t) => [
      t.assignee_id,
      t.title,
      t.description != null ? t.description : null,
      'todo',
      t.priority,
      dueDate,
    ]);

    const insertResult = await connectionQueryAsync(
      connection,
      `INSERT INTO admintodos (assignee_id, title, description, status, priority, due_date)
       VALUES ?`,
      [rows]
    );

    const insertedCount = insertResult.affectedRows ?? 0;
    const firstId = insertResult.insertId;

    let createdTodos = [];
    if (insertedCount > 0 && Number.isFinite(firstId)) {
      const ids = Array.from({ length: insertedCount }, (_, i) => firstId + i);
      const idPlaceholders = ids.map(() => '?').join(', ');
      createdTodos = await connectionQueryAsync(
        connection,
        `${TODO_LIST_BASE_SQL} WHERE t.id IN (${idPlaceholders}) AND t.assignee_id = ? ORDER BY t.id ASC`,
        [...ids, ctx.requesterId]
      );
    }

    await commitAsync(connection);

    return res.status(201).json({
      ok: true,
      data: {
        due_date: dueDate,
        insertedCount,
        todos: createdTodos,
      },
    });
  } catch (err) {
    if (connection) {
      try {
        await rollbackAsync(connection);
      } catch (rollbackErr) {
        console.error('POST /admintodos/todos/generate-daily rollback error:', rollbackErr);
      }
    }
    console.error('POST /admintodos/todos/generate-daily error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate daily todos');
  } finally {
    if (connection) connection.release();
  }
});

/** DELETE /admintodos/todos/:id */
router.delete('/todos/:id', async (req, res) => {
  try {
    const ctx = await resolveRequester(req, res);
    if (!ctx) return;

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid todo id');
    }

    const existing = await getTodoById(id);
    if (!canAccessTodo(existing, ctx)) {
      return sendError(res, 404, 'NOT_FOUND', 'Todo not found');
    }

    const result = await executeAsync('DELETE FROM admintodos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Todo not found');
    }

    return res.status(200).json({ ok: true, data: { id } });
  } catch (err) {
    console.error('DELETE /admintodos/todos/:id error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete todo');
  }
});

module.exports = router;
