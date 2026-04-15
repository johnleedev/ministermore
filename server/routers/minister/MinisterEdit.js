const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { ministerdb } = require('../dbdatas/ministerdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
const path = require('path')
var fs = require("fs");

const escapeQuotes = (str) => {
  if (str === null || str === undefined) {
    return '';
  }
  return str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');
};


// 메인 이미지 ---------------------------------------------------------------------------------------------------------

// 메인 이미지 저장용 multer 설정
const storage_main = multer.diskStorage({
  destination(req, file, done) { 
    const dest = 'build/images/minister/mainimage';
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (e) {
      console.error('메인 이미지 디렉토리 생성 실패:', e);
    }
    done(null, dest);
  }, 
  filename(req, file, done) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    done(null, 'main_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload_main = multer({ storage: storage_main });

// 메인 이미지 저장하기
router.post('/savemainimage', upload_main.single('img'), async (req, res) => {
  const { postId } = req.body;
  
  try {
    if (!req.file) {
      return res.send(false);
    }

    const fileName = req.file.filename;
    
    // 데이터베이스에 메인 이미지 파일명 저장
    ministerdb.query(`
      UPDATE ministerMain SET mainImage = '${fileName}' WHERE id = '${postId}';
      `, function(error, result) {
      if (error) {
        console.error('DB 업데이트 실패:', error);
        res.send(false);
      } else {
        if (result.affectedRows > 0) {
          res.send({ success: true, fileName: fileName });
        } else {
          res.send(false);
        }
      }
    });

  } catch (error) {
    console.error('메인 이미지 저장 실패:', error);
    res.send(false);
  }
});

// 게시글 메인사진 삭제하기
router.post('/postsdeletemainimage', async (req, res) => {
  const { postId, mainImage } = req.body;
  try {
    // 메인 이미지 삭제
    if (mainImage) {
      const imagePath = `build/images/minister/mainimage/${mainImage}`;
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('파일 삭제 실패:', err);
          }
        });
      }
    }

    // 데이터베이스에서 메인 이미지 필드 초기화
    ministerdb.query(`
      UPDATE ministerMain SET mainImage = NULL WHERE id = '${postId}';
      `,function(error, result){
      if (error) {
        console.error('DB 업데이트 실패:', error);
        res.send(false);
        res.end();
      } else {
        if (result.affectedRows > 0) {
          res.send(true);
          res.end();
        } else {
          res.send(false);  
          res.end();
        }
      }
    })

  } catch (error) {
    console.error('메인 이미지 삭제 실패:', error);
    res.send(false);
    res.end();
  }
});



// 기본 정보 ---------------------------------------------------------------------------------------------------------

// 기본 정보 저장하기
router.post('/savebasicinfo', async (req, res) => {
  const { postId, sort, name, subNameSort, personInfo } = req.body;
  
  try {
    const personInfoCopy = escapeQuotes(personInfo || '');
    ministerdb.query(`
      UPDATE ministerMain 
      SET 
      name = '${name}', 
      subNameSort = '${subNameSort}', 
      personInfo = '${personInfoCopy}',
      sort = '${sort}'
       WHERE id = '${postId}';
      `, function(error, result) {
        if (error) {
          console.error('DB 업데이트 실패:', error);
          res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send(true);
          res.end();
        } else {
          res.send(false);
          res.end();
        }
      });
  } catch (error) {
    console.error('기본 정보 저장 실패:', error);
    res.send(false);
  }
});


// 프로필 ---------------------------------------------------------------------------------------------------------

// 프로필 저장하기
router.post('/saveprofile', async (req, res) => {
  const { postId, profile } = req.body;
  
  try {
    const profileCopy = escapeQuotes(profile || '');
    ministerdb.query(`
      UPDATE ministerMain SET profile = '${profileCopy}' WHERE id = '${postId}';
      `, function(error, result) {
        if (error) {
          console.error('DB 업데이트 실패:', error);
          res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send(true);
          res.end();
        } else {
          res.send(false);
          res.end();
        }
      });
  } catch (error) {
    console.error('기본 정보 저장 실패:', error);
    res.send(false);
  }
});

// 갤러리 이미지 ---------------------------------------------------------------------------------------------------------

