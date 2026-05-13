/**
 * 행사 전단지 편집(EventCreate) — 마운트: `/bookleteventcreate` (server/app.js)
 * DB: eventMain + eventInfo + 프로그램 유형별 테이블
 *   - 음악회형: eventProgramConcert (postImage 포함)
 *   - 예배형: eventProgramWorship (이미지 없음)
 * eventInfo.programType = 'concert' | 'worship'
 * 구 eventProgram·eventPrograms 는 기동 시 이관/조회 폴백만.
 * CREATE TABLE DDL은 이 파일에서 제외(스키마는 DB/별도 스크립트에서 관리).
 * (BOOKLET_EVENT_PLAN.md 참고)
 */
const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
router.use(express.json());
const { bookleteventdb } = require('../../dbdatas/bookletdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { toEventMainIdInt, getLegacyEventProgramsOrderParts } = require('./bookletEventShared');
const { EVENT_ORDER_TABLE } = require('./bookletEventOrderShared');
const { mergeEventMainRow, normalizeVisibleTabsArray } = require('./bookletEventMerge');
const { sendProgramRowsResponse } = require('./bookletEventProgramRead');
const { sendCastRowsResponse } = require('./bookletEventCastRead');
const { sendWorshipRowsResponse } = require('./bookletEventWorshipRead');

const EVENT_BOOKLET_TYPE_IDS = new Set(['ordination', 'newcomer', 'concert', 'retreat']);

function normalizeBookletType(v) {
  const s = v == null ? '' : String(v).trim();
  return EVENT_BOOKLET_TYPE_IDS.has(s) ? s : '';
}

function escapeHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toEnglishFilenamePart(name) {
  const asciiOnly = String(name || '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return asciiOnly || 'event';
}

function safeFileNameSegment(s) {
  return String(s ?? '').replace(/[/\\.]+/g, '');
}

function makeEventHtml({ eventMainId, title, imageUrl }) {
  const safeTitle = escapeHtml(title || '행사 전단지');
  const safeImageUrl = escapeHtml(imageUrl || '');
  const linkUrl = `https://ministermore.co.kr/event?id=${eventMainId}`;
  const safeLinkUrl = escapeHtml(linkUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${safeLinkUrl}" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />

    <meta name="description" content="${safeTitle}"/>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeTitle}">
    <meta property="og:image" content="${safeImageUrl}">
    <meta property="og:url" content="${safeLinkUrl}">

    <title>${safeTitle}</title>

  </head>
  <body>
    <script>window.location.replace("${safeLinkUrl}");</script>
    <p>이동 중... <a href="${safeLinkUrl}">여기를 클릭하세요</a></p>
  </body>
</html>
`;
}

/** 스키마·테이블 생성은 DB에서 직접 관리. 기동 시 컬럼 보강·레거시 데이터 이관만 수행.
 * `eventProgramConcert` 등 레거시 테이블이 없으면 이관 단계는 건너뛴다(ER_NO_SUCH_TABLE 로그 없음). */
function ensureEventTables(done) {
  ensureEventInfoColumns(() => {
    ensureEventMainMetaColumns(() => {
      ensureProgramShowDateTimeColumns(() => {
        migrateOldEventProgramToConcertIfNeeded(() => {
          migrateProgramsFromLegacyIfEmpty(() => {
            ensureEventOrderColumns(() => {
              if (typeof done === 'function') done();
            });
          });
        });
      });
    });
  });
}

/** 순서 탭 eventOrder — subTitle, title, charger, notice 컬럼 보강 */
function ensureEventOrderColumns(done) {
  bookleteventdb.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [EVENT_ORDER_TABLE],
    (err, rows) => {
      if (err || !rows || !rows[0] || Number(rows[0].c) === 0) {
        return typeof done === 'function' && done();
      }
      bookleteventdb.query(
        `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [EVENT_ORDER_TABLE],
        (e2, cols) => {
          if (e2) {
            console.error('ensureEventOrderColumns:', e2.message);
            return typeof done === 'function' && done();
          }
          const have = new Set((cols || []).map((r) => r.c));
          const needed = [
            ['subTitle', 'VARCHAR(100) DEFAULT \'\''],
            ['title', 'VARCHAR(100) DEFAULT \'\''],
            ['charger', 'VARCHAR(100) DEFAULT \'\''],
            ['notice', 'TEXT NULL'],
            ['orderStyle', "VARCHAR(32) NOT NULL DEFAULT 'worship'"],
          ];
          let i = 0;
          function nextCol() {
            if (i >= needed.length) {
              return typeof done === 'function' && done();
            }
            const [name, def] = needed[i++];
            if (have.has(name)) return nextCol();
            bookleteventdb.query(`ALTER TABLE ${EVENT_ORDER_TABLE} ADD COLUMN \`${name}\` ${def}`, (e) => {
              if (e) console.error(`ALTER ${EVENT_ORDER_TABLE} ADD ${name}:`, e.message);
              else have.add(name);
              nextCol();
            });
          }
          nextCol();
        }
      );
    }
  );
}

/** 프로그램 행의 시간/일시 전단지 노출 여부 (1=노출, 0=비노출) */
function ensureProgramShowDateTimeColumns(done) {
  const tables = ['eventProgramConcert', 'eventProgramWorship'];
  let ti = 0;
  function nextTable() {
    if (ti >= tables.length) {
      return typeof done === 'function' && done();
    }
    const tname = tables[ti++];
    bookleteventdb.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = ?`,
      [tname],
      (err, rows) => {
        if (err || !rows || !rows[0] || Number(rows[0].c) === 0) {
          return nextTable();
        }
        bookleteventdb.query(
          `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [tname],
          (e2, cols) => {
            if (e2) {
              console.error('ensureProgramShowDateTimeColumns:', e2.message);
              return nextTable();
            }
            const have = new Set((cols || []).map((r) => r.c));
            if (have.has('showDateTime')) return nextTable();
            bookleteventdb.query(
              `ALTER TABLE \`${tname}\` ADD COLUMN showDateTime TINYINT(1) NOT NULL DEFAULT 1`,
              (e3) => {
                if (e3) console.error(`ALTER ${tname} showDateTime:`, e3.message);
                nextTable();
              }
            );
          }
        );
      }
    );
  }
  nextTable();
}

