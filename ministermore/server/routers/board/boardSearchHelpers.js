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

const { fetchBoardListPayload } = require('./boardListHelpers');

async function handleBoardPostSearch(req, res, boarddb, options) {
  const { postsTable, commentsTable, withRegions = false } = options;
  const parsed = parseSearchRequest(req, { withRegions });
  const validationError = validateSearchRequest({ ...parsed, withRegions });

  if (validationError) {
    return res.status(validationError.status).send({ error: validationError.error });
  }

  const { word, categories, regions, page } = parsed;
  const chipFilters = hasChipFilters({ categories, regions, withRegions });

  if (!chipFilters && word.length < 2) {
    return res.status(400).send({ error: 'Search conditions required' });
  }

  try {
    const payload = await fetchBoardListPayload(boarddb, {
      postsTable,
      commentsTable,
      withRegions,
      page,
      filters: { word, categories, regions },
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
  handleBoardPostSearch,
};
