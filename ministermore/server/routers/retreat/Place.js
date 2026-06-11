const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { retreatdb } = require('../dbdatas/retreatdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/** express.static(server/build) 과 동일 기준 — cwd 무관 */
const PLACE_IMAGE_DIR = path.join(__dirname, '../../build/images/retreat/placeimage');

// 네이버 지오코딩 API 설정
const NAVER_CLIENT_ID = 'lk228kw5ry';
const NAVER_CLIENT_SECRET = 'bWtDkaiNg8Vf27V8pyHPnlyrxGPnK0X245C9UlWM';

const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.apigw.ntruss.com/map-geocode/v2/geocode', {
      params: {
        query: address
      },
      headers: {
        'x-ncp-apigw-api-key-id': NAVER_CLIENT_ID,
        'x-ncp-apigw-api-key': NAVER_CLIENT_SECRET,
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.addresses && response.data.addresses.length > 0) {
      const addressInfo = response.data.addresses[0];
      return {
        latitude: parseFloat(addressInfo.y),
        longitude: parseFloat(addressInfo.x),
        address: addressInfo.roadAddress || addressInfo.jibunAddress
      };
    }

    return null;
  } catch (error) {
    console.error('지오코딩 API 오류:', error);
    return null;
  }
};

// 주소를 좌표로 변환하는 API 엔드포인트
router.post('/geocode', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: '주소가 필요합니다.' });
  }

  try {
    const coordinates = await geocodeAddress(address);

    if (coordinates) {
      res.json({
        success: true,
        coordinates: coordinates
      });
    } else {
      res.json({
        success: false,
        error: '주소를 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('지오코딩 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 리스트/지도용 마커 좌표 일괄 조회 (DB address 기준 지오코딩)
router.post('/getdataplacemarkers', async (req, res) => {
  const { ids, region = 'all' } = req.body;

  const numericIds = Array.isArray(ids)
    ? ids.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id) && id > 0)
    : [];

  let query = '';
  let values = [];

  if (numericIds.length > 0) {
    const placeholders = numericIds.map(() => '?').join(', ');
    query = `
      SELECT id, placeName, address, location, sort, images
      FROM dataplace
      WHERE ${VISIBLE_WHERE}
        AND id IN (${placeholders});
    `;
    values = numericIds;
  } else {
    const where = [VISIBLE_WHERE];
    values = [];

    if (region !== 'all') {
      where.push('region = ?');
      values.push(region);
    }

    query = `
      SELECT id, placeName, address, location, sort, images
      FROM dataplace
      WHERE ${where.join(' AND ')}
      ORDER BY id DESC;
    `;
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      retreatdb.query(query, values, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const markers = [];
    const concurrency = 4;

    for (let i = 0; i < rows.length; i += concurrency) {
      const chunk = rows.slice(i, i + concurrency);
      const chunkMarkers = await Promise.all(
        chunk.map(async (row) => {
          const queries = [row.address, row.location, `${row.location || ''} ${row.placeName || ''}`.trim()]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);

          let coords = null;
          for (const queryText of queries) {
            coords = await geocodeAddress(queryText);
            if (coords) break;
          }

          if (!coords) return null;

          return {
            id: row.id,
            lat: coords.latitude,
            lng: coords.longitude,
            title: row.placeName,
            location: row.location,
            sort: row.sort,
            images: row.images,
          };
        }),
      );

      chunkMarkers.forEach((marker) => {
        if (marker) markers.push(marker);
      });
    }

    res.json({ success: true, markers });
  } catch (error) {
    console.error('마커 좌표 조회 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

const VISIBLE_WHERE = `(isView = 'true' OR isView = '1' OR isView = 1)`;

// 장소 데이터 리스트 보내기 (페이지네이션)
router.post('/getdataplace', async (req, res) => {
  const { sort = 'all', region = 'all', page = 1, pageSize = 9 } = req.body;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 9));
  const offset = (pageNum - 1) * limit;

  const where = [VISIBLE_WHERE];
  const values = [];

  if (sort !== 'all') {
    where.push('sort = ?');
    values.push(sort);
  }

  if (region !== 'all') {
    where.push('region = ?');
    values.push(region);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;
  const countQuery = `SELECT COUNT(*) AS totalCount FROM dataplace ${whereClause};`;
  const dataQuery = `
    SELECT id, isView, placeName, sort, size, region, location, address, images
    FROM dataplace ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      new Promise((resolve, reject) => {
        retreatdb.query(countQuery, values, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        retreatdb.query(dataQuery, [...values, limit, offset], (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      }),
    ]);

    const totalCount = countResult[0]?.totalCount ?? 0;

    if (dataResult.length > 0) {
      res.json({
        count: totalCount,
        data: dataResult,
      });
    } else {
      res.json({
        count: totalCount,
        data: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ count: 0, data: false });
  }
});

// 장소 데이터 검색하기
router.post('/getdataplacesearch', async (req, res)=>{
  const { word = '', region = 'all' } = req.body;
  const values = [`%${word}%`, `%${word}%`];
  const whereRegion = region === 'all' ? '' : 'AND region = ?';

  if (region !== 'all') {
    values.push(region);
  }

  const query =
   `SELECT
    id, isView, placeName, sort, size, region, location, address, images
    FROM dataplace
    WHERE (placeName LIKE ?
    OR address LIKE ?)
    ${whereRegion};`

  retreatdb.query(query, values, function(error, result) {
    if (error) {
      console.error(error);
      res.status(500).json({ count: 0, data: false });
      return;
    }

    if (result.length > 0) {
      res.json({
        count: result.length,
        data: result
      });
    } else {
      res.json({
        count: 0,
        data: false
      });
    }
  })
});

// 특정 장소 데이터 보내기
router.post('/getdataplacepart', async (req, res) => {
  const { id } = req.body;
  const query = `
    SELECT * FROM dataplace WHERE id = ?;
  `;

  retreatdb.query(query, [id], function (error, result) {
    if (error) {
      console.error(error);
      res.status(500).send(false);
      return;
    }

    if (result.length > 0) {
      res.json(result);
    } else {
      res.send(false);
    }
  });
});

// 장소 사진 파일 저장 미들웨어
const storageplace = multer.diskStorage({
  destination(req, file, done) {
    try {
      fs.mkdirSync(PLACE_IMAGE_DIR, { recursive: true });
      done(null, PLACE_IMAGE_DIR);
    } catch (err) {
      done(err);
    }
  },
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const upload_default_place = multer({ storage: storageplace });

const pickField = (body, query, key) => {
  if (body && body[key] != null && body[key] !== '') return body[key];
  if (query && query[key] != null && query[key] !== '') return query[key];
  return '';
};

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const isRecentDuplicateRow = (rowDate) => {
  if (!rowDate) return false;
  const t = new Date(rowDate).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DUPLICATE_WINDOW_MS;
};

// 장소 생성하기 (multipart: 필드는 body, 파일은 img)
router.post('/postsplace', (req, res) => {
  upload_default_place.array('img')(req, res, (uploadErr) => {
    if (uploadErr) {
      console.error('postsplace image upload error:', uploadErr);
      res.status(500).send(false);
      return;
    }

    const placeName = pickField(req.body, req.query, 'placeName');
    const sort = pickField(req.body, req.query, 'sort');
    const region = pickField(req.body, req.query, 'region');
    const location = pickField(req.body, req.query, 'location');
    const size = pickField(req.body, req.query, 'size');
    const address = pickField(req.body, req.query, 'address');
    const phone = pickField(req.body, req.query, 'phone');
    const date = pickField(req.body, req.query, 'date');
    const homepage = pickField(req.body, req.query, 'homepage');
    const postImage = pickField(req.body, req.query, 'postImage');
    const userContact = pickField(req.body, req.query, 'userContact');

    retreatdb.query(
      `SELECT id, date FROM dataplace WHERE placeName = ? AND address = ? AND userContact = ? ORDER BY id DESC LIMIT 1`,
      [placeName, address, userContact],
      (dupErr, dupRows) => {
        if (dupErr) {
          console.error(dupErr);
          res.send(false);
          return;
        }
        if (dupRows && dupRows.length > 0 && isRecentDuplicateRow(dupRows[0].date)) {
          res.send(true);
          return;
        }

        retreatdb.query(
          `INSERT INTO dataplace (isView, placeName, sort, region, location, size, address, phone, images, homepage, date, userContact) VALUES
           (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          ['false', placeName, sort, region, location, size, address, phone, postImage, homepage, date, userContact],
          function (error, result) {
            if (error) {
              console.error(error);
              res.send(false);
              return;
            }
            res.send(result.affectedRows > 0);
          }
        );
      }
    );
  });
});

const parseImageList = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [String(images)];
  }
};