/** 예전에 만든 eventInfo에 eventName 등 컬럼이 없으면 saveIntro가 실패합니다. */
function ensureEventInfoColumns(done) {
  bookleteventdb.query(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventInfo'`,
    (err, rows) => {
      if (err) {
        console.error('ensureEventInfoColumns:', err.message);
        return typeof done === 'function' && done();
      }
      if (!rows || rows.length === 0) {
        return typeof done === 'function' && done();
      }
      const have = new Set(rows.map((r) => r.c));
      const needed = [
        ['bookletId', 'VARCHAR(64) NULL'],
        ['userAccount', 'VARCHAR(100) DEFAULT \'\''],
        ['eventName', 'VARCHAR(255) DEFAULT \'\''],
        ['eventNameEn', "VARCHAR(100) DEFAULT ''"],
        ['date', 'VARCHAR(50) DEFAULT \'\''],
        ['place', 'VARCHAR(255) DEFAULT \'\''],
        ['superViser', 'VARCHAR(255) DEFAULT \'\''],
        ['address', 'VARCHAR(500) DEFAULT \'\''],
        ['quiry', 'VARCHAR(50) DEFAULT \'\''],
        ['imageMain', 'TEXT NULL'],
        ['placeNaver', 'VARCHAR(500) DEFAULT \'\''],
        ['placeKakao', 'VARCHAR(500) DEFAULT \'\''],
        ['programType', 'VARCHAR(20) DEFAULT \'concert\''],
        ['visibleTabs', 'TEXT NULL'],
        ['applyNote', 'TEXT NULL'],
        ['eventGreeting', 'TEXT NULL'],
      ];
      let i = 0;
      function next() {
        if (i >= needed.length) {
          return typeof done === 'function' && done();
        }
        const [name, def] = needed[i++];
        if (have.has(name)) return next();
        bookleteventdb.query(`ALTER TABLE eventInfo ADD COLUMN \`${name}\` ${def}`, (e) => {
          if (e) console.error(`ALTER eventInfo ADD ${name}:`, e.message);
          else have.add(name);
          next();
        });
      }
      next();
    }
  );
}

/** 레거시 eventMain에 eventName 등이 한 테이블에 있던 경우: created_at/updated_at만 보강 */
function ensureEventMainMetaColumns(done) {
  bookleteventdb.query(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventMain'`,
    (err, rows) => {
      if (err) {
        console.error('ensureEventMainMetaColumns:', err.message);
        return typeof done === 'function' && done();
      }
      const have = new Set((rows || []).map((r) => r.c));
      const needed = [
        ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'],
        ['updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
        ['orderTitle', "VARCHAR(255) DEFAULT ''"],
        /** 기존 DB에 INT 등으로 쓰이는 `bookletType`과 충돌 방지 — 유형 id 문자열 전용 */
        ['eventBookletType', "VARCHAR(32) DEFAULT ''"],
        /** generateEventHtml 결과 — 공유용 HTML URL */
        ['link', 'TEXT NULL'],
      ];
      let i = 0;
      function next() {
        if (i >= needed.length) {
          return typeof done === 'function' && done();
        }
        const [name, def] = needed[i++];
        if (have.has(name)) return next();
        bookleteventdb.query(`ALTER TABLE eventMain ADD COLUMN \`${name}\` ${def}`, (e) => {
          if (e) console.error(`ALTER eventMain ADD ${name}:`, e.message);
          else have.add(name);
          next();
        });
      }
      next();
    }
  );
}

/** 구 eventProgram 테이블에만 행이 있으면 eventProgramConcert로 한 번 복사 */
function migrateOldEventProgramToConcertIfNeeded(done) {
  bookleteventdb.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = DATABASE()
     AND LOWER(table_name) = 'eventprogram'
     AND table_name <> 'eventPrograms'`,
    (err, rows) => {
      if (err || !rows || !rows[0] || Number(rows[0].c) === 0) {
        return typeof done === 'function' && done();
      }
      bookleteventdb.query('SELECT COUNT(*) AS c FROM eventProgramConcert', (e2, r2) => {
        if (e2) {
          if (e2.code !== 'ER_NO_SUCH_TABLE') {
            console.error('migrateOldEventProgram count concert:', e2.message);
          }
          return typeof done === 'function' && done();
        }
        if (r2 && r2[0] && Number(r2[0].c) > 0) {
          return typeof done === 'function' && done();
        }
        bookleteventdb.query('INSERT INTO eventProgramConcert SELECT * FROM eventProgram', (e3) => {
          if (e3 && e3.code !== 'ER_NO_SUCH_TABLE') {
            console.error('migrateOldEventProgram INSERT:', e3.message);
          }
          if (typeof done === 'function') done();
        });
      });
    }
  );
}

/** eventProgramConcert가 비어 있고 구 eventPrograms에만 행이 있으면 concert로 한 번 복사 */
function migrateProgramsFromLegacyIfEmpty(done) {
  bookleteventdb.query('SELECT COUNT(*) AS c FROM eventProgramConcert', (err, rows) => {
    if (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') {
        console.error('migrateProgramsFromLegacyIfEmpty:', err.message);
      }
      return typeof done === 'function' && done();
    }
    const n = rows && rows[0] ? Number(rows[0].c) : 0;
    if (n > 0) return typeof done === 'function' && done();
    bookleteventdb.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'eventPrograms'`,
      (eSchema, schemaRows) => {
        if (eSchema || !schemaRows || !schemaRows[0] || Number(schemaRows[0].c) === 0) {
          return typeof done === 'function' && done();
        }
        bookleteventdb.query('SELECT COUNT(*) AS c FROM eventPrograms', (err2, rows2) => {
          if (err2) {
            console.error('migrateProgramsFromLegacyIfEmpty legacy count:', err2.message);
            return typeof done === 'function' && done();
          }
          const n2 = rows2 && rows2[0] ? Number(rows2[0].c) : 0;
          if (n2 === 0) return typeof done === 'function' && done();
          getLegacyEventProgramsOrderParts(bookleteventdb, (errCols, parts) => {
            if (errCols) {
              console.error('migrateProgramsFromLegacyIfEmpty columns:', errCols.message);
              return typeof done === 'function' && done();
            }
            if (!parts) {
              return typeof done === 'function' && done();
            }
            const sql = `INSERT INTO eventProgramConcert (bookletId, showOrder, subTitle, title, dateTime, career, postImage)
         SELECT bookletId, ${parts.insertOrderExpr}, subTitle, title, dateTime, career, postImage FROM eventPrograms`;
            bookleteventdb.query(sql, (e3) => {
              if (e3 && e3.code !== 'ER_NO_SUCH_TABLE') {
                console.error('migrateProgramsFromLegacyIfEmpty INSERT:', e3.message);
              }
              if (typeof done === 'function') done();
            });
          });
        });
      }
    );
  });
}

