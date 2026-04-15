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


router.post('/revisesong', (req, res) => {
  const { id, title, theme, image, source, lyrics, keySort, pptlist, youtubelist } = req.body;

  const youtubelistCopy = escapeQuotes(youtubelist);
  const pptlistCopy = escapeQuotes(pptlist);

  worshipdb.query(`
    UPDATE songs
    SET 
      title = '${escapeQuotes(title)}',
      theme = '${escapeQuotes(theme)}',
      image = '${escapeQuotes(image)}',
      source = '${escapeQuotes(source)}',
      lyrics = '${escapeQuotes(lyrics)}',
      keySort = '${escapeQuotes(keySort || '')}',
      pptlist = '${pptlistCopy || ''}',
      youtubelist = '${youtubelistCopy || ''}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


router.post('/revisesongppt', (req, res) => {
  const { id, pptlist } = req.body;
  
 const pptlistCopy = escapeQuotes(pptlist);
  worshipdb.query(`
    UPDATE songs
    SET 
      pptlist = '${pptlistCopy || ''}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});

router.post('/revisesongyoutube', (req, res) => {
  const { id, youtubelist } = req.body;
 const youtubelistCopy = escapeQuotes(youtubelist);
  worshipdb.query(`
    UPDATE songs
    SET 
      youtubelist = '${youtubelistCopy || ''}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});

router.post('/revisesongsort', (req, res) => {
  const { id, stateSort } = req.body;
 const stateSortCopy = escapeQuotes(stateSort);
  worshipdb.query(`
    UPDATE songs
    SET 
      stateSort = '${stateSortCopy}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


router.post('/revisesongkey', (req, res) => {
  const { id, keySort } = req.body;
 
  worshipdb.query(`
    UPDATE songs
    SET 
      keySort = '${keySort}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


router.post('/revisesongtheme', (req, res) => {
  const { id, theme, reviseUser } = req.body;
  
 const themeCopy = escapeQuotes(theme);
 const reviseUserCopy = reviseUser ? escapeQuotes(reviseUser) : '';
 
  worshipdb.query(`
    UPDATE songs
    SET 
      theme = '${themeCopy}',
      isRevise = 'true',
      reviseUser = '${reviseUserCopy}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


router.post('/revisesonglyrics', (req, res) => {
  const { id, lyrics } = req.body;
 const lyricsCopy = escapeQuotes(lyrics);
  worshipdb.query(`
    UPDATE songs
    SET 
      lyrics = '${lyricsCopy}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});

router.post('/revisesongimage', (req, res) => {
  const { id, image, source  } = req.body;

  worshipdb.query(`
    UPDATE songs
    SET 
      image = '${image}',
      source = '${source}'
    WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});


// 새 찬양곡 추가
router.post('/addsong', (req, res) => {
  const { title, theme, image, source, lyrics, keySort, pptlist, youtubelist, saveDate, saveUser } = req.body;

  worshipdb.query(`
    INSERT INTO songs (title, theme, image, source, lyrics, keySort, pptlist, youtubelist, saveDate, saveUser)
    VALUES ('${escapeQuotes(title)}', '${escapeQuotes(theme)}', '${escapeQuotes(image)}', '${escapeQuotes(source)}', '${escapeQuotes(lyrics)}', '${escapeQuotes(keySort || '')}', '${pptlist || ''}', '${youtubelist || ''}', '${saveDate}', '${saveUser}');
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});

// 찬양곡 삭제
router.delete('/deletesong/:id', (req, res) => {
  const { id } = req.params;

  worshipdb.query(`
    DELETE FROM songs WHERE id = '${id}';
    `,function(error, result){
    if (error) {throw error}
    if (result.affectedRows > 0) {            
      res.send(true);
      res.end();
    } else {
      res.send(false);  
      res.end();
    }})
});

// 다음곡 관리 - 특정 곡의 다음곡 목록 가져오기
router.get('/getnextsongs/:songId', async (req, res) => {
  const { songId } = req.params;
  
  try {
    // 현재 곡 정보 가져오기
    const currentSongQuery = `SELECT * FROM songs WHERE id = ?`;
    const currentSong = await new Promise((resolve, reject) => {
      worshipdb.query(currentSongQuery, [songId], (error, result) => {
        if (error) return reject(error);
        resolve(result[0]);
      });
    });

    if (!currentSong) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // 현재 곡과 같은 주제를 가진 다른 곡들 가져오기
    const themes = currentSong.theme.split(',').map(t => t.trim());
    const likeConditions = themes.map(theme => `theme LIKE '%${theme}%'`).join(' OR ');
    
    const nextSongsQuery = `
      SELECT * FROM songs 
      WHERE id != ? AND (${likeConditions})
      ORDER BY id DESC
      LIMIT 10
    `;

    const nextSongs = await new Promise((resolve, reject) => {
      worshipdb.query(nextSongsQuery, [songId], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    res.json({
      currentSong: currentSong,
      nextSongs: nextSongs
    });

  } catch (error) {
    console.error('Error getting next songs:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 다음곡 관리 - 다음곡 추가
router.post('/addnextsong', (req, res) => {
  const { currentSongId, nextSongId, order } = req.body;

  // next_songs 테이블이 없다면 생성
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS next_songs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      current_song_id INT NOT NULL,
      next_song_id INT NOT NULL,
      song_order INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_song_id) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (next_song_id) REFERENCES songs(id) ON DELETE CASCADE
    )
  `;

  worshipdb.query(createTableQuery, (error) => {
    if (error) {
      console.error('Error creating table:', error);
      return res.status(500).json({ error: 'Failed to create table' });
    }

    // 기존 순서가 있다면 업데이트, 없다면 새로 추가
    const upsertQuery = `
      INSERT INTO next_songs (current_song_id, next_song_id, song_order)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE song_order = VALUES(song_order)
    `;

    worshipdb.query(upsertQuery, [currentSongId, nextSongId, order], (error, result) => {
      if (error) {
        console.error('Error adding next song:', error);
        return res.status(500).json({ error: 'Failed to add next song' });
      }
      
      res.json({ success: true, message: 'Next song added successfully' });
    });
  });
});

// 다음곡 관리 - 다음곡 목록 가져오기
router.get('/getnextsongslist/:songId', async (req, res) => {
  const { songId } = req.params;

  try {
    const query = `
      SELECT ns.*, s.title, s.theme, s.image, s.source
      FROM next_songs ns
      JOIN songs s ON ns.next_song_id = s.id
      WHERE ns.current_song_id = ?
      ORDER BY ns.song_order ASC
    `;

    const nextSongs = await new Promise((resolve, reject) => {
      worshipdb.query(query, [songId], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    res.json({ nextSongs: nextSongs });

  } catch (error) {
    console.error('Error getting next songs list:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 다음곡 관리 - 다음곡 삭제
router.delete('/removenextsong/:currentSongId/:nextSongId', (req, res) => {
  const { currentSongId, nextSongId } = req.params;

  const deleteQuery = `
    DELETE FROM next_songs 
    WHERE current_song_id = ? AND next_song_id = ?
  `;

  worshipdb.query(deleteQuery, [currentSongId, nextSongId], (error, result) => {
    if (error) {
      console.error('Error removing next song:', error);
      return res.status(500).json({ error: 'Failed to remove next song' });
    }
    
    res.json({ success: true, message: 'Next song removed successfully' });
  });
});

// 작업내역 조회
router.get('/getsongcount', async (req, res) => {
  // reviseUser 필드가 없을 수 있으므로, 먼저 필드 존재 여부 확인 후 쿼리 실행
  try {
    // reviseUser 필드 존재 여부 확인
    const checkFieldQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'songs' 
      AND COLUMN_NAME = 'reviseUser'
    `;
    
    worshipdb.query(checkFieldQuery, (checkError, checkResult) => {
      if (checkError) {
        console.error('Field check error:', checkError);
        return res.status(500).send({ error: 'Database query failed', details: checkError.message });
      }
      
      const hasReviseUser = checkResult && checkResult.length > 0;
      
      if (!hasReviseUser) {
        // reviseUser 필드가 없으면 빈 배열 반환
        console.log('reviseUser field does not exist in songs table');
        return res.send([]);
      }
      
      // 사용자별 총 작업 건수만 조회
      const dataQuery = `
        SELECT 
          reviseUser AS saveUser, 
          COUNT(*) as count
        FROM songs
        WHERE reviseUser IS NOT NULL AND reviseUser != ''
        GROUP BY reviseUser
        ORDER BY count DESC, reviseUser
      `;
      
      worshipdb.query(dataQuery, (error, result) => {
        if (error) {
          console.error('Database query error:', error);
          return res.status(500).send({ error: 'Database query failed', details: error.message });
        }
        res.send(result || []);
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send({ error: 'Server error', details: error.message });
  }
});


module.exports = router;