// 갤러리 이미지 저장용 multer 설정
const storage_gallery = multer.diskStorage({
  destination(req, file, done) { 
    done(null, 'build/images/minister/gallery');
  }, 
  filename(req, file, done) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    done(null, 'gallery_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload_gallery = multer({ storage: storage_gallery });

// 갤러리 이미지 저장하기 (images JSON 배열에 추가/갱신)
router.post('/savegallery', upload_gallery.single('img'), async (req, res) => {
  const { postId, index } = req.body;
  
  try {
    if (!req.file) {
      return res.send(false);
    }

    const fileName = req.file.filename;

    // 현재 images 조회 후 JSON 배열로 업데이트
    ministerdb.query(`
      SELECT images FROM ministerMain WHERE id = '${postId}'
    `, function(err, rows) {
      if (err) {
        console.error('DB 조회 실패:', err);
        return res.send(false);
      }

      let imagesArr = [];
      try {
        const current = rows && rows[0] && rows[0].images ? rows[0].images : '[]';
        imagesArr = JSON.parse(current || '[]');
        if (!Array.isArray(imagesArr)) {
          imagesArr = [];
        }
      } catch (e) {
        imagesArr = [];
      }

      if (index !== undefined && index !== null && String(index).length > 0 && !Number.isNaN(Number(index))) {
        const idx = Number(index);
        while (imagesArr.length <= idx) {
          imagesArr.push('');
        }
        imagesArr[idx] = fileName;
      } else {
        imagesArr.push(fileName);
      }

      const newImagesStr = escapeQuotes(JSON.stringify(imagesArr));

      ministerdb.query(`
        UPDATE ministerMain SET images = '${newImagesStr}' WHERE id = '${postId}';
      `, function(updateErr, result) {
        if (updateErr) {
          console.error('DB 업데이트 실패:', updateErr);
          return res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send({ success: true, fileName, index: (index !== undefined ? Number(index) : imagesArr.length - 1) });
        } else {
          res.send(false);
        }
      });
    });

  } catch (error) {
    console.error('갤러리 이미지 저장 실패:', error);
    res.send(false);
  }
});

// 갤러리 이미지 삭제하기 (index 기준)
router.post('/deletegallery', async (req, res) => {
  const { postId, index } = req.body;

  try {
    if (postId === undefined || index === undefined) {
      return res.send(false);
    }

    ministerdb.query(`
      SELECT images FROM ministerMain WHERE id = '${postId}'
    `, function(err, rows) {
      if (err) {
        console.error('DB 조회 실패:', err);
        return res.send(false);
      }

      let imagesArr = [];
      try {
        const current = rows && rows[0] && rows[0].images ? rows[0].images : '[]';
        imagesArr = JSON.parse(current || '[]');
        if (!Array.isArray(imagesArr)) {
          imagesArr = [];
        }
      } catch (e) {
        imagesArr = [];
      }

      const idx = Number(index);
      if (Number.isNaN(idx) || idx < 0 || idx >= imagesArr.length) {
        return res.send(false);
      }

      const fileName = imagesArr[idx];
      // 파일 삭제 시도
      if (fileName && typeof fileName === 'string') {
        const imagePath = `build/images/minister/gallery/${fileName}`;
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('파일 삭제 실패:', unlinkErr);
            }
          });
        }
      }

      // 배열에서 해당 항목 제거
      imagesArr.splice(idx, 1);

      const newImagesStr = escapeQuotes(JSON.stringify(imagesArr));

      ministerdb.query(`
        UPDATE ministerMain SET images = '${newImagesStr}' WHERE id = '${postId}';
      `, function(updateErr, result) {
        if (updateErr) {
          console.error('DB 업데이트 실패:', updateErr);
          return res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send({ success: true, images: imagesArr });
        } else {
          res.send(false);
        }
      });
    });

  } catch (error) {
    console.error('갤러리 이미지 삭제 실패:', error);
    res.send(false);
  }
});

// 갤러리 순서 저장하기 (전체 배열 교체)
router.post('/savegalleryorder', async (req, res) => {
  const { postId, images } = req.body;

  try {
    if (!postId || images === undefined) {
      return res.send(false);
    }

    const imagesCopy = escapeQuotes(images || '[]');

    ministerdb.query(`
      UPDATE ministerMain SET images = '${imagesCopy}' WHERE id = '${postId}';
    `, function(error, result) {
      if (error) {
        console.error('DB 업데이트 실패:', error);
        return res.send(false);
      }
      if (result.affectedRows > 0) {
        res.send({ success: true });
      } else {
        res.send(false);
      }
    });
  } catch (error) {
    console.error('갤러리 순서 저장 실패:', error);
    res.send(false);
  }
});

// 유튜브 ---------------------------------------------------------------------------------------------------------