ensureEventTables();

/** 사용자별 행사 전단지 목록 (마이페이지 서비스 관리용) */
router.get('/getUserBooklets/:userAccount', (req, res) => {
  const { userAccount } = req.params;
  if (!userAccount) {
    return res.status(400).json({ success: false, data: [] });
  }
  const query = `
    SELECT m.id, m.link, i.eventName, i.eventNameEn, i.date, i.place, i.address, i.superViser, i.imageMain AS imageMainName
    FROM eventMain m
    LEFT JOIN eventInfo i ON i.bookletId = CAST(m.id AS CHAR)
    WHERE m.userAccount = ?
    ORDER BY m.id DESC
  `;
  bookleteventdb.query(query, [userAccount], (error, result) => {
    if (error) {
      console.error('getUserBooklets event:', error.message);
      return res.status(500).json({ success: false, data: [] });
    }
    res.json({ success: true, data: result || [] });
  });
});

/** 행사 전단지 삭제 (서비스 관리용, userAccount 검증) — DB 행 + 이미지 + HTML 파일 모두 정리 */
router.post('/deleteBooklet', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId);
  const userAccount = req.body?.userAccount;
  if (eventMainId == null || !userAccount) {
    return res.status(400).json({ success: false, message: 'eventMainId와 userAccount가 필요합니다.' });
  }
  const bid = String(eventMainId);
  bookleteventdb.query(
    'SELECT id, link FROM eventMain WHERE id = ? AND userAccount = ?',
    [eventMainId, userAccount],
    (err, mainRows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!mainRows || mainRows.length === 0) {
        return res.status(403).json({ success: false, message: '권한이 없습니다.' });
      }
      const linkUrl = String(mainRows[0]?.link || '');

      const queryAsync = (sql, params) =>
        new Promise((resolve) => {
          bookleteventdb.query(sql, params, (e, rows) => {
            if (e && e.code !== 'ER_NO_SUCH_TABLE') {
              console.error('deleteBooklet collect:', e.message);
            }
            resolve(Array.isArray(rows) ? rows : []);
          });
        });

      Promise.all([
        queryAsync('SELECT imageMain FROM eventInfo WHERE bookletId = ? LIMIT 1', [bid]),
        queryAsync('SELECT postImage FROM eventProgram WHERE bookletId = ?', [bid]),
        queryAsync('SELECT postImage FROM eventProgramConcert WHERE bookletId = ?', [bid]),
        queryAsync('SELECT postImage FROM eventProgramWorship WHERE bookletId = ?', [bid]),
        queryAsync('SELECT postImage FROM eventProfile WHERE bookletId = ?', [bid]),
      ]).then(([infoRows, programRows, programConcertRows, programWorshipRows, profileRows]) => {
        const imagesRoot = path.resolve(__dirname, '../../../build/images/bookletevent');
        const safeUnlink = (subDir, fileName) => {
          const name = String(fileName || '').trim();
          if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) return;
          const target = path.resolve(imagesRoot, subDir, name);
          if (!target.startsWith(imagesRoot)) return;
          fs.unlink(target, () => {});
        };

        const unlinkImageNames = (raw, subDir) => {
          if (raw == null) return;
          let s = typeof raw === 'string' ? raw : String(raw);
          s = s.trim();
          if (!s) return;
          if (s.startsWith('[')) {
            try {
              const arr = JSON.parse(s);
              if (Array.isArray(arr)) {
                arr.forEach((n) => safeUnlink(subDir, n));
                return;
              }
            } catch (_) {
              /* ignore */
            }
          }
          safeUnlink(subDir, s);
        };

        const info = (infoRows && infoRows[0]) || {};
        unlinkImageNames(info.imageMain, 'mainimages');
        programRows.forEach((r) => unlinkImageNames(r.postImage, 'programimages'));
        programConcertRows.forEach((r) => unlinkImageNames(r.postImage, 'programimages'));
        programWorshipRows.forEach((r) => unlinkImageNames(r.postImage, 'programimages'));
        profileRows.forEach((r) => unlinkImageNames(r.postImage, 'castimages'));

        if (linkUrl) {
          const m = linkUrl.match(/\/hp\/event\/([^/?#]+)$/);
          const htmlName = m ? m[1] : '';
          if (htmlName && !htmlName.includes('..') && !htmlName.includes('/') && !htmlName.includes('\\')) {
            const htmlPath = path.resolve(__dirname, '../../../build/hp/event', htmlName);
            fs.unlink(htmlPath, () => {});
          }
        }

        bookleteventdb.query('DELETE FROM eventProgram WHERE bookletId = ?', [bid], () => {});
        bookleteventdb.query('DELETE FROM eventProgramConcert WHERE bookletId = ?', [bid], () => {});
        bookleteventdb.query('DELETE FROM eventProgramWorship WHERE bookletId = ?', [bid], () => {});
        bookleteventdb.query('DELETE FROM eventProfile WHERE bookletId = ?', [bid], () => {});
        bookleteventdb.query(`DELETE FROM ${EVENT_ORDER_TABLE} WHERE bookletId = ?`, [bid], () => {});
        bookleteventdb.query('DELETE FROM eventInfo WHERE bookletId = ?', [bid], () => {});
        bookleteventdb.query('DELETE FROM eventMain WHERE id = ?', [eventMainId], (delErr) => {
          if (delErr) return res.status(500).json({ success: false, message: delErr.message });
          res.json({ success: true });
        });
      });
    },
  );
});

