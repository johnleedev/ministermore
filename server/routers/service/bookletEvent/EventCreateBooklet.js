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

const { toEventMainIdInt, getLegacyEventProgramsOrderParts, toTemplateInt } = require('./bookletEventShared');
const { EVENT_ORDER_TABLE } = require('./bookletEventOrderShared');
const { templateIdStrFromBody, mergeEventMainRow, normalizeVisibleTabsArray } = require('./bookletEventMerge');
const { sendProgramRowsResponse } = require('./bookletEventProgramRead');
const { sendCastRowsResponse } = require('./bookletEventCastRead');
const { sendWorshipRowsResponse } = require('./bookletEventWorshipRead');

const EVENT_BOOKLET_TYPE_IDS = new Set(['ordination', 'newcomer', 'concert', 'retreat']);

function normalizeBookletType(v) {
  const s = v == null ? '' : String(v).trim();
  return EVENT_BOOKLET_TYPE_IDS.has(s) ? s : '';
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
        ['templateId', 'VARCHAR(50) DEFAULT \'classic\''],
        ['eventName', 'VARCHAR(255) DEFAULT \'\''],
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
    SELECT m.id, i.eventName, i.date, i.place, i.address, i.superViser, i.imageMain AS imageMainName
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

/** 행사 전단지 삭제 (서비스 관리용, userAccount 검증) */
router.post('/deleteBooklet', (req, res) => {
  const eventMainId = toEventMainIdInt(req.body?.eventMainId);
  const userAccount = req.body?.userAccount;
  if (eventMainId == null || !userAccount) {
    return res.status(400).json({ success: false, message: 'eventMainId와 userAccount가 필요합니다.' });
  }
  const bid = String(eventMainId);
  bookleteventdb.query('SELECT id FROM eventMain WHERE id = ? AND userAccount = ?', [eventMainId, userAccount], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows || rows.length === 0) {
      return res.status(403).json({ success: false, message: '권한이 없습니다.' });
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

router.post('/create', (req, res) => {
  const {
    userAccount,
    templateId,
    ordererName,
    ordererPhone,
    orderTitle,
    visibleTabs: visibleTabsBody,
    bookletType: bookletTypeBody,
  } = req.body || {};
  const templateIdStr = templateIdStrFromBody(templateId || 'classic');
  /** eventMain.templateId 컬럼은 DB에서 INT(1~8)인 경우가 많음 — 문자열 키는 정수로 변환 */
  const templateIdMain = toTemplateInt(templateIdStr);
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
  const insertQuery =
    'INSERT INTO eventMain (userAccount, templateId, ordererName, ordererPhone, orderTitle, eventBookletType) VALUES (?, ?, ?, ?, ?, ?)';
  bookleteventdb.query(
    insertQuery,
    [
      userAccount || '',
      templateIdMain,
      ordererName || '',
      ordererPhone || '',
      String(orderTitle || '').trim(),
      bookletTypeStr,
    ],
    (err, result) => {
      if (err) {
        console.error('bookletevent create:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      const newId = result.insertId;
      const bid = String(newId);
      bookleteventdb.query(
        `INSERT INTO eventInfo (bookletId, userAccount, templateId, visibleTabs) VALUES (?, ?, ?, ?)`,
        [bid, userAccount || '', templateIdStr, visibleTabsJson],
        (e2) => {
          if (e2) {
            console.error('bookletevent create eventInfo:', e2.message);
            return res.status(500).json({ success: false, message: e2.message });
          }
          res.json({ success: true, id: newId });
        }
      );
    }
  );
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
    templateIdStr,
    eventName,
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
        templateIdStr,
        eventName,
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
          `UPDATE eventInfo SET userAccount=?, templateId=?, eventName=?, date=?, place=?, superViser=?, address=?, quiry=?, imageMain=?, placeNaver=?, placeKakao=?, visibleTabs=?, applyNote=? WHERE bookletId=?`,
          [...vals, bookletIdStr],
          callback
        );
      } else {
        bookleteventdb.query(
          `INSERT INTO eventInfo (bookletId, userAccount, templateId, eventName, date, place, superViser, address, quiry, imageMain, placeNaver, placeKakao, visibleTabs, applyNote) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
  const templateId = body.templateId || q.templateId || 'classic';
  const userAccount = body.userAccount || '';
  const ordererName = body.ordererName || '';
  const ordererPhone = body.ordererPhone || '';
  const orderTitle = String(body.orderTitle || '').trim();

  const eventName = body.eventName || '';
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
  const templateIdStr = templateIdStrFromBody(templateId || 'classic');
  const templateIdMain = toTemplateInt(templateIdStr);

  if (eventMainId == null) {
    const bookletTypeSave = normalizeBookletType(body.bookletType);
    const insertMain = `
      INSERT INTO eventMain (userAccount, templateId, ordererName, ordererPhone, orderTitle, eventBookletType)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bookleteventdb.query(
      insertMain,
      [userAccount, templateIdMain, ordererName, ordererPhone, orderTitle, bookletTypeSave],
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
            templateIdStr,
            eventName,
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
        templateIdStr,
        eventName,
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

module.exports = router;