// 유튜브 썸네일 저장용 multer 설정
const storage_youtube = multer.diskStorage({
  destination(req, file, done) { 
    done(null, 'build/images/minister/thumbnail');
  }, 
  filename(req, file, done) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    done(null, 'youtube_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload_youtube = multer({ storage: storage_youtube });

// 유튜브 썸네일 저장하기 (youtube JSON 배열 index의 thumbnail 갱신)
router.post('/saveyoutubethumb', upload_youtube.single('img'), async (req, res) => {
  const { postId, index } = req.body;

  try {
    if (!req.file) {
      return res.send(false);
    }

    const fileName = req.file.filename;

    ministerdb.query(`
      SELECT youtube FROM ministerMain WHERE id = '${postId}'
    `, function(err, rows) {
      if (err) {
        console.error('DB 조회 실패:', err);
        return res.send(false);
      }

      let ytArr = [];
      try {
        const current = rows && rows[0] && rows[0].youtube ? rows[0].youtube : '[]';
        ytArr = JSON.parse(current || '[]');
        if (!Array.isArray(ytArr)) {
          ytArr = [];
        }
      } catch (e) {
        ytArr = [];
      }

      const idx = Number(index);
      if (Number.isNaN(idx) || idx < 0) {
        return res.send(false);
      }

      while (ytArr.length <= idx) {
        ytArr.push({ link: '', thumbnail: '' });
      }

      const target = ytArr[idx] && typeof ytArr[idx] === 'object' ? ytArr[idx] : {};
      target.thumbnail = fileName;
      ytArr[idx] = target;

      const newYTStr = escapeQuotes(JSON.stringify(ytArr));

      ministerdb.query(`
        UPDATE ministerMain SET youtube = '${newYTStr}' WHERE id = '${postId}';
      `, function(updateErr, result) {
        if (updateErr) {
          console.error('DB 업데이트 실패:', updateErr);
          return res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send({ success: true, fileName, index: idx });
        } else {
          res.send(false);
        }
      });
    });

  } catch (error) {
    console.error('유튜브 썸네일 저장 실패:', error);
    res.send(false);
  }
});

// 유튜브 전체 저장하기 (link/thumbnail JSON)
router.post('/saveyoutube', async (req, res) => {
  const { postId, youtube } = req.query;

  try {
    const youtubeCopy = escapeQuotes(youtube || '[]');
    ministerdb.query(`
      UPDATE ministerMain SET youtube = '${youtubeCopy}' WHERE id = '${postId}';
    `, function(error, result) {
      if (error) {
        console.error('DB 업데이트 실패:', error);
        return res.send(false);
      }
      if (result.affectedRows > 0) {
        res.send(true);
        res.end();
      } else {
        res.send(false);
        res.end();
      }
    });
  } catch (error) {
    console.error('유튜브 저장 실패:', error);
    res.send(false);
  }
});

// 유튜브 썸네일 삭제하기 (파일과 DB에서 제거)
router.post('/deleteyoutubethumb', async (req, res) => {
  const { postId, index } = req.body;

  try {
    if (postId === undefined || index === undefined) {
      return res.send(false);
    }

    ministerdb.query(`
      SELECT youtube FROM ministerMain WHERE id = '${postId}'
    `, function(err, rows) {
      if (err) {
        console.error('DB 조회 실패:', err);
        return res.send(false);
      }

      let ytArr = [];
      try {
        const current = rows && rows[0] && rows[0].youtube ? rows[0].youtube : '[]';
        ytArr = JSON.parse(current || '[]');
        if (!Array.isArray(ytArr)) {
          ytArr = [];
        }
      } catch (e) {
        ytArr = [];
      }

      const idx = Number(index);
      if (Number.isNaN(idx) || idx < 0 || idx >= ytArr.length) {
        return res.send(false);
      }

      const item = ytArr[idx];
      const thumbnail = item && item.thumbnail ? item.thumbnail : '';

      // 파일 삭제 시도
      if (thumbnail && typeof thumbnail === 'string' && !thumbnail.startsWith('http') && !thumbnail.startsWith('blob:') && !thumbnail.startsWith('data:')) {
        const imagePath = `build/images/minister/thumbnail/${thumbnail}`;
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('썸네일 파일 삭제 실패:', unlinkErr);
            }
          });
        }
      }

      // 배열에서 해당 항목 제거
      ytArr.splice(idx, 1);

      const newYTStr = escapeQuotes(JSON.stringify(ytArr));

      ministerdb.query(`
        UPDATE ministerMain SET youtube = '${newYTStr}' WHERE id = '${postId}';
      `, function(updateErr, result) {
        if (updateErr) {
          console.error('DB 업데이트 실패:', updateErr);
          return res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send({ success: true, youtube: ytArr });
        } else {
          res.send(false);
        }
      });
    });

  } catch (error) {
    console.error('유튜브 썸네일 삭제 실패:', error);
    res.send(false);
  }
});

// 연락처 ---------------------------------------------------------------------------------------------------------

// 연락처 저장하기
router.post('/savecontact', async (req, res) => {
  const { postId, contact } = req.body;
  
  try {
    const contactCopy = escapeQuotes(contact || '');
    ministerdb.query(`
      UPDATE ministerMain SET contact = '${contactCopy}' WHERE id = '${postId}';
      `, function(error, result) {
        if (error) {
          console.error('DB 업데이트 실패:', error);
          res.send(false);
        }
        if (result.affectedRows > 0) {
          res.send({ success: true });
          res.end();
        } else {
          res.send(false);
          res.end();
        }
      });
  } catch (error) {
    console.error('연락처 저장 실패:', error);
    res.send(false);
  }
});

module.exports = router;