router.post('/getdatabookletspart', (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  bookleteventdb.query('SELECT * FROM eventMain WHERE id = ? LIMIT 1', [id], (error, result) => {
    if (error) {
      console.error('getdatabookletspart:', error.message);
      res.send(false);
      return res.end();
    }
    if (!result || result.length === 0) {
      res.send(false);
      return res.end();
    }
    const m = result[0];
    bookleteventdb.query('SELECT * FROM eventInfo WHERE bookletId = ? LIMIT 1', [String(id)], (e2, infoRows) => {
      if (e2) {
        console.error('getdatabookletspart eventInfo:', e2.message);
        res.json([mergeEventMainRow(m, null)]);
        return res.end();
      }
      const info = infoRows && infoRows[0] ? infoRows[0] : null;
      res.json([mergeEventMainRow(m, info)]);
      res.end();
    });
  });
});

router.post('/getdataprogramspart', (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendProgramRowsResponse(bookleteventdb, String(id), res);
});

router.post('/getdatacastpart', (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendCastRowsResponse(bookleteventdb, String(id), res);
});

router.post('/getdataworshippart', (req, res) => {
  const id = toEventMainIdInt(req.body?.id);
  if (id == null) {
    res.send(false);
    return res.end();
  }
  sendWorshipRowsResponse(bookleteventdb, String(id), res);
});

