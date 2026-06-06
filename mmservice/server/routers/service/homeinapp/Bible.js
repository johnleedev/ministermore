const express = require('express');
const cors = require('cors');
const { bibledb } = require('../../dbdatas/bibledb');

const router = express.Router();
const MAX_LIMIT = 1000;
const DEFAULT_TABLE = 'gaehyuck';
const ALLOWED_TABLES = new Set(['gaehyuck', 'shiunmal']);

router.use(cors());
router.use(express.json());

function resolveTableName(rawValue) {
  const tableName = String(rawValue || DEFAULT_TABLE).trim().toLowerCase();
  return ALLOWED_TABLES.has(tableName) ? tableName : DEFAULT_TABLE;
}

router.get('/books', async (_req, res) => {
  const connection = await bibledb.getConnection();
  
  try {
    const [rows] = await connection.query(
      `SELECT book_order, testament, book_name_kr, book_name_short, book_name_en, book_name_en_short, total_chapters
       FROM biblebooks
       ORDER BY book_order ASC`,
    );

    return res.json({
      success: true,
      totalCount: rows.length,
      rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성경 권 목록 조회 실패',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

router.get('/list', async (req, res) => {
  const offset = Math.max(0, Number.parseInt(String(req.query.offset || '0'), 10) || 0);
  const requestedLimit = Number.parseInt(String(req.query.limit || '200'), 10) || 200;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));
  const tableName = resolveTableName(req.query.table);

  const connection = await bibledb.getConnection();

  try {
    const [[countRow]] = await connection.query(`SELECT COUNT(*) AS totalCount FROM ${tableName}`);
    const [rows] = await connection.query(
      `SELECT id, testament, book_order, book_name_kr, book_name_en, chapter_num, verse_num, verse_text
       FROM ${tableName}
       ORDER BY book_order ASC, chapter_num ASC, verse_num ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return res.json({
      success: true,
      totalCount: Number(countRow?.totalCount || 0),
      offset,
      limit,
      tableName,
      rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성경 데이터 조회 실패',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

router.get('/verses', async (req, res) => {
  const tableName = resolveTableName(req.query.table);
  const bookOrder = Number.parseInt(String(req.query.bookOrder || ''), 10);

  if (!Number.isInteger(bookOrder) || bookOrder < 1) {
    return res.status(400).json({
      success: false,
      message: '유효한 bookOrder가 필요합니다.',
    });
  }

  const connection = await bibledb.getConnection();

  try {
    const [rows] = await connection.query(
      `SELECT id, testament, book_order, book_name_kr, book_name_en, chapter_num, verse_num, verse_text
       FROM ${tableName}
       WHERE book_order = ?
       ORDER BY chapter_num ASC, verse_num ASC`,
      [bookOrder],
    );

    return res.json({
      success: true,
      tableName,
      bookOrder,
      totalCount: rows.length,
      rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '성경 장절 조회 실패',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
