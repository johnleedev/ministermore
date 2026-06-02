const { admindb } = require('../dbdatas/admindb');

const FINANCE_TYPES = new Set(['REVENUE', 'EXPENSE']);

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    admindb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function sendError(res, status, code, message) {
  return res.status(status).json({
    ok: false,
    error: { code, message },
  });
}

function normalizeDateOnly(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return s;
}

function normalizeType(value) {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
}

function normalizeAmount(value) {
  if (value == null || value === '') return NaN;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return NaN;
  return amount;
}

function normalizeRepeatDay(value) {
  const repeatDay = Number(value);
  if (!Number.isInteger(repeatDay)) return NaN;
  return repeatDay;
}

function normalizeActiveFlag(value) {
  if (value === 0 || value === 1) return value;
  if (value === '0' || value === '1') return Number(value);
  return NaN;
}

async function createFinanceRecord(req, res) {
  try {
    const body = req.body || {};
    const type = normalizeType(body.type);
    const category = String(body.category || '').trim();
    const amount = normalizeAmount(body.amount);
    const description = body.description != null ? String(body.description).trim() : null;
    const transactionDate = normalizeDateOnly(body.transaction_date);
    const cashFlowDate = normalizeDateOnly(body.cash_flow_date);

    if (!FINANCE_TYPES.has(type)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'type must be REVENUE or EXPENSE');
    }
    if (!category) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'category is required');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'amount must be a positive number');
    }
    if (transactionDate === undefined || cashFlowDate === undefined) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'transaction_date and cash_flow_date must be YYYY-MM-DD or null'
      );
    }

    const insertResult = await queryAsync(
      `INSERT INTO admin_financial_records
        (type, category, amount, description, transaction_date, cash_flow_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, category, amount, description || null, transactionDate, cashFlowDate]
    );

    const rows = await queryAsync(
      `SELECT
          id,
          type,
          category,
          amount,
          description,
          DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
          DATE_FORMAT(cash_flow_date, '%Y-%m-%d') AS cash_flow_date,
          created_at,
          updated_at
       FROM admin_financial_records
       WHERE id = ?
       LIMIT 1`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      ok: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error('POST /api/finance error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create financial record');
  }
}

async function getFinanceRecordList(req, res) {
  try {
    const typeFilter = req.query?.type != null ? normalizeType(req.query.type) : '';
    if (typeFilter && !FINANCE_TYPES.has(typeFilter)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'type must be REVENUE or EXPENSE');
    }

    let sql = `
      SELECT
        id,
        type,
        category,
        amount,
        description,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
        DATE_FORMAT(cash_flow_date, '%Y-%m-%d') AS cash_flow_date,
        created_at,
        updated_at
      FROM admin_financial_records`;
    const params = [];

    if (typeFilter) {
      sql += ' WHERE type = ?';
      params.push(typeFilter);
    }

    sql +=
      ' ORDER BY COALESCE(cash_flow_date, transaction_date) DESC, created_at DESC, id DESC';

    const rows = await queryAsync(sql, params);
    return res.status(200).json({
      ok: true,
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('GET /api/finance/list error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch financial records');
  }
}

async function getFinanceSummary(req, res) {
  try {
    const monthsRaw = Number(req.query?.months);
    const months = Number.isInteger(monthsRaw)
      ? Math.max(6, Math.min(12, monthsRaw))
      : 12;

    const rows = await queryAsync(
      `
      SELECT
        DATE_FORMAT(COALESCE(cash_flow_date, transaction_date), '%Y-%m') AS month,
        SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) AS revenue,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense
      FROM admin_financial_records
      WHERE COALESCE(cash_flow_date, transaction_date) >= DATE_SUB(
        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
        INTERVAL ? MONTH
      )
      GROUP BY DATE_FORMAT(COALESCE(cash_flow_date, transaction_date), '%Y-%m')
      ORDER BY month ASC
      `,
      [months - 1]
    );

    const data = rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue || 0),
      expense: Number(row.expense || 0),
      net: Number(row.revenue || 0) - Number(row.expense || 0),
    }));

    return res.status(200).json({
      ok: true,
      rangeMonths: months,
      data,
    });
  } catch (err) {
    console.error('GET /api/finance/summary error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch finance summary');
  }
}

async function getRecurringExpenseList(req, res) {
  try {
    const rows = await queryAsync(
      `SELECT
         id,
         category,
         amount,
         description,
         repeat_day,
         is_active,
         created_at
       FROM admin_recurring_expenses
       ORDER BY id DESC`
    );

    return res.status(200).json({
      ok: true,
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('GET /api/finance/recurring error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch recurring expenses');
  }
}

async function createRecurringExpense(req, res) {
  try {
    const body = req.body || {};
    const category = String(body.category || '').trim();
    const amount = normalizeAmount(body.amount);
    const description = body.description != null ? String(body.description).trim() : null;
    const repeatDay = normalizeRepeatDay(body.repeat_day);

    if (!category) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'category is required');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'amount must be a positive number');
    }
    if (!Number.isInteger(repeatDay) || repeatDay < 1 || repeatDay > 31) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'repeat_day must be an integer between 1 and 31');
    }

    const insertResult = await queryAsync(
      `INSERT INTO admin_recurring_expenses
        (category, amount, description, repeat_day, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [category, amount, description || null, repeatDay]
    );

    const rows = await queryAsync(
      `SELECT
         id,
         category,
         amount,
         description,
         repeat_day,
         is_active,
         created_at
       FROM admin_recurring_expenses
       WHERE id = ?
       LIMIT 1`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      ok: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error('POST /api/finance/recurring error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create recurring expense');
  }
}

async function patchRecurringExpense(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'id must be a positive integer');
    }

    const body = req.body || {};
    const updates = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      const category = String(body.category || '').trim();
      if (!category) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'category cannot be empty');
      }
      updates.push('category = ?');
      params.push(category);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      const amount = normalizeAmount(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'amount must be a positive number');
      }
      updates.push('amount = ?');
      params.push(amount);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      const description =
        body.description == null ? null : String(body.description).trim() || null;
      updates.push('description = ?');
      params.push(description);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'repeat_day')) {
      const repeatDay = normalizeRepeatDay(body.repeat_day);
      if (!Number.isInteger(repeatDay) || repeatDay < 1 || repeatDay > 31) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'repeat_day must be an integer between 1 and 31');
      }
      updates.push('repeat_day = ?');
      params.push(repeatDay);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
      const isActive = normalizeActiveFlag(body.is_active);
      if (!(isActive === 0 || isActive === 1)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'is_active must be 0 or 1');
      }
      updates.push('is_active = ?');
      params.push(isActive);
    }

    if (!updates.length) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'At least one field is required (category, amount, description, repeat_day, is_active)'
      );
    }

    params.push(id);
    const updateResult = await queryAsync(
      `UPDATE admin_recurring_expenses
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    if (!updateResult.affectedRows) {
      return sendError(res, 404, 'NOT_FOUND', 'Recurring expense not found');
    }

    const rows = await queryAsync(
      `SELECT
         id,
         category,
         amount,
         description,
         repeat_day,
         is_active,
         created_at
       FROM admin_recurring_expenses
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      ok: true,
      data: rows[0] || null,
    });
  } catch (err) {
    console.error('PATCH /api/finance/recurring/:id error:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update recurring expense');
  }
}

module.exports = {
  FINANCE_TYPES,
  createFinanceRecord,
  getFinanceRecordList,
  getFinanceSummary,
  getRecurringExpenseList,
  createRecurringExpense,
  patchRecurringExpense,
  queryAsync,
};
