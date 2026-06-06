const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const IMAGE_BASE = path.join('build', 'images', 'postimage');

const BOARD_DEFS = {
  free: {
    postsTable: 'freePosts',
    commentsTable: 'freeComments',
    islikedTable: 'freeIsliked',
    imageSubdir: 'free',
    hasRegion: false,
  },
  events: {
    postsTable: 'eventsPosts',
    commentsTable: 'eventsComments',
    islikedTable: 'eventsIsliked',
    imageSubdir: 'events',
    hasRegion: true,
  },
  used: {
    postsTable: 'usedPosts',
    commentsTable: 'usedComments',
    islikedTable: 'usedIsliked',
    imageSubdir: 'used',
    hasRegion: true,
  },
};

const VALID_REGIONS = [
  '서울/경기도',
  '강원도',
  '대전/충청도',
  '광주/전라도',
  '대구/부산/경상도',
  '제주도',
];

function queryConn(conn, sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getConnection(db) {
  return new Promise((resolve, reject) => {
    db.getConnection((err, conn) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });
}

function beginTransaction(conn) {
  return new Promise((resolve, reject) => {
    conn.beginTransaction((err) => (err ? reject(err) : resolve()));
  });
}

function commit(conn) {
  return new Promise((resolve, reject) => {
    conn.commit((err) => (err ? reject(err) : resolve()));
  });
}

function rollback(conn) {
  return new Promise((resolve, reject) => {
    conn.rollback((err) => (err ? reject(err) : resolve()));
  });
}

function parseImages(images) {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function copyPostImages(imageNames, fromSubdir, toSubdir) {
  if (fromSubdir === toSubdir || imageNames.length === 0) {
    return;
  }

  const destDir = path.join(IMAGE_BASE, toSubdir);
  await fs.mkdir(destDir, { recursive: true });

  for (const name of imageNames) {
    const src = path.join(IMAGE_BASE, fromSubdir, name);
    const dest = path.join(destDir, name);
    if (fsSync.existsSync(src)) {
      await fs.copyFile(src, dest);
    }
  }
}

async function removePostImages(imageNames, subdir) {
  if (!imageNames.length) return;

  for (const name of imageNames) {
    const filePath = path.join(IMAGE_BASE, subdir, name);
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  }
}

/**
 * 관리자 — 게시글을 다른 게시판 테이블로 이동 (댓글·좋아요·첨부 이미지 포함)
 */
const handleAdminMovePost = ({ db }) => async (req, res) => {
  const { postId, sourceBoard, targetBoard, sort, region } = req.body;

  const sourceKey = typeof sourceBoard === 'string' ? sourceBoard.trim() : '';
  const targetKey = typeof targetBoard === 'string' ? targetBoard.trim() : '';
  const source = BOARD_DEFS[sourceKey];
  const target = BOARD_DEFS[targetKey];

  if (!postId || !source || !target) {
    res.status(400).json({ ok: false, message: 'postId, sourceBoard, targetBoard가 필요합니다.' });
    return;
  }

  if (sourceKey === targetKey) {
    res.status(400).json({ ok: false, message: '같은 게시판으로는 이동할 수 없습니다.' });
    return;
  }

  const nextSort = typeof sort === 'string' ? sort.trim() : '';
  if (!nextSort) {
    res.status(400).json({ ok: false, message: '이동 후 종류(sort)를 선택해주세요.' });
    return;
  }

  let nextRegion = null;
  if (target.hasRegion) {
    const regionTrimmed = typeof region === 'string' ? region.trim() : '';
    if (!regionTrimmed || !VALID_REGIONS.includes(regionTrimmed)) {
      res.status(400).json({ ok: false, message: '이동 대상 게시판의 지역을 선택해주세요.' });
      return;
    }
    nextRegion = regionTrimmed;
  }

  let conn;
  let imageNames = [];
  let shouldRelocateImages = false;

  try {
    const [postRows] = await db.query(`SELECT * FROM ${source.postsTable} WHERE id = ?`, [postId]);
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post) {
      res.json({ ok: false, message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    imageNames = parseImages(post.images);
    shouldRelocateImages =
      imageNames.length > 0 && source.imageSubdir !== target.imageSubdir;

    if (shouldRelocateImages) {
      await copyPostImages(imageNames, source.imageSubdir, target.imageSubdir);
    }

    const imagesJson = imageNames.length > 0 ? JSON.stringify(imageNames) : post.images || '';

    conn = await getConnection(db);
    await beginTransaction(conn);

    let insertSql;
    let insertParams;
    if (target.hasRegion) {
      insertSql = `INSERT INTO ${target.postsTable}
        (sort, region, title, content, userAccount, userNickName, date, images, views, isLiked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      insertParams = [
        nextSort,
        nextRegion,
        post.title,
        post.content,
        post.userAccount,
        post.userNickName,
        post.date,
        imagesJson,
        post.views ?? 0,
        post.isLiked ?? 0,
      ];
    } else {
      insertSql = `INSERT INTO ${target.postsTable}
        (sort, title, content, userAccount, userNickName, date, images, views, isLiked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      insertParams = [
        nextSort,
        post.title,
        post.content,
        post.userAccount,
        post.userNickName,
        post.date,
        imagesJson,
        post.views ?? 0,
        post.isLiked ?? 0,
      ];
    }

    const insertResult = await queryConn(conn, insertSql, insertParams);
    const newPostId = insertResult.insertId;
    if (!newPostId) {
      throw new Error('INSERT did not return insertId');
    }

    const comments = await queryConn(
      conn,
      `SELECT * FROM ${source.commentsTable} WHERE post_id = ?`,
      [postId],
    );

    for (const comment of comments) {
      await queryConn(
        conn,
        `INSERT INTO ${target.commentsTable} (post_id, content, userAccount, userNickName, date) VALUES (?, ?, ?, ?, ?)`,
        [newPostId, comment.content, comment.userAccount, comment.userNickName, comment.date],
      );
    }

    const likes = await queryConn(
      conn,
      `SELECT * FROM ${source.islikedTable} WHERE post_id = ?`,
      [postId],
    );

    for (const like of likes) {
      await queryConn(
        conn,
        `INSERT IGNORE INTO ${target.islikedTable} (post_id, isliked, userAccount) VALUES (?, ?, ?)`,
        [newPostId, like.isliked ?? 1, like.userAccount],
      );
    }

    await queryConn(conn, `DELETE FROM ${source.commentsTable} WHERE post_id = ?`, [postId]);
    await queryConn(conn, `DELETE FROM ${source.islikedTable} WHERE post_id = ?`, [postId]);
    await queryConn(conn, `DELETE FROM ${source.postsTable} WHERE id = ?`, [postId]);

    await commit(conn);
    conn.release();
    conn = null;

    if (shouldRelocateImages) {
      await removePostImages(imageNames, source.imageSubdir);
    }

    res.json({
      ok: true,
      newPostId,
      targetBoard: targetKey,
      message: '게시글이 이동되었습니다.',
    });
  } catch (error) {
    console.error('admin move post error:', error);
    if (conn) {
      try {
        await rollback(conn);
      } catch (rollbackErr) {
        console.error(rollbackErr);
      }
      conn.release();
    }

    if (shouldRelocateImages && imageNames.length > 0) {
      try {
        await removePostImages(imageNames, target.imageSubdir);
      } catch (cleanupErr) {
        console.error('move post image cleanup error:', cleanupErr);
      }
    }

    res.status(500).json({ ok: false, message: '게시글 이동 중 오류가 발생했습니다.' });
  }
};

module.exports = {
  BOARD_DEFS,
  handleAdminMovePost,
};
