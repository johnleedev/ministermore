const { admindb } = require('../dbdatas/admindb');

const DEFAULT_CONTRACT_CLOCK_IN = '09:00:00';
const DEFAULT_CONTRACT_CLOCK_OUT = '18:00:00';

/** JS getDay(): 1=월 … 5=금 */
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const JS_DAY_TO_KEY = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };

let ensuredContractCols = false;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @param {unknown} value @returns {string|null|undefined} null=비움, undefined=형식오류 */
function normalizeContractTimeInput(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = m[3] != null ? parseInt(m[3], 10) : 0;
  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) return undefined;
  return `${pad2(h)}:${pad2(min)}:${pad2(sec)}`;
}

function formatContractTimeFromDb(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  }
  const s = String(value).trim();
  const parts = s.split(':');
  if (parts.length >= 2) {
    return `${pad2(parseInt(parts[0], 10))}:${pad2(parseInt(parts[1], 10))}`;
  }
  return null;
}

function toSqlTimeOrDefault(normalized, fallback) {
  return normalized || fallback;
}

function defaultWeekdaySlot() {
  return {
    clockIn: formatContractTimeFromDb(DEFAULT_CONTRACT_CLOCK_IN),
    clockOut: formatContractTimeFromDb(DEFAULT_CONTRACT_CLOCK_OUT),
  };
}

function emptyContractWeekdays() {
  return {
    mon: defaultWeekdaySlot(),
    tue: defaultWeekdaySlot(),
    wed: defaultWeekdaySlot(),
    thu: defaultWeekdaySlot(),
    fri: defaultWeekdaySlot(),
  };
}

function legacySlotFromColumns(admin) {
  const clockIn = formatContractTimeFromDb(admin?.contract_clock_in) || '09:00';
  const clockOut = formatContractTimeFromDb(admin?.contract_clock_out) || '18:00';
  return { clockIn, clockOut };
}

function contractWeekdaysFromAdminRow(admin) {
  const legacy = legacySlotFromColumns(admin);
  const get = (value, fallback) => formatContractTimeFromDb(value) || fallback;
  return {
    mon: {
      clockIn: get(admin?.contract_mon_in, legacy.clockIn),
      clockOut: get(admin?.contract_mon_out, legacy.clockOut),
    },
    tue: {
      clockIn: get(admin?.contract_tue_in, legacy.clockIn),
      clockOut: get(admin?.contract_tue_out, legacy.clockOut),
    },
    wed: {
      clockIn: get(admin?.contract_wed_in, legacy.clockIn),
      clockOut: get(admin?.contract_wed_out, legacy.clockOut),
    },
    thu: {
      clockIn: get(admin?.contract_thu_in, legacy.clockIn),
      clockOut: get(admin?.contract_thu_out, legacy.clockOut),
    },
    fri: {
      clockIn: get(admin?.contract_fri_in, legacy.clockIn),
      clockOut: get(admin?.contract_fri_out, legacy.clockOut),
    },
  };
}

function attachContractTimesToPublic(admin) {
  if (!admin) return admin;
  const legacy = legacySlotFromColumns(admin);
  const weekdays = contractWeekdaysFromAdminRow(admin);
  return {
    ...admin,
    contractClockIn: legacy.clockIn,
    contractClockOut: legacy.clockOut,
    contractWeekdays: weekdays,
  };
}

async function ensureAdminContractTimeColumns() {
  if (ensuredContractCols) return;
  const [cols] = await admindb.query('SHOW COLUMNS FROM adminusers');
  const have = new Set((cols || []).map((c) => c.Field));
  if (!have.has('contract_clock_in')) {
    await admindb.query(
      `ALTER TABLE adminusers ADD COLUMN contract_clock_in TIME NULL DEFAULT '${DEFAULT_CONTRACT_CLOCK_IN}'`,
    );
  }
  if (!have.has('contract_clock_out')) {
    await admindb.query(
      `ALTER TABLE adminusers ADD COLUMN contract_clock_out TIME NULL DEFAULT '${DEFAULT_CONTRACT_CLOCK_OUT}'`,
    );
  }

  const weekdayCols = [
    { name: 'contract_mon_in', def: DEFAULT_CONTRACT_CLOCK_IN },
    { name: 'contract_mon_out', def: DEFAULT_CONTRACT_CLOCK_OUT },
    { name: 'contract_tue_in', def: DEFAULT_CONTRACT_CLOCK_IN },
    { name: 'contract_tue_out', def: DEFAULT_CONTRACT_CLOCK_OUT },
    { name: 'contract_wed_in', def: DEFAULT_CONTRACT_CLOCK_IN },
    { name: 'contract_wed_out', def: DEFAULT_CONTRACT_CLOCK_OUT },
    { name: 'contract_thu_in', def: DEFAULT_CONTRACT_CLOCK_IN },
    { name: 'contract_thu_out', def: DEFAULT_CONTRACT_CLOCK_OUT },
    { name: 'contract_fri_in', def: DEFAULT_CONTRACT_CLOCK_IN },
    { name: 'contract_fri_out', def: DEFAULT_CONTRACT_CLOCK_OUT },
  ];
  for (const col of weekdayCols) {
    if (!have.has(col.name)) {
      await admindb.query(
        `ALTER TABLE adminusers ADD COLUMN ${col.name} TIME NULL DEFAULT '${col.def}'`,
      );
    }
  }
  ensuredContractCols = true;
}

