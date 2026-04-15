const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { worshipdb } = require('../dbdatas/worshipdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");


const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');



// 전체 찬양곡 가져오기
router.get('/getsongsall', async (req, res)=>{
    
  const query = 
    `SELECT * FROM songs`

  worshipdb.query(query, function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({result});
    } else {              
      res.send(false);
    }
  })
});



// 특정 찬양곡 데이터 보내기
router.post('/getsongdatapart', async (req, res) => {
  var { id } = req.body;
  const query = `
    SELECT * FROM songs WHERE id = '${id}';
  `;
  worshipdb.query(query, function (error, result) {
    if (error) {
      throw error;
    }
    if (result.length > 0) {
      res.json(result);
    } else {
      res.send(false);
    }
    res.end();
  });
});


// 페이지별 찬양곡 리스트 가져오기
router.get('/getsongs/:page', async (req, res) => {
  var page = parseInt(req.params.page) || 1;
  var pageSize = 15;
  var offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT * FROM songs
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS totalCount FROM songs;
  `;


  try {
    const [dataResult, countResult] = await Promise.all([
    new Promise((resolve, reject) => {
      worshipdb.query(dataQuery, [pageSize, offset], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      worshipdb.query(countQuery, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    })
  ]);

    const totalCount = countResult[0].totalCount;

    res.send({
      resultData: dataResult.length > 0 ? dataResult : false,
      totalCount: totalCount
    });

  } catch (error) {
    res.status(500).send({ error: 'Database query failed' });
  }
});



// 제목 검색하기
router.post('/getsongssearchword', async (req, res)=>{
  const { word } = req.body;
  
  const query = 
    `SELECT 
    *
    FROM songs
    WHERE title LIKE '%${word}%';`

  worshipdb.query(query, function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({
        totalCount: result.length,
        resultData: result
      });
    } else {              
      res.json({
        totalCount: 0,
        resultData: false
      });
    }
  })
});


// 주제 검색하기
router.post('/getsongssearchtheme', async (req, res) => {
  const { theme } = req.body; 
  const likeConditions = theme.map(t => `theme LIKE '%${t}%'`).join(' AND ');

  const query = `
    SELECT *
    FROM songs
    WHERE ${likeConditions};
  `;

  worshipdb.query(query, function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({
        totalCount: result.length,
        resultData: result
      });
    } else {              
      res.json({
        totalCount: 0,
        resultData: false
      });
    }
  });
});

// 복합 필터 검색 (구분/키/템포/제목)
router.post('/getsongsfilter', async (req, res) => {
  const { stateSort, keySort, tempoSort, word } = req.body;

  const conditions = [];
  const params = [];

  if (stateSort) { conditions.push('stateSort = ?'); params.push(stateSort); }
  if (keySort) { conditions.push('keySort = ?'); params.push(keySort); }
  if (tempoSort) { conditions.push('tempoSort = ?'); params.push(tempoSort); }
  if (word) { conditions.push('title LIKE ?'); params.push(`%${word}%`); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT *
    FROM songs
    ${whereClause}
    ORDER BY id DESC;
  `;

  worshipdb.query(query, params, function(error, result) {
    if (error) { console.error(error); return res.status(500).json({ error: 'Database query failed' }); }
    if (result.length > 0) {
      res.json({ totalCount: result.length, resultData: result });
    } else {
      res.json({ totalCount: 0, resultData: false });
    }
  });
});


// 구분별(찬송가/복음송) 검색
router.post('/getsongsbysort', async (req, res) => {
  const { stateSort } = req.body;

  const query = `
    SELECT *
    FROM songs
    WHERE stateSort = ?
    ORDER BY id DESC;
  `;

  worshipdb.query(query, [stateSort], function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({ totalCount: result.length, resultData: result });
    } else {
      res.json({ totalCount: 0, resultData: false });
    }
  });
});

// 키별 검색
router.post('/getsongsbykey', async (req, res) => {
  const { keySort } = req.body;

  const query = `
    SELECT *
    FROM songs
    WHERE keySort = ?
    ORDER BY id DESC;
  `;

  worshipdb.query(query, [keySort], function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({ totalCount: result.length, resultData: result });
    } else {
      res.json({ totalCount: 0, resultData: false });
    }
  });
});

// 템포별 검색
router.post('/getsongsbytempo', async (req, res) => {
  const { tempoSort } = req.body;

  const query = `
    SELECT *
    FROM songs
    WHERE tempoSort = ?
    ORDER BY id DESC;
  `;

  worshipdb.query(query, [tempoSort], function(error, result) {
    if (error) throw error;
    if (result.length > 0) {
      res.json({ totalCount: result.length, resultData: result });
    } else {
      res.json({ totalCount: 0, resultData: false });
    }
  });
});



module.exports = router;


