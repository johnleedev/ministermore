const NOTICE_SORT = '공지';

/**
 * 관리자 — 게시글 종류(sort) 공지 등록/해제
 * @param {object} options
 * @param {import('mysql').Pool} options.db
 * @param {string} options.postsTable
 */
const handleAdminNoticeSort = ({ db, postsTable }) => (req, res) => {
  const { postId, action, revertSort } = req.body;

  if (!postId) {
    res.status(400).json({ ok: false, message: 'postId가 필요합니다.' });
    return;
  }

  let nextSort;
  if (action === 'register') {
    nextSort = NOTICE_SORT;
  } else if (action === 'unregister') {
    const trimmed = typeof revertSort === 'string' ? revertSort.trim() : '';
    if (!trimmed || trimmed === NOTICE_SORT) {
      res.status(400).json({ ok: false, message: '해제 후 적용할 종류가 필요합니다.' });
      return;
    }
    nextSort = trimmed;
  } else {
    res.status(400).json({ ok: false, message: 'action은 register 또는 unregister 여야 합니다.' });
    return;
  }

  db.query(`UPDATE ${postsTable} SET sort = ? WHERE id = ?`, [nextSort, postId], (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json({ ok: false, message: 'DB 오류' });
      return;
    }
    if (result.affectedRows > 0) {
      res.json({ ok: true, sort: nextSort });
    } else {
      res.json({ ok: false, message: '게시글을 찾을 수 없습니다.' });
    }
  });
};

module.exports = {
  NOTICE_SORT,
  handleAdminNoticeSort,
};
