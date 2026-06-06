const express = require('express');
const router = express.Router();
const cors = require('cors');
const { commondb } = require('../dbdatas/commondb');

router.use(cors());
router.use(express.json());

const PLATFORMS = ['android', 'ios'];

const DEFAULT_STORE_URL = {
  android: 'https://play.google.com/store/apps/details?id=com.ministermore',
  ios: 'https://apps.apple.com/app/id0000000000',
};

let policyColumnsCache = null;

function queryCommon(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function execCommon(sql, params = []) {
  return new Promise((resolve, reject) => {
    commondb.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function getPolicyColumns() {
  if (policyColumnsCache) return policyColumnsCache;
  const rows = await queryCommon(
    `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appVersionControl'`,
  );
  policyColumnsCache = new Set(rows.map(row => row.name));
  return policyColumnsCache;
}

function resetPolicyColumnsCache() {
  policyColumnsCache = null;
}

function hasCol(cols, name) {
  return cols.has(name);
}

/** DB 컬럼 구성에 맞춘 SELECT (구/신 스키마 모두) */
function buildPolicySelect(cols) {
  const parts = ['id'];

  if (hasCol(cols, 'versionCode')) {
    if (hasCol(cols, 'latestVersionCode')) {
      parts.push('COALESCE(versionCode, latestVersionCode, minVersionCode) AS versionCode');
    } else {
      parts.push('versionCode');
    }
  } else if (hasCol(cols, 'latestVersionCode')) {
    parts.push('COALESCE(latestVersionCode, minVersionCode) AS versionCode');
  } else {
    parts.push('1 AS versionCode');
  }

  if (hasCol(cols, 'versionName')) {
    if (hasCol(cols, 'latestVersionName')) {
      parts.push('COALESCE(versionName, latestVersionName, minVersionName) AS versionName');
    } else {
      parts.push('versionName');
    }
  } else if (hasCol(cols, 'latestVersionName')) {
    parts.push('COALESCE(latestVersionName, minVersionName) AS versionName');
  } else {
    parts.push('NULL AS versionName');
  }

  parts.push(
    hasCol(cols, 'forceUpdateEnabled') ? 'forceUpdateEnabled' : '1 AS forceUpdateEnabled',
  );
  parts.push(hasCol(cols, 'updateMessage') ? 'updateMessage' : 'NULL AS updateMessage');

  if (hasCol(cols, 'storeUrlAndroid')) {
    parts.push('storeUrlAndroid');
  } else if (hasCol(cols, 'storeUrl')) {
    parts.push('storeUrl AS storeUrlAndroid');
  } else {
    parts.push('NULL AS storeUrlAndroid');
  }

  parts.push(hasCol(cols, 'storeUrlIos') ? 'storeUrlIos' : 'NULL AS storeUrlIos');
  parts.push(hasCol(cols, 'createdAt') ? 'createdAt' : 'NULL AS createdAt');
  parts.push(hasCol(cols, 'updatedAt') ? 'updatedAt' : 'NULL AS updatedAt');

  return parts.join(',\n  ');
}

async function policySelectSql() {
  const cols = await getPolicyColumns();
  if (!cols.size) {
    const err = new Error('appVersionControl 테이블이 없습니다.');
    err.code = 'ER_NO_SUCH_TABLE';
    throw err;
  }
  return buildPolicySelect(cols);
}

async function fetchPolicies(orderBy = 'id DESC') {
  const select = await policySelectSql();
  return queryCommon(`SELECT ${select} FROM appVersionControl ORDER BY ${orderBy}`);
}

function parseVersionCode(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function pickStoreUrl(policy, platform) {
  const key = platform === 'ios' ? 'storeUrlIos' : 'storeUrlAndroid';
  const url = String(policy?.[key] || '').trim();
  return url || DEFAULT_STORE_URL[platform];
}

/** 가장 최근 등록( id DESC ) 정책 1건 */
async function fetchLatestVersionPolicy() {
  const rows = await fetchPolicies('id DESC LIMIT 1');
  return rows[0] || null;
}

function buildSavePayload(cols, body) {
  const versionCode = parseVersionCode(body?.versionCode);
  const versionName = String(body?.versionName || '').trim() || null;
  const forceUpdateEnabled = body?.forceUpdateEnabled !== false ? 1 : 0;
  const updateMessage = String(body?.updateMessage || '').trim() || null;
  const storeUrlAndroid = String(body?.storeUrlAndroid || '').trim() || null;
  const storeUrlIos = String(body?.storeUrlIos || '').trim() || null;

  const fields = [];
  const values = [];

  const set = (col, val) => {
    if (hasCol(cols, col)) {
      fields.push(col);
      values.push(val);
    }
  };

  if (hasCol(cols, 'versionCode')) {
    set('versionCode', versionCode);
  } else {
    set('latestVersionCode', versionCode);
    set('minVersionCode', versionCode);
  }

  if (hasCol(cols, 'versionName')) {
    set('versionName', versionName);
  } else {
    set('latestVersionName', versionName);
    set('minVersionName', versionName);
  }

  set('forceUpdateEnabled', forceUpdateEnabled);
  set('updateMessage', updateMessage);

  if (hasCol(cols, 'storeUrlAndroid')) {
    set('storeUrlAndroid', storeUrlAndroid);
  } else if (hasCol(cols, 'storeUrl')) {
    set('storeUrl', storeUrlAndroid);
  }

  set('storeUrlIos', storeUrlIos);
  set('platform', 'all');
  set('isActive', 1);

  return { versionCode, fields, values };
}

async function savePolicy(body) {
  const cols = await getPolicyColumns();
  const id = parseVersionCode(body?.id);
  const { versionCode, fields, values } = buildSavePayload(cols, body);

  if (versionCode == null) {
    return { error: { status: 400, message: 'versionCode(빌드 번호)가 필요합니다.' } };
  }
  if (!fields.length) {
    return { error: { status: 500, message: '저장 가능한 컬럼이 없습니다. DB 스키마를 확인하세요.' } };
  }

  if (id != null) {
    const assignments = fields.map(col => `${col} = ?`).join(', ');
    await execCommon(`UPDATE appVersionControl SET ${assignments} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return { id };
  }

  const placeholders = fields.map(() => '?').join(', ');
  const result = await execCommon(
    `INSERT INTO appVersionControl (${fields.join(', ')}) VALUES (${placeholders})`,
    values,
  );
  return { id: result.insertId };
}

/**
 * GET /appcontrol/check?platform=android|ios&versionCode=4&versionName=1.4
 * 가장 최근 등록 정책 기준, 앱 빌드 번호가 더 낮으면 강제 업데이트
 */
router.get('/check', async (req, res) => {
  try {
    const platformRaw = String(req.query.platform || '').trim().toLowerCase();
    const platform = PLATFORMS.includes(platformRaw) ? platformRaw : null;
    const clientVersionCode = parseVersionCode(req.query.versionCode);
    const clientVersionName = String(req.query.versionName || '').trim() || null;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'platform은 android 또는 ios 여야 합니다.',
      });
    }
    if (clientVersionCode == null) {
      return res.status(400).json({
        success: false,
        message: 'versionCode가 필요합니다.',
      });
    }

    const policy = await fetchLatestVersionPolicy();

    if (!policy) {
      return res.json({
        success: true,
        forceUpdate: false,
        optionalUpdate: false,
        clientVersionCode,
        clientVersionName,
        message: null,
        storeUrl: DEFAULT_STORE_URL[platform],
      });
    }

    const requiredCode = Number(policy.versionCode) || 0;
    const forceEnabled = Boolean(policy.forceUpdateEnabled);
    const needsForce = forceEnabled && clientVersionCode < requiredCode;

    return res.json({
      success: true,
      forceUpdate: needsForce,
      optionalUpdate: false,
      clientVersionCode,
      clientVersionName,
      versionCode: requiredCode,
      versionName: policy.versionName || null,
      latestVersionName: policy.versionName || null,
      message:
        policy.updateMessage ||
        '새 버전이 출시되었습니다. 스토어에서 업데이트 후 이용해 주세요.',
      storeUrl: pickStoreUrl(policy, platform),
    });
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') resetPolicyColumnsCache();
    console.error('appcontrol check error:', error);
    return res.status(500).json({
      success: false,
      message: '버전 확인에 실패했습니다.',
    });
  }
});

/** 관리용: 정책 목록 (최신순) */
router.get('/policies', async (_req, res) => {
  try {
    const rows = await fetchPolicies('id DESC');
    return res.json({ success: true, policies: rows });
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') resetPolicyColumnsCache();
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        success: true,
        policies: [],
        dbSetupRequired: true,
        message: 'appVersionControl 테이블이 없습니다.',
      });
    }
    console.error('appcontrol policies error:', error);
    return res.status(500).json({ success: false, message: '조회에 실패했습니다.' });
  }
});

/** 관리용: 정책 등록·수정 */
router.post('/policy', async (req, res) => {
  try {
    const result = await savePolicy(req.body);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }
    return res.json({ success: true, id: result.id });
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') resetPolicyColumnsCache();
    console.error('appcontrol policy error:', error);
    return res.status(500).json({ success: false, message: '저장에 실패했습니다.' });
  }
});

/** 관리용: 정책 삭제 */
router.delete('/policy/:id', async (req, res) => {
  try {
    const id = parseVersionCode(req.params.id);
    if (id == null) {
      return res.status(400).json({ success: false, message: '유효한 id가 필요합니다.' });
    }

    const result = await execCommon('DELETE FROM appVersionControl WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: '삭제할 정책을 찾을 수 없습니다.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('appcontrol policy delete error:', error);
    return res.status(500).json({ success: false, message: '삭제에 실패했습니다.' });
  }
});

module.exports = router;