function jsDayToWeekdayKey(date = new Date()) {
  return JS_DAY_TO_KEY[date.getDay()] || null;
}

async function getContractClockInSql(userId, at = new Date()) {
  await ensureAdminContractTimeColumns();

  const weekdayKey = jsDayToWeekdayKey(at);
  const colMap = {
    mon: 'contract_mon_in',
    tue: 'contract_tue_in',
    wed: 'contract_wed_in',
    thu: 'contract_thu_in',
    fri: 'contract_fri_in',
  };

  const col = weekdayKey ? colMap[weekdayKey] : null;
  const sql = col
    ? `SELECT ${col} AS contract_in, contract_clock_in FROM adminusers WHERE id = ? LIMIT 1`
    : 'SELECT contract_clock_in AS contract_in, contract_clock_in FROM adminusers WHERE id = ? LIMIT 1';

  const [rows] = await admindb.query(sql, [userId]);
  const formatted = formatContractTimeFromDb(rows[0]?.contract_in) || formatContractTimeFromDb(rows[0]?.contract_clock_in);
  const normalized = formatted ? normalizeContractTimeInput(formatted) : null;
  return toSqlTimeOrDefault(normalized, DEFAULT_CONTRACT_CLOCK_IN);
}

/**
 * @param {Record<string, { clockIn?: unknown, clockOut?: unknown }>|null|undefined} input
 */
function parseContractWeekdaysInput(input) {
  if (!input || typeof input !== 'object') return null;
  const result = {};
  for (const key of WEEKDAY_KEYS) {
    const slot = input[key];
    if (!slot || typeof slot !== 'object') {
      return undefined;
    }
    const clockInNorm = normalizeContractTimeInput(slot.clockIn);
    const clockOutNorm = normalizeContractTimeInput(slot.clockOut);
    if (clockInNorm === undefined || clockOutNorm === undefined) {
      return undefined;
    }
    result[key] = {
      clockInSql: clockInNorm || DEFAULT_CONTRACT_CLOCK_IN,
      clockOutSql: clockOutNorm || DEFAULT_CONTRACT_CLOCK_OUT,
    };
  }
  return result;
}

async function saveContractWeekdaysForUser(userId, weekdaysParsed) {
  await ensureAdminContractTimeColumns();
  const mon = weekdaysParsed.mon;
  const tue = weekdaysParsed.tue;
  const wed = weekdaysParsed.wed;
  const thu = weekdaysParsed.thu;
  const fri = weekdaysParsed.fri;

  await admindb.query(
    `UPDATE adminusers SET
        contract_clock_in = ?,
        contract_clock_out = ?,
        contract_mon_in = ?, contract_mon_out = ?,
        contract_tue_in = ?, contract_tue_out = ?,
        contract_wed_in = ?, contract_wed_out = ?,
        contract_thu_in = ?, contract_thu_out = ?,
        contract_fri_in = ?, contract_fri_out = ?
      WHERE id = ?`,
    [
      mon.clockInSql,
      mon.clockOutSql,
      mon.clockInSql,
      mon.clockOutSql,
      tue.clockInSql,
      tue.clockOutSql,
      wed.clockInSql,
      wed.clockOutSql,
      thu.clockInSql,
      thu.clockOutSql,
      fri.clockInSql,
      fri.clockOutSql,
      userId,
    ],
  );
}

module.exports = {
  WEEKDAY_KEYS,
  DEFAULT_CONTRACT_CLOCK_IN,
  DEFAULT_CONTRACT_CLOCK_OUT,
  normalizeContractTimeInput,
  formatContractTimeFromDb,
  ensureAdminContractTimeColumns,
  getContractClockInSql,
  parseContractWeekdaysInput,
  saveContractWeekdaysForUser,
  attachContractTimesToPublic,
  emptyContractWeekdays,
};