/** 테이블 컬럼명을 조회. INFORMATION_SCHEMA 사용 (기존 DB 호환용) */
function fetchTableColumns(tableName) {
  return new Promise((resolve) => {
    bookleteventdb.query(
      `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [tableName],
      (err, rows) => {
        if (err || !rows) return resolve(new Set());
        resolve(new Set(rows.map((r) => r.c)));
      },
    );
  });
}

router.post('/create', async (req, res) => {
  const {
    userAccount,
    ordererName,
    ordererPhone,
    orderTitle,
    visibleTabs: visibleTabsBody,
    bookletType: bookletTypeBody,
  } = req.body || {};
  const bookletTypeStr = normalizeBookletType(bookletTypeBody);
  let visibleTabsJson = JSON.stringify(['info', 'program', 'profile']);
  if (visibleTabsBody != null && String(visibleTabsBody).trim() !== '') {
    try {
      const p = JSON.parse(String(visibleTabsBody));
      if (Array.isArray(p) && p.length > 0) {
        const n = normalizeVisibleTabsArray(p);
        if (n) visibleTabsJson = JSON.stringify(n);
      }
    } catch (_) {
      /* keep default */
    }
  }

  try {
    const [mainCols, infoCols] = await Promise.all([
      fetchTableColumns('eventMain'),
      fetchTableColumns('eventInfo'),
    ]);

    // eventMain — 레거시 templateId / bookletType(INT) 등 NOT NULL 컬럼 호환
    const mainFields = ['userAccount', 'ordererName', 'ordererPhone', 'orderTitle'];
    const mainValues = [
      userAccount || '',
      ordererName || '',
      ordererPhone || '',
      String(orderTitle || '').trim(),
    ];
    if (mainCols.has('eventBookletType')) {
      mainFields.push('eventBookletType');
      mainValues.push(bookletTypeStr);
    }
    if (mainCols.has('templateId')) {
      mainFields.push('templateId');
      // 레거시 INT(1) 또는 VARCHAR('classic') — 어느 타입이든 안전한 1을 넣음
      mainValues.push(1);
    }
    if (mainCols.has('bookletType') && !mainCols.has('eventBookletType')) {
      mainFields.push('bookletType');
      mainValues.push(0);
    }

    const insertMain = `INSERT INTO eventMain (${mainFields.map((f) => `\`${f}\``).join(', ')})
      VALUES (${mainFields.map(() => '?').join(', ')})`;
    bookleteventdb.query(insertMain, mainValues, (err, result) => {
      if (err) {
        console.error('bookletevent create eventMain:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      const newId = result.insertId;
      const bid = String(newId);

      // eventInfo — 레거시 templateId 등 NOT NULL 컬럼 호환
      const infoFields = ['bookletId', 'userAccount', 'visibleTabs'];
      const infoValues = [bid, userAccount || '', visibleTabsJson];
      if (infoCols.has('templateId')) {
        infoFields.push('templateId');
        infoValues.push('classic');
      }
      const insertInfo = `INSERT INTO eventInfo (${infoFields.map((f) => `\`${f}\``).join(', ')})
        VALUES (${infoFields.map(() => '?').join(', ')})`;
      bookleteventdb.query(insertInfo, infoValues, (e2) => {
        if (e2) {
          console.error('bookletevent create eventInfo:', e2.message);
          return res.status(500).json({ success: false, message: e2.message });
        }
        res.json({ success: true, id: newId });
      });
    });
  } catch (e) {
    console.error('bookletevent create handler:', e?.message || e);
    return res.status(500).json({ success: false, message: e?.message || String(e) });
  }
});

const MAIN_IMAGE_SLOT_COUNT = 5;

function parseImageMainNameSlots(raw) {
  const empty = () => Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, () => '');
  if (raw == null || raw === '') return empty();
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) {
        return Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, (_, i) => (p[i] != null ? String(p[i]) : ''));
      }
    } catch (_) {
      /* ignore */
    }
    return empty();
  }
  return [s, '', '', '', ''];
}

function serializeImageMainNameSlots(slots) {
  const a = Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, (_, i) => String(slots[i] || '').trim() || '');
  if (a.every((x) => !x)) return '';
  return JSON.stringify(a);
}

/** eventProgram.postImage — 클라이언트 `parsePostImageLoad` / `serializeProgramPostImageForSave` 와 동일 규칙 */
function parseEventProgramPostImageRaw(raw) {
  const names = [];
  const positions = [];
  if (raw == null || raw === '') return { names, positions };
  let arr;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw || '[]');
    } catch {
      return { names, positions };
    }
  } else {
    return { names, positions };
  }
  if (!Array.isArray(arr) || arr.length === 0) return { names, positions };
  const first = arr[0];
  if (typeof first === 'object' && first !== null && 'name' in first) {
    arr.forEach((x) => {
      names.push(String(x.name || '').trim());
      positions.push(String(x.pos || '50% 50%'));
    });
  } else {
    arr.forEach((x) => names.push(String(x).trim()));
  }
  return { names, positions };
}

function serializeEventProgramPostImage(names, positions) {
  if (!names || names.length === 0) return '[]';
  const pos = positions || [];
  return JSON.stringify(names.map((name, i) => ({ name, pos: pos[i] || '50% 50%' })));
}

function safeUploadedImageBasename(name) {
  const n = String(name || '').trim();
  if (!n || n.includes('/') || n.includes('\\') || n.includes('..')) return '';
  return n;
}

/**
 * 행사 전단지 편집 화면에서 이미지 삭제 시 즉시 디스크 + DB 반영
 * body: { eventMainId, userAccount, kind, fileName, slotIndex? }
 * kind: mainSlot | program | cast
 */
router.post('/deleteBookletUploadedImage', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId);
  const userAccount = req.body?.userAccount;
  const kind = String(req.body?.kind || '').trim();
  const fileName = safeUploadedImageBasename(req.body?.fileName);
  const slotIndexRaw = req.body?.slotIndex;

  if (eventMainId == null || !userAccount || !fileName || !kind) {
    return res.status(400).json({ success: false, message: 'eventMainId, userAccount, kind, fileName이 필요합니다.' });
  }

  const bid = String(eventMainId);
  const imagesRoot = path.resolve(__dirname, '../../../build/images/bookletevent');
  const unlinkUploaded = (subDir) => {
    const target = path.join(imagesRoot, subDir, fileName);
    if (!target.startsWith(imagesRoot)) return;
    fs.unlink(target, () => {});
  };

  bookleteventdb.query(
    'SELECT id FROM eventMain WHERE id = ? AND userAccount = ?',
    [eventMainId, userAccount],
    (ownerErr, mainRows) => {
      if (ownerErr) return res.status(500).json({ success: false, message: ownerErr.message });
      if (!mainRows || mainRows.length === 0) {
        return res.status(403).json({ success: false, message: '권한이 없습니다.' });
      }

      if (kind === 'mainSlot') {
        const idx = Number(slotIndexRaw);
        if (!Number.isInteger(idx) || idx < 0 || idx >= MAIN_IMAGE_SLOT_COUNT) {
          return res.status(400).json({ success: false, message: 'slotIndex가 올바르지 않습니다.' });
        }
        return bookleteventdb.query(
          'SELECT imageMain FROM eventInfo WHERE bookletId = ? LIMIT 1',
          [bid],
          (e, rows) => {
            if (e) return res.status(500).json({ success: false, message: e.message });
            const slots = parseImageMainNameSlots(rows?.[0]?.imageMain);
            if (String(slots[idx] || '').trim() !== fileName) {
              return res.status(400).json({ success: false, message: '해당 슬롯의 이미지가 일치하지 않습니다.' });
            }
            slots[idx] = '';
            const newJson = serializeImageMainNameSlots(slots);
            bookleteventdb.query(
              'UPDATE eventInfo SET imageMain = ? WHERE bookletId = ?',
              [newJson, bid],
              (uerr) => {
                if (uerr) return res.status(500).json({ success: false, message: uerr.message });
                unlinkUploaded('mainimages');
                return res.json({ success: true });
              },
            );
          },
        );
      }

      if (kind === 'program') {
        return bookleteventdb.query(
          'SELECT id, postImage FROM eventProgram WHERE bookletId = ?',
          [bid],
          (e, rows) => {
            if (e) return res.status(500).json({ success: false, message: e.message });
            const list = Array.isArray(rows) ? rows : [];
            const row = list.find((r) => {
              const { names } = parseEventProgramPostImageRaw(r.postImage);
              return names.some((n) => n === fileName);
            });
            if (!row) {
              return res.status(400).json({ success: false, message: '프로그램에서 해당 이미지를 찾을 수 없습니다.' });
            }
            const { names, positions } = parseEventProgramPostImageRaw(row.postImage);
            const at = names.indexOf(fileName);
            if (at < 0) {
              return res.status(400).json({ success: false, message: '프로그램에서 해당 이미지를 찾을 수 없습니다.' });
            }
            names.splice(at, 1);
            if (positions.length > at) positions.splice(at, 1);
            else while (positions.length > names.length) positions.pop();
            const nextJson = serializeEventProgramPostImage(names, positions);
            bookleteventdb.query(
              'UPDATE eventProgram SET postImage = ? WHERE id = ? AND bookletId = ?',
              [nextJson, row.id, bid],
              (uerr) => {
                if (uerr) return res.status(500).json({ success: false, message: uerr.message });
                unlinkUploaded('programimages');
                return res.json({ success: true });
              },
            );
          },
        );
      }

      if (kind === 'cast') {
        return bookleteventdb.query(
          'SELECT id FROM eventProfile WHERE bookletId = ? AND postImage = ? LIMIT 1',
          [bid, fileName],
          (e, rows) => {
            if (e) return res.status(500).json({ success: false, message: e.message });
            if (!rows || rows.length === 0) {
              return res.status(400).json({ success: false, message: '프로필에서 해당 사진을 찾을 수 없습니다.' });
            }
            const rowId = rows[0].id;
            bookleteventdb.query(
              'UPDATE eventProfile SET postImage = ? WHERE id = ? AND bookletId = ?',
              ['', rowId, bid],
              (uerr) => {
                if (uerr) return res.status(500).json({ success: false, message: uerr.message });
                unlinkUploaded('castimages');
                return res.json({ success: true });
              },
            );
          },
        );
      }

      return res.status(400).json({ success: false, message: 'kind 값이 올바르지 않습니다.' });
    },
  );
});

const storageMainImage = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletevent/mainimages';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const uploadIntro = multer({ storage: storageMainImage }).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'mainImage_0', maxCount: 1 },
  { name: 'mainImage_1', maxCount: 1 },
  { name: 'mainImage_2', maxCount: 1 },
  { name: 'mainImage_3', maxCount: 1 },
  { name: 'mainImage_4', maxCount: 1 },
]);

const storageProgramImage = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletevent/programimages';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const uploadProgramImageMulter = multer({ storage: storageProgramImage });

router.post('/uploadProgramImage', uploadProgramImageMulter.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 없습니다.' });
  }
  res.json({ success: true, filename: req.file.filename });
});

const storageCastImage = multer.diskStorage({
  destination(req, file, done) {
    const dest = 'build/images/bookletevent/castimages';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    done(null, dest);
  },
  filename(req, file, done) {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
    done(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const uploadCastImageMulter = multer({ storage: storageCastImage });

router.post('/uploadCastImage', uploadCastImageMulter.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 없습니다.' });
  }
  res.json({ success: true, filename: req.file.filename });
});

function upsertEventInfo(
  bookletIdStr,
  {
    userAccount,
    eventName,
    eventNameEn,
    date,
    place,
    superViser,
    address,
    quiry,
    placeNaver,
    placeKakao,
    imageMain,
    visibleTabs,
    applyNote,
  },
  callback
) {
  const vis =
    visibleTabs != null && visibleTabs !== ''
      ? typeof visibleTabs === 'string'
        ? visibleTabs
        : JSON.stringify(visibleTabs)
      : null;
  const apply = applyNote != null ? String(applyNote) : '';
  bookleteventdb.query(
    'SELECT id FROM eventInfo WHERE bookletId = ? LIMIT 1',
    [bookletIdStr],
    (err, rows) => {
      if (err) return callback(err);
      const vals = [
        userAccount || '',
        eventName,
        eventNameEn || '',
        date,
        place,
        superViser,
        address,
        quiry,
        imageMain || '',
        placeNaver,
        placeKakao,
        vis,
        apply,
      ];
      if (rows && rows[0]) {
        bookleteventdb.query(
          `UPDATE eventInfo SET userAccount=?, eventName=?, eventNameEn=?, date=?, place=?, superViser=?, address=?, quiry=?, imageMain=?, placeNaver=?, placeKakao=?, visibleTabs=?, applyNote=? WHERE bookletId=?`,
          [...vals, bookletIdStr],
          callback
        );
      } else {
        bookleteventdb.query(
          `INSERT INTO eventInfo (bookletId, userAccount, eventName, eventNameEn, date, place, superViser, address, quiry, imageMain, placeNaver, placeKakao, visibleTabs, applyNote) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [bookletIdStr, ...vals],
          callback
        );
      }
    }
  );
}

