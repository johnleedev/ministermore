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
const axios = require('axios');

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

// 장소 데이터 리스트 보내기
router.post('/getdataplace', async (req, res) => {
  const { sort = 'all', region = 'all' } = req.body;
  const where = [];
  const values = [];

  if (sort !== 'all') {
    where.push('sort = ?');
    values.push(sort);
  }

  if (region !== 'all') {
    where.push('region = ?');
    values.push(region);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const query = `
    SELECT id, isView, placeName, sort, size, region, location, images
    FROM dataplace ${whereClause};
  `;

  retreatdb.query(query, values, function (error, result) {
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
  });
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
    id, isView, placeName, sort, size, region, location, images
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
    done(null, 'build/images/retreat/placeimage');
  },
  filename(req, file, done) {
    done(null, file.originalname);
  }
});

const upload_default_place = multer({ storage: storageplace });

// 이미지 업로드 미들웨어를 조건부로 실행
const conditionalUpload_place = (req, res, next) => {
  if (req.query.postImage) {
    upload_default_place.array('img')(req, res, next);
  } else {
    next();
  }
};

// 장소 생성하기
router.post('/postsplace', conditionalUpload_place, (req, res) => {
  const { placeName, sort, region, location, size, address, phone, date, homepage, postImage, userContact } = req.query;

  retreatdb.query(`
    INSERT IGNORE INTO dataplace (isView, placeName, sort, region, location, size, address, phone, images, homepage, date, userContact) VALUES
     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    ['false', placeName, sort, region, location, size, address, phone, postImage, homepage, date, userContact],
    function(error, result){
      if (error) {
        console.error(error);
        res.send(false);
        return;
      }

      if (result.affectedRows > 0) {
        res.send(true);
      } else {
        res.send(false);
      }
    })
});




module.exports = router;
