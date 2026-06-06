const mysql = require('mysql2/promise');

const basePoolOptions = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'gksksla6985!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

/** mysql2/promise connection — 기존 mysql 콜백 API와 호환 */
function attachCallbackCompat(connection) {
  const raw = connection;
  return {
    query(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = undefined;
      }
      if (typeof cb === 'function') {
        raw
          .query(sql, params)
          .then(([rows]) => cb(null, rows))
          .catch((err) => cb(err));
        return;
      }
      return raw.query(sql, params);
    },
    beginTransaction(cb) {
      if (typeof cb === 'function') {
        raw.beginTransaction().then(() => cb(null)).catch((err) => cb(err));
        return;
      }
      return raw.beginTransaction();
    },
    commit(cb) {
      if (typeof cb === 'function') {
        raw.commit().then(() => cb(null)).catch((err) => cb(err));
        return;
      }
      return raw.commit();
    },
    rollback(cb) {
      if (typeof cb === 'function') {
        raw.rollback().then(() => cb(null)).catch((err) => cb(err));
        return;
      }
      return raw.rollback();
    },
    release() {
      raw.release();
    },
  };
}

/**
 * mysql2/promise Pool 생성.
 * 라우터의 `pool.query(sql, params, cb)` / `pool.getConnection(cb)` 콜백 호출도 그대로 동작합니다.
 * @param {string} database
 */
function createDbPool(database) {
  const pool = mysql.createPool({
    ...basePoolOptions,
    database,
  });

  const queryPromise = pool.query.bind(pool);
  pool.query = function queryCompat(sql, params, cb) {
    if (typeof params === 'function') {
      cb = params;
      params = undefined;
    }
    if (typeof cb === 'function') {
      queryPromise(sql, params)
        .then(([rows]) => cb(null, rows))
        .catch((err) => cb(err));
      return;
    }
    return queryPromise(sql, params);
  };

  const getConnectionPromise = pool.getConnection.bind(pool);
  pool.getConnection = function getConnectionCompat(cb) {
    if (typeof cb === 'function') {
      getConnectionPromise()
        .then((conn) => cb(null, attachCallbackCompat(conn)))
        .catch((err) => cb(err));
      return;
    }
    return getConnectionPromise().then((conn) => attachCallbackCompat(conn));
  };

  return pool;
}

module.exports = {
  createDbPool,
  basePoolOptions,
};