const unlinkImageFiles = (dir, fileNames) => {
  fileNames.forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error(unlinkErr);
      }
    }
  });
};

// 관리자 — 장소 전체 목록
router.post('/admingetall', (req, res) => {
  retreatdb.query('SELECT * FROM dataplace ORDER BY id DESC', (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json({ ok: false, data: [] });
      return;
    }
    res.json({ ok: true, data: result || [] });
  });
});

// 관리자 — 노출 여부 변경
router.post('/adminupdateisview', (req, res) => {
  const { id, isView } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }
  const viewValue = isView === true || isView === 'true' || isView === 1 || isView === '1' ? 'true' : 'false';
  retreatdb.query('UPDATE dataplace SET isView = ? WHERE id = ?', [viewValue, id], (error, result) => {
    if (error) {
      console.error(error);
      res.send(false);
      return;
    }
    res.send(result.affectedRows > 0);
  });
});

// 관리자 — 장소 정보 수정
router.post('/adminupdate', (req, res) => {
  const {
    id,
    placeName,
    sort,
    region,
    location,
    size,
    address,
    phone,
    homepage,
    userContact,
    images,
  } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }

  const imagesJson = images ?? '[]';
  retreatdb.query('SELECT images FROM dataplace WHERE id = ?', [id], (selectErr, rows) => {
    if (selectErr) {
      console.error(selectErr);
      res.send(false);
      return;
    }

    const previousNames = rows.length > 0 ? parseImageList(rows[0].images) : [];
    const nextNames = parseImageList(imagesJson);
    const removedNames = previousNames.filter((name) => !nextNames.includes(name));

    retreatdb.query(
      `UPDATE dataplace SET
        placeName = ?, sort = ?, region = ?, location = ?, size = ?,
        address = ?, phone = ?, homepage = ?, userContact = ?, images = ?
       WHERE id = ?`,
      [placeName, sort, region, location, size, address, phone, homepage, userContact, imagesJson, id],
      (error, result) => {
        if (error) {
          console.error(error);
          res.send(false);
          return;
        }
        if (result.affectedRows > 0 && removedNames.length > 0) {
          unlinkImageFiles(PLACE_IMAGE_DIR, removedNames);
        }
        res.send(result.affectedRows > 0);
      }
    );
  });
});

// 관리자 — 장소 삭제
router.post('/admindelete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send(false);
    return;
  }

  retreatdb.query('SELECT images FROM dataplace WHERE id = ?', [id], (selectErr, rows) => {
    if (selectErr) {
      console.error(selectErr);
      res.send(false);
      return;
    }

    const imageNames = rows.length > 0 ? parseImageList(rows[0].images) : [];
    imageNames.forEach((fileName) => {
      const filePath = path.join(PLACE_IMAGE_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error(unlinkErr);
        }
      }
    });

    retreatdb.query('DELETE FROM dataplace WHERE id = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error(deleteErr);
        res.send(false);
        return;
      }
      res.send(result.affectedRows > 0);
    });
  });
});

module.exports = router;