router.post('/saveIntro', uploadIntro, (req, res) => {
  const body = req.body || {};
  const q = req.query || {};
  const eventMainIdRaw = body.eventMainId || q.eventMainId;
  const eventMainId = eventMainIdRaw != null ? toEventMainIdInt(eventMainIdRaw) : null;
  const userAccount = body.userAccount || '';
  const ordererName = body.ordererName || '';
  const ordererPhone = body.ordererPhone || '';
  const orderTitle = String(body.orderTitle || '').trim();

  const eventName = body.eventName || '';
  const eventNameEn = String(body.eventNameEn || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 100);
  const date = body.date || '';
  const place = body.place || '';
  const superViser = body.superViser || '';
  const address = body.address || '';
  const placeNaver = body.placeNaver || '';
  const placeKakao = body.placeKakao || '';
  const quiry = body.quiry || '';
  const existingImageMainName = body.imageMainName;
  const visibleTabs = body.visibleTabs != null ? String(body.visibleTabs) : '';
  const applyNote = body.applyNote != null ? String(body.applyNote) : '';

  const files = req.files || {};
  const mainSlots = parseImageMainNameSlots(existingImageMainName);
  const legacyMain = files.mainImage?.[0];
  if (legacyMain) mainSlots[0] = legacyMain.filename;
  for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i++) {
    const f = files[`mainImage_${i}`]?.[0];
    if (f) mainSlots[i] = f.filename;
  }
  const imageMainName = serializeImageMainNameSlots(mainSlots);

  if (eventMainId == null) {
    const bookletTypeSave = normalizeBookletType(body.bookletType);
    const insertMain = `
      INSERT INTO eventMain (userAccount, ordererName, ordererPhone, orderTitle, eventBookletType)
      VALUES (?, ?, ?, ?, ?)
    `;
    bookleteventdb.query(
      insertMain,
      [userAccount, ordererName, ordererPhone, orderTitle, bookletTypeSave],
      (err, result) => {
        if (err) {
          console.error('saveIntro INSERT eventMain:', err.message);
          return res.status(500).json({ success: false, message: err.message });
        }
        const newId = result.insertId;
        const bookletIdStr = String(newId);
        upsertEventInfo(
          bookletIdStr,
          {
            userAccount,
            eventName,
            eventNameEn,
            date,
            place,
            superViser,
            address,
            quiry,
            placeNaver,
            placeKakao,
            imageMain: imageMainName,
            visibleTabs: visibleTabs || null,
            applyNote,
          },
          (e2) => {
            if (e2) {
              console.error('saveIntro INSERT eventInfo:', e2.message);
              return res.status(500).json({ success: false, message: e2.message });
            }
            res.json({
              success: true,
              id: newId,
              imageMainName: imageMainName || undefined,
            });
          }
        );
      }
    );
    return;
  }

  const bookletIdStr = String(eventMainId);
  bookleteventdb.query(`UPDATE eventMain SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [eventMainId], (errUp) => {
    if (errUp) console.error('saveIntro UPDATE eventMain:', errUp.message);
    upsertEventInfo(
      bookletIdStr,
      {
        userAccount,
        eventName,
        eventNameEn,
        date,
        place,
        superViser,
        address,
        quiry,
        placeNaver,
        placeKakao,
        imageMain: imageMainName,
        visibleTabs: visibleTabs || null,
        applyNote,
      },
      (err) => {
        if (err) {
          console.error('saveIntro UPSERT eventInfo:', err.message);
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({
          success: true,
          imageMainName: imageMainName || undefined,
        });
      }
    );
  });
});

router.post('/saveApplyNote', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId || req.query?.eventMainId);
  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }
  const applyNote = req.body?.applyNote != null ? String(req.body.applyNote) : '';
  bookleteventdb.query(
    `UPDATE eventInfo SET applyNote = ? WHERE bookletId = ?`,
    [applyNote, String(eventMainId)],
    (err, r) => {
      if (err) {
        console.error('saveApplyNote:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!r || r.affectedRows === 0) {
        return res.status(400).json({ success: false, message: '먼저 소개 탭을 저장해 주세요.' });
      }
      res.json({ success: true });
    }
  );
});

/** 초대의글은 `eventInfo.eventGreeting` (TEXT) 에 저장 */
router.post('/saveEventGreeting', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId || req.query?.eventMainId);
  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }
  const eventGreeting = req.body?.eventGreeting != null ? String(req.body.eventGreeting) : '';
  const bid = String(eventMainId);
  bookleteventdb.query(
    `INSERT INTO eventInfo (bookletId, eventGreeting)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE eventGreeting = VALUES(eventGreeting)`,
    [bid, eventGreeting],
    (err, r) => {
      if (err) {
        console.error('saveEventGreeting:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!r || r.affectedRows === 0) {
        return res.status(400).json({ success: false, message: '저장할 수 없습니다.' });
      }
      res.json({ success: true });
    }
  );
});

/** 프로그램: 통합 eventProgram 테이블 (DELETE 후 INSERT), eventInfo.programType 갱신. 레거시 concert/worship 행은 삭제만 */
router.post('/saveProgram', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId || req.query?.eventMainId);
  let programData = req.body?.programData;
  let programType = req.body?.programType || req.query?.programType || 'concert';
  if (programType !== 'worship') programType = 'concert';

  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }
  if (typeof programData === 'string') {
    try {
      programData = JSON.parse(programData);
    } catch {
      programData = [];
    }
  }
  if (!Array.isArray(programData)) programData = [];

  const bid = String(eventMainId);

  const clearLegacy = (next) => {
    bookleteventdb.query('DELETE FROM eventProgram WHERE bookletId = ?', [bid], (e0) => {
      if (e0 && e0.code !== 'ER_NO_SUCH_TABLE') console.error('saveProgram DELETE eventProgram:', e0.message);
      bookleteventdb.query('DELETE FROM eventProgramConcert WHERE bookletId = ?', [bid], () => {});
      bookleteventdb.query('DELETE FROM eventProgramWorship WHERE bookletId = ?', [bid], () => {
        if (typeof next === 'function') next();
      });
    });
  };

  clearLegacy(() => {
    bookleteventdb.query(
      `INSERT INTO eventInfo (bookletId, programType) VALUES (?, ?) ON DUPLICATE KEY UPDATE programType = VALUES(programType)`,
      [bid, programType],
      (infoErr) => {
        if (infoErr) {
          console.error('saveProgram programType:', infoErr.message);
          return res.status(500).json({ success: false, message: infoErr.message });
        }
        if (programData.length === 0) {
          return res.json({ success: true });
        }
        const rows = programData.map((p, i) => ({
          subTitle: p.subTitle || '',
          title: p.title || '',
          dateTime: p.dateTime || '',
          career: typeof p.career === 'string' ? p.career : JSON.stringify(p.career || []),
          postImage:
            programType === 'worship'
              ? '[]'
              : typeof p.postImage === 'string'
                ? p.postImage
                : JSON.stringify(p.postImage || []),
          showDateTime: p.showDateTime === false || p.showDateTime === 0 ? 0 : 1,
          showOrder: String(i),
        }));

        const insertOne = (idx) => {
          if (idx >= rows.length) {
            return res.json({ success: true });
          }
          const r = rows[idx];
          bookleteventdb.query(
            `INSERT INTO eventProgram (bookletId, showOrder, subTitle, title, dateTime, career, postImage, showDateTime)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [bid, r.showOrder, r.subTitle, r.title, r.dateTime, r.career, r.postImage, r.showDateTime],
            (insErr) => {
              if (insErr) {
                console.error('saveProgram INSERT eventProgram:', insErr.message);
                return res.status(500).json({ success: false, message: insErr.message });
              }
              insertOne(idx + 1);
            }
          );
        };
        insertOne(0);
      }
    );
  });
});

