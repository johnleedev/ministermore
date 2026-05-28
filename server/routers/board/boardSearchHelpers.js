/**
 * 게시판 목록 칩 필터(구분/지역) 및 검색어 검색 공통 처리
 */

function parseSearchRequest(req, { withRegions = false } = {}) {
  const word = String(req.body?.word ?? '').trim();
  const categories = Array.isArray(req.body?.categories)
    ? req.body.categories.filter(Boolean)
    : [];
  const regions =
    withRegions && Array.isArray(req.body?.regions)
      ? req.body.regions.filter(Boolean)
      : [];
  const page = parseInt(req.body?.page, 10) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  return { word, categories, regions, page, pageSize, offset };
}

function hasChipFilters({ categories, regions, withRegions }) {
  return categories.length > 0 || (withRegions && regions.length > 0);
}

function validateSearchRequest({ word, categories, regions, withRegions }) {
  const chipFilters = hasChipFilters({ categories, regions, withRegions });

  if (word.length > 0 && word.length < 2 && !chipFilters) {
    return { status: 400, error: 'Search word must be at least 2 characters' };
  }

  if (!chipFilters && word.length < 2) {
    return { status: 400, error: 'Select at least one category or region filter' };
  }

  return null;
}

function buildFilterClause({ word, categories, regions, withRegions }) {
  const conditions = [];
  const filterParams = [];

  if (word.length >= 2) {
    const likeWord = `%${word}%`;
    conditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.userNickName LIKE ?)');
    filterParams.push(likeWord, likeWord, likeWord);
  }

  if (categories.length > 0) {
    conditions.push(`p.sort IN (${categories.map(() => '?').join(',')})`);
    filterParams.push(...categories);
  }

  if (withRegions && regions.length > 0) {
    conditions.push(`p.region IN (${regions.map(() => '?').join(',')})`);
    filterParams.push(...regions);
  }

  return { conditions, filterParams };
}

function runBoardSearch(boarddb, { postsTable, commentsTable, conditions, filterParams, pageSize, offset }) {
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const query = `
    SELECT p.*, COUNT(c.id) AS commentCount FROM ${postsTable} p
    LEFT JOIN ${commentsTable} c ON p.id = c.post_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.id DESC LIMIT ? OFFSET ?
  `;
  const countQuery = `
    SELECT COUNT(*) AS totalCount FROM ${postsTable} p
    ${whereClause}
  `;
  const queryParams = [...filterParams, pageSize, offset];
  const countParams = [...filterParams];

  return Promise.all([
    new Promise((resolve, reject) => {
      boarddb.query(query, queryParams, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      boarddb.query(countQuery, countParams, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    }),
  ]).then(([dataResult, countResult]) => ({
    resultData: dataResult,
    totalCount: countResult[0]?.totalCount ?? 0,
  }));
}

async function handleBoardPostSearch(req, res, boarddb, options) {
  const { postsTable, commentsTable, withRegions = false } = options;
  const parsed = parseSearchRequest(req, { withRegions });
  const validationError = validateSearchRequest({ ...parsed, withRegions });

  if (validationError) {
    return res.status(validationError.status).send({ error: validationError.error });
  }

  const { conditions, filterParams } = buildFilterClause({ ...parsed, withRegions });

  if (conditions.length === 0) {
    return res.status(400).send({ error: 'Search conditions required' });
  }

  try {
    const payload = await runBoardSearch(boarddb, {
      postsTable,
      commentsTable,
      conditions,
      filterParams,
      pageSize: parsed.pageSize,
      offset: parsed.offset,
    });
    return res.send(payload);
  } catch (error) {
    console.error(`board search error (${postsTable}):`, error);
    return res.status(500).send({ error: 'Database query failed' });
  }
}

module.exports = {
  parseSearchRequest,
  validateSearchRequest,
  buildFilterClause,
  handleBoardPostSearch,
};
