const { NOTICE_SORT } = require('./boardAdminHelpers');

const PAGE_SIZE = 10;

function queryDb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

/** sort 값 비교 (공백·인코딩 차이 방지) */
const SORT_TRIM_SQL = 'TRIM(p.sort)';

/** 공지 글 상단 고정용 — 구분 칩(카테고리) 필터는 적용하지 않음 */
function buildNoticeFilterClause({ word, regions, withRegions }) {
  const conditions = [`${SORT_TRIM_SQL} = ?`];
  const params = [NOTICE_SORT];

  if (word.length >= 2) {
    const likeWord = `%${word}%`;
    conditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.userNickName LIKE ?)');
    params.push(likeWord, likeWord, likeWord);
  }

  if (withRegions && regions.length > 0) {
    conditions.push(`p.region IN (${regions.map(() => '?').join(',')})`);
    params.push(...regions);
  }

  return { conditions, params };
}

/** 일반 글 목록 — 공지 제외, 구분·지역·검색어 필터 적용 */
function buildRegularFilterClause({ word, categories, regions, withRegions }) {
  const conditions = [`(p.sort IS NULL OR ${SORT_TRIM_SQL} <> ?)`];
  const params = [NOTICE_SORT];

  if (word.length >= 2) {
    const likeWord = `%${word}%`;
    conditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.userNickName LIKE ?)');
    params.push(likeWord, likeWord, likeWord);
  }

  if (categories.length > 0) {
    conditions.push(`p.sort IN (${categories.map(() => '?').join(',')})`);
    params.push(...categories);
  }

  if (withRegions && regions.length > 0) {
    conditions.push(`p.region IN (${regions.map(() => '?').join(',')})`);
    params.push(...regions);
  }

  return { conditions, params };
}

async function selectPostsWithComments(db, { postsTable, commentsTable, conditions, params, limit, offset }) {
  let sql = `
    SELECT p.*, COUNT(c.id) AS commentCount
    FROM ${postsTable} p
    LEFT JOIN ${commentsTable} c ON p.id = c.post_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  const queryParams = [...params];

  if (limit != null) {
    sql += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset ?? 0);
  }

  return queryDb(db, sql, queryParams);
}

async function countPosts(db, { postsTable, conditions, params }) {
  const sql = `
    SELECT COUNT(*) AS totalCount
    FROM ${postsTable} p
    WHERE ${conditions.join(' AND ')}
  `;
  const rows = await queryDb(db, sql, params);
  return rows[0]?.totalCount ?? 0;
}

/**
 * 공지 글(전체) + 일반 글(페이지) 목록
 */
async function fetchBoardListPayload(db, { postsTable, commentsTable, withRegions = false, page = 1, filters = null }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const filterInput = filters ?? {
    word: '',
    categories: [],
    regions: [],
  };

  const noticeFilter = buildNoticeFilterClause({ ...filterInput, withRegions });
  const regularFilter = buildRegularFilterClause({ ...filterInput, withRegions });

  const [noticePosts, resultData, totalCount] = await Promise.all([
    selectPostsWithComments(db, {
      postsTable,
      commentsTable,
      conditions: noticeFilter.conditions,
      params: noticeFilter.params,
    }),
    selectPostsWithComments(db, {
      postsTable,
      commentsTable,
      conditions: regularFilter.conditions,
      params: regularFilter.params,
      limit: PAGE_SIZE,
      offset,
    }),
    countPosts(db, {
      postsTable,
      conditions: regularFilter.conditions,
      params: regularFilter.params,
    }),
  ]);

  return {
    noticePosts,
    resultData,
    totalCount,
  };
}

async function handleBoardGetPosts(req, res, db, options) {
  const page = parseInt(req.params.page, 10) || 1;

  try {
    const payload = await fetchBoardListPayload(db, { ...options, page });
    res.send(payload);
  } catch (error) {
    console.error(`board list error (${options.postsTable}):`, error);
    res.status(500).send({ error: 'Database query failed' });
  }
}

module.exports = {
  NOTICE_SORT,
  PAGE_SIZE,
  buildNoticeFilterClause,
  buildRegularFilterClause,
  fetchBoardListPayload,
  handleBoardGetPosts,
};