/** 프로필 탭: eventProfile DELETE 후 INSERT */
router.post('/saveCast', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId || req.query?.eventMainId);
  let castData = req.body?.castData;
  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }
  if (typeof castData === 'string') {
    try {
      castData = JSON.parse(castData);
    } catch {
      castData = [];
    }
  }
  if (!Array.isArray(castData)) castData = [];
  const bid = String(eventMainId);

  bookleteventdb.query('DELETE FROM eventProfile WHERE bookletId = ?', [bid], (delErr) => {
    if (delErr && delErr.code !== 'ER_NO_SUCH_TABLE') {
      console.error('saveCast DELETE:', delErr.message);
      return res.status(500).json({ success: false, message: delErr.message });
    }
    if (castData.length === 0) {
      return res.json({ success: true });
    }
    const rows = castData.map((c, i) => {
      const rawImg = c.postImage != null && c.postImage !== '' ? c.postImage : c.photo;
      const postImage =
        rawImg == null || rawImg === ''
          ? ''
          : typeof rawImg === 'string'
            ? rawImg
            : JSON.stringify(rawImg);
      return {
        personName: c.personName || c.name || '',
        roleName: c.roleName || c.role || '',
        note: c.note || '',
        postImage,
        showOrder: String(i),
      };
    });

    const insertOne = (idx) => {
      if (idx >= rows.length) {
        return res.json({ success: true });
      }
      const r = rows[idx];
      bookleteventdb.query(
        `INSERT INTO eventProfile (bookletId, showOrder, personName, roleName, note, postImage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bid, r.showOrder, r.personName, r.roleName, r.note, r.postImage],
        (insErr) => {
          if (insErr) {
            console.error('saveCast INSERT:', insErr.message);
            return res.status(500).json({ success: false, message: insErr.message });
          }
          insertOne(idx + 1);
        }
      );
    };
    insertOne(0);
  });
});

function normalizeOrderStyle(v) {
  const s = v == null ? '' : String(v).trim();
  if (s === 'schedule' || s === 'worship' || s === 'concert') return s;
  return 'worship';
}

/** 순서 탭: eventOrder DELETE 후 INSERT (`orderStyle`은 행마다 동일 값으로 저장) */
router.post('/saveWorship', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId || req.query?.eventMainId);
  let worshipData = req.body?.worshipData;
  const orderStyle = normalizeOrderStyle(req.body?.orderStyle);
  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }
  if (typeof worshipData === 'string') {
    try {
      worshipData = JSON.parse(worshipData);
    } catch {
      worshipData = [];
    }
  }
  if (!Array.isArray(worshipData)) worshipData = [];
  const bid = String(eventMainId);

  bookleteventdb.query(`DELETE FROM ${EVENT_ORDER_TABLE} WHERE bookletId = ?`, [bid], (delErr) => {
    if (delErr && delErr.code !== 'ER_NO_SUCH_TABLE') {
      console.error('saveWorship DELETE:', delErr.message);
      return res.status(500).json({ success: false, message: delErr.message });
    }
    if (worshipData.length === 0) {
      bookleteventdb.query(
        `INSERT INTO ${EVENT_ORDER_TABLE} (bookletId, showOrder, subTitle, title, charger, notice, orderStyle)
         VALUES (?, '0', '', '', '', '', ?)`,
        [bid, orderStyle],
        (insEmpty) => {
          if (insEmpty) {
            console.error('saveWorship INSERT(empty):', insEmpty.message);
            return res.status(500).json({ success: false, message: insEmpty.message });
          }
          return res.json({ success: true });
        }
      );
      return;
    }
    const rows = worshipData.map((w, i) => ({
      subTitle: w.subTitle || '',
      title: w.title || '',
      charger: w.charger || '',
      notice: w.notice != null ? String(w.notice) : '',
      showOrder: String(i),
    }));

    const insertOne = (idx) => {
      if (idx >= rows.length) {
        return res.json({ success: true });
      }
      const r = rows[idx];
      bookleteventdb.query(
        `INSERT INTO ${EVENT_ORDER_TABLE} (bookletId, showOrder, subTitle, title, charger, notice, orderStyle)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bid, r.showOrder, r.subTitle, r.title, r.charger, r.notice, orderStyle],
        (insErr) => {
          if (insErr) {
            console.error('saveWorship INSERT:', insErr.message);
            return res.status(500).json({ success: false, message: insErr.message });
          }
          insertOne(idx + 1);
        }
      );
    };
    insertOne(0);
  });
});

