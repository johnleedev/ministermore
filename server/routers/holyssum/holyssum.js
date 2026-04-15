const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
router.use(express.json());
const { holyssumdb } = require('../dbdatas/holyssumdb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// holyssum_reviews 테이블 자동 생성
holyssumdb.query(`
  CREATE TABLE IF NOT EXISTS holyssum_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(100),
    name VARCHAR(100),
    contact VARCHAR(100),
    rank1 VARCHAR(100),
    rank2 VARCHAR(100),
    rank3 VARCHAR(100),
    satisfaction_score INT,
    memorable_order TEXT,
    venue_feedback TEXT,
    conversation_feedback TEXT,
    join_next_meeting VARCHAR(10),
    receive_news VARCHAR(10),
    recommend VARCHAR(10),
    improvement_suggestions TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`, (err) => { if (err) console.error('holyssum_reviews table init:', err); });

// holyssum_memos 테이블 자동 생성
holyssumdb.query(`
  CREATE TABLE IF NOT EXISTS holyssum_memos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    writer_id INT NOT NULL,
    target_id INT NOT NULL,
    memo TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_writer_target (writer_id, target_id)
  )
`, (err) => { if (err) console.error('holyssum_memos table init:', err); });

// 프로필 목록 조회 (성별 필터: ?gender=남자 또는 ?gender=여자)
router.get('/list', async (req, res) => {
  const { gender } = req.query;
  try {
    let query = `SELECT id, nickname, gender FROM holyssum_profiles`;
    const params = [];
    if (gender === '남자' || gender === '여자') {
      query += ` WHERE gender = ?`;
      params.push(gender);
    }
    query += ` ORDER BY updatedAt DESC`;
    holyssumdb.query(query, params, (error, result) => {
      if (error) {
        console.error('holyssum list error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, resultData: result || [] });
    });
  } catch (err) {
    console.error('holyssum list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 닉네임+비번 확인 후 프로필 반환 (리스트 진입용)
router.post('/verify', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password || String(password).length !== 4) {
    return res.status(400).json({ success: false, error: '닉네임과 비밀번호(4자리)를 입력해 주세요.' });
  }
  try {
    const query = `SELECT id, nickname, gender FROM holyssum_profiles WHERE nickname = ? AND password = ?`;
    const pwdStr = String(password).replace(/\D/g, '').slice(0, 4).padStart(4, '0');
    holyssumdb.query(query, [nickname.trim(), pwdStr], (error, result) => {
      if (error) {
        console.error('holyssum verify error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      if (!result || result.length === 0) {
        return res.status(401).json({ success: false, error: '닉네임 또는 비밀번호가 일치하지 않습니다.' });
      }
      res.json({ success: true, resultData: result[0] });
    });
  } catch (err) {
    console.error('holyssum verify:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 프로필 상세 조회
router.get('/detail/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `SELECT * FROM holyssum_profiles WHERE id = ?`;
    holyssumdb.query(query, [id], (error, result) => {
      if (error) {
        console.error('holyssum detail error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, error: '프로필을 찾을 수 없습니다.' });
      }
      const row = result[0];
      delete row.password;
      res.json({ success: true, resultData: row });
    });
  } catch (err) {
    console.error('holyssum detail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 프로필 저장 (생성/수정)
router.post('/save', async (req, res) => {
  const {
    id,
    userAccount,
    nickname,
    password,
    gender,
    age,
    occupation,
    residence,
    mbti,
    hobbies,
    idealPriority,
    idealPlace,
    disposition,
    dateStyle,
    partnerActivity,
    comfortSong,
    faithPriority,
  } = req.body;

  const disp = typeof disposition === 'string' ? disposition : JSON.stringify(disposition || []);
  const dStyle = typeof dateStyle === 'string' ? dateStyle : JSON.stringify(dateStyle || []);
  const pActivity = typeof partnerActivity === 'string' ? partnerActivity : JSON.stringify(partnerActivity || []);
  const fPriority = typeof faithPriority === 'string' ? faithPriority : JSON.stringify(faithPriority || []);

  const pwd = password != null ? String(password).replace(/\D/g, '').slice(0, 4).padStart(4, '0') : null;

  try {
    if (id) {
      // 수정 - 비밀번호 변경 가능
      const updateQuery = `
        UPDATE holyssum_profiles SET 
          userAccount = ?, nickname = ?, password = COALESCE(?, password), gender = ?,
          age = ?, occupation = ?, residence = ?, mbti = ?, hobbies = ?,
          idealPriority = ?, idealPlace = ?,
          disposition = ?, dateStyle = ?, partnerActivity = ?, comfortSong = ?, faithPriority = ?
        WHERE id = ?
      `;
      holyssumdb.query(
        updateQuery,
        [userAccount || null, nickname || '', pwd, gender || null, age || '', occupation || '', residence || '', mbti || '', hobbies || '', idealPriority || '', idealPlace || '', disp, dStyle, pActivity, comfortSong || '', fPriority, id],
        (error, result) => {
          if (error) {
            console.error('holyssum update error:', error);
            return res.status(500).json({ success: false, error: error.message });
          }
          res.json({ success: true, id: parseInt(id, 10) });
        }
      );
    } else {
      // 생성 - 비밀번호 필수
      if (!pwd || pwd.length !== 4) {
        return res.status(400).json({ success: false, error: '비밀번호 4자리를 입력해 주세요.' });
      }
      const insertQuery = `
        INSERT INTO holyssum_profiles (userAccount, nickname, password, gender, age, occupation, residence, mbti, hobbies, idealPriority, idealPlace, disposition, dateStyle, partnerActivity, comfortSong, faithPriority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      holyssumdb.query(
        insertQuery,
        [userAccount || null, nickname || '', pwd, gender || null, age || '', occupation || '', residence || '', mbti || '', hobbies || '', idealPriority || '', idealPlace || '', disp, dStyle, pActivity, comfortSong || '', fPriority],
        (error, result) => {
          if (error) {
            console.error('holyssum insert error:', error);
            return res.status(500).json({ success: false, error: error.message });
          }
          res.json({ success: true, id: result.insertId });
        }
      );
    }
  } catch (err) {
    console.error('holyssum save:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 메모 목록 조회 (writerId=내 프로필 id)
router.get('/memos/list', async (req, res) => {
  const { writerId } = req.query;
  if (!writerId) {
    return res.status(400).json({ success: false, error: 'writerId가 필요합니다.' });
  }
  try {
    const query = `
      SELECT m.id, m.target_id AS targetId, p.nickname AS targetNickname, m.memo
      FROM holyssum_memos m
      LEFT JOIN holyssum_profiles p ON p.id = m.target_id
      WHERE m.writer_id = ?
      ORDER BY p.nickname ASC
    `;
    holyssumdb.query(query, [writerId], (error, result) => {
      if (error) {
        console.error('holyssum memos list error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, resultData: result || [] });
    });
  } catch (err) {
    console.error('holyssum memos list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 메모 저장 (writerId, targetId, memo)
router.post('/memos/save', async (req, res) => {
  const { writerId, targetId, memo } = req.body;
  if (!writerId || !targetId) {
    return res.status(400).json({ success: false, error: 'writerId와 targetId가 필요합니다.' });
  }
  try {
    const memoStr = typeof memo === 'string' ? memo : (memo || '');
    const query = `
      INSERT INTO holyssum_memos (writer_id, target_id, memo, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE memo = ?, updatedAt = NOW()
    `;
    holyssumdb.query(query, [writerId, targetId, memoStr, memoStr], (error, result) => {
      if (error) {
        console.error('holyssum memos save error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true });
    });
  } catch (err) {
    console.error('holyssum memos save:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 후기 목록 조회 (전체)
router.get('/reviews/list', async (req, res) => {
  try {
    const query = `SELECT * FROM holyssum_reviews ORDER BY createdAt DESC`;
    holyssumdb.query(query, [], (error, result) => {
      if (error) {
        console.error('holyssum reviews list error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, resultData: result || [] });
    });
  } catch (err) {
    console.error('holyssum reviews list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 내 후기 조회 (profileId로 본인 확인 - 해당 프로필의 닉네임으로 등록된 후기 반환)
router.get('/reviews/my', async (req, res) => {
  const { profileId } = req.query;
  if (!profileId) {
    return res.status(400).json({ success: false, error: 'profileId가 필요합니다.' });
  }
  try {
    holyssumdb.query(`SELECT nickname FROM holyssum_profiles WHERE id = ?`, [profileId], (err, profileResult) => {
      if (err) {
        console.error('holyssum reviews my profile error:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!profileResult || profileResult.length === 0) {
        return res.status(404).json({ success: false, error: '프로필을 찾을 수 없습니다.' });
      }
      const nickname = profileResult[0].nickname;
      holyssumdb.query(
        `SELECT * FROM holyssum_reviews WHERE nickname = ? ORDER BY createdAt DESC LIMIT 1`,
        [nickname],
        (error, result) => {
          if (error) {
            console.error('holyssum reviews my error:', error);
            return res.status(500).json({ success: false, error: error.message });
          }
          res.json({ success: true, resultData: result && result[0] ? result[0] : null });
        }
      );
    });
  } catch (err) {
    console.error('holyssum reviews my:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 후기 수정 (profileId로 본인 확인 - 자기가 등록한 후기만 수정 가능)
router.post('/reviews/update', async (req, res) => {
  const {
    profileId,
    nickname, name, contact,
    rank1, rank2, rank3,
    satisfactionScore, memorableOrder, venueFeedback, conversationFeedback,
    joinNextMeeting, receiveNews, recommend,
    improvementSuggestions,
  } = req.body;
  if (!profileId) {
    return res.status(400).json({ success: false, error: 'profileId가 필요합니다.' });
  }
  try {
    holyssumdb.query(`SELECT nickname FROM holyssum_profiles WHERE id = ?`, [profileId], (err, profileResult) => {
      if (err) {
        console.error('holyssum reviews update profile error:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!profileResult || profileResult.length === 0) {
        return res.status(404).json({ success: false, error: '프로필을 찾을 수 없습니다.' });
      }
      const myNickname = profileResult[0].nickname;
      if (!myNickname || nickname !== myNickname) {
        return res.status(403).json({ success: false, error: '본인이 등록한 후기만 수정할 수 있습니다.' });
      }
      const query = `
        UPDATE holyssum_reviews SET
          name = ?, contact = ?,
          rank1 = ?, rank2 = ?, rank3 = ?,
          satisfaction_score = ?, memorable_order = ?, venue_feedback = ?, conversation_feedback = ?,
          join_next_meeting = ?, receive_news = ?, recommend = ?,
          improvement_suggestions = ?,
          updatedAt = NOW()
        WHERE nickname = ?
      `;
      holyssumdb.query(query, [
        name || '', contact || '',
        rank1 || '', rank2 || '', rank3 || '',
        satisfactionScore != null ? parseInt(satisfactionScore, 10) : null,
        memorableOrder || '', venueFeedback || '', conversationFeedback || '',
        joinNextMeeting || '', receiveNews || '', recommend || '',
        improvementSuggestions || '',
        myNickname,
      ], (error, result) => {
        if (error) {
          console.error('holyssum reviews update error:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true });
      });
    });
  } catch (err) {
    console.error('holyssum reviews update:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 후기 저장
router.post('/reviews/save', async (req, res) => {
  const {
    nickname, name, contact,
    rank1, rank2, rank3,
    satisfactionScore, memorableOrder, venueFeedback, conversationFeedback,
    joinNextMeeting, receiveNews, recommend,
    improvementSuggestions,
  } = req.body;
  try {
    const query = `
      INSERT INTO holyssum_reviews (
        nickname, name, contact,
        rank1, rank2, rank3,
        satisfaction_score, memorable_order, venue_feedback, conversation_feedback,
        join_next_meeting, receive_news, recommend,
        improvement_suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    holyssumdb.query(query, [
      nickname || '', name || '', contact || '',
      rank1 || '', rank2 || '', rank3 || '',
      satisfactionScore != null ? parseInt(satisfactionScore, 10) : null,
      memorableOrder || '', venueFeedback || '', conversationFeedback || '',
      joinNextMeeting || '', receiveNews || '', recommend || '',
      improvementSuggestions || '',
    ], (error, result) => {
      if (error) {
        console.error('holyssum reviews save error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, id: result.insertId });
    });
  } catch (err) {
    console.error('holyssum reviews save:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 프로필 삭제 (본인 확인: id + 비밀번호 4자리) - 본인이 작성한 메모도 함께 삭제
router.delete('/delete', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password || String(password).length !== 4) {
    return res.status(400).json({ success: false, error: '프로필 ID와 비밀번호(4자리)를 입력해 주세요.' });
  }
  const pwdStr = String(password).replace(/\D/g, '').slice(0, 4).padStart(4, '0');
  try {
    holyssumdb.query(`SELECT id FROM holyssum_profiles WHERE id = ? AND password = ?`, [id, pwdStr], (verifyErr, verifyResult) => {
      if (verifyErr) {
        console.error('holyssum delete verify error:', verifyErr);
        return res.status(500).json({ success: false, error: verifyErr.message });
      }
      if (!verifyResult || verifyResult.length === 0) {
        return res.status(401).json({ success: false, error: '비밀번호가 일치하지 않거나 프로필을 찾을 수 없습니다.' });
      }
      holyssumdb.query(`DELETE FROM holyssum_memos WHERE writer_id = ?`, [id], (memoErr) => {
        if (memoErr) console.error('holyssum delete memos error:', memoErr);
        holyssumdb.query(`DELETE FROM holyssum_profiles WHERE id = ? AND password = ?`, [id, pwdStr], (error, result) => {
          if (error) {
            console.error('holyssum delete error:', error);
            return res.status(500).json({ success: false, error: error.message });
          }
          res.json({ success: true });
        });
      });
    });
  } catch (err) {
    console.error('holyssum delete:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
