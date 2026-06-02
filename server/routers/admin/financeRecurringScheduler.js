const cron = require('node-cron');
const { queryAsync } = require('./financeController');

const AUTO_PREFIX = '[AUTO-RECURRING]';

function kstDateOnlyString() {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().slice(0, 10);
}

function buildAutoDescription(description) {
  const base = description != null ? String(description).trim() : '';
  if (!base) return AUTO_PREFIX;
  return base.startsWith(AUTO_PREFIX) ? base : `${AUTO_PREFIX} ${base}`;
}

async function runMonthlyRecurringExpenseBatch() {
  const baseDate = kstDateOnlyString();
  try {
    const recurring = await queryAsync(
      `SELECT id, category, amount, description
       FROM admin_recurring_expenses
       WHERE is_active = 1 AND repeat_day = 1
       ORDER BY id ASC`
    );

    if (!recurring.length) return;
    const values = recurring.map((item) => [
      'EXPENSE',
      item.category,
      item.amount,
      buildAutoDescription(item.description),
      baseDate,
      baseDate,
    ]);

    await queryAsync(
      `INSERT INTO admin_financial_records
        (type, category, amount, description, transaction_date, cash_flow_date)
       VALUES ?`,
      [values]
    );
  } catch (err) {
    console.error('[financeRecurringScheduler] monthly batch failed:', err);
  }
}

function startFinanceRecurringScheduler() {
  // 매월 1일 00:00 (서버 local time 기준)
  const task = cron.schedule('0 0 1 * *', () => {
    void runMonthlyRecurringExpenseBatch();
  });
  return task;
}

module.exports = {
  startFinanceRecurringScheduler,
  runMonthlyRecurringExpenseBatch,
};