// 완료 시 공유용 HTML 생성 (build/hp/event) + eventMain.link 갱신
router.post('/generateEventHtml', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId);
  if (eventMainId == null) {
    return res.status(400).json({ success: false, message: 'eventMainId가 필요합니다.' });
  }

  const query = `
    SELECT eventName, eventNameEn, imageMain
    FROM eventInfo
    WHERE bookletId = ?
    LIMIT 1
  `;

  bookleteventdb.query(query, [String(eventMainId)], (err, rows) => {
    if (err) {
      console.error('generateEventHtml query error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '행사 정보를 찾을 수 없습니다.' });
    }

    const row = rows[0] || {};
    const eventName = String(row.eventName || '').trim() || `event${eventMainId}`;
    const imageSlots = parseImageMainNameSlots(row.imageMain);
    const firstImage = imageSlots.find((name) => String(name || '').trim() !== '');
    const imageUrl = firstImage
      ? `https://www.ministermore.co.kr/images/bookletevent/mainimages/${firstImage}`
      : '';

    const englishFromName = safeFileNameSegment(row.eventNameEn || '').replace(/[^a-zA-Z0-9]/g, '');
    const englishName = englishFromName || toEnglishFilenamePart(eventName);
    const fileName = `id${eventMainId}${englishName}.html`;
    const targetDir = path.resolve(__dirname, '../../../build/hp/event');
    const targetPath = path.join(targetDir, fileName);
    const html = makeEventHtml({ eventMainId, title: eventName, imageUrl });
    const fileUrl = `https://www.ministermore.co.kr/hp/event/${fileName}`;

    try {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, html, 'utf8');

      bookleteventdb.query(
        'UPDATE eventMain SET link = ? WHERE id = ?',
        [fileUrl, eventMainId],
        (uErr) => {
          if (uErr) console.error('generateEventHtml UPDATE link:', uErr.message);
          return res.json({
            success: true,
            fileName,
            filePath: `/hp/event/${fileName}`,
            fileUrl,
            eventName,
            eventNameEn: englishFromName,
          });
        },
      );
    } catch (writeErr) {
      console.error('generateEventHtml write error:', writeErr.message);
      return res.status(500).json({ success: false, message: writeErr.message });
    }
  });
});

module.exports = router;
