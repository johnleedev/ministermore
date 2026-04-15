const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const { resumedb } = require('../dbdatas/resumedb');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
const multer  = require('multer')
var fs = require("fs");
const axios = require('axios');

const escapeQuotes = (str) => str.replaceAll('è', '\è').replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');

// 프로필 이미지 저장 미들웨어
const storage = multer.diskStorage({
  destination(req, file, done) { 
    done(null, 'build/images/resume/profile');
  }, 
  filename(req, file, done) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    done(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    // 허용된 MIME 타입
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    // 허용된 확장자
    const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
    
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    const extname = allowedExtensions.test(file.originalname);
    
    // MIME 타입 또는 확장자 중 하나라도 일치하면 허용
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다. (JPG, PNG, GIF)'));
    }
  }
});

// 디렉토리가 없으면 생성
const profileImageDir = 'build/images/resume/profile';
if (!fs.existsSync(profileImageDir)) {
  fs.mkdirSync(profileImageDir, { recursive: true });
}

// 이력서 저장
router.post('/saveresume', upload.single('profileImage'), (req, res) => {
  try {
    const {
      userAccount,
      title,
      name,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      ageText,
      phone,
      email,
      address,
      addressDetail,
      educationItems,
      careerItems,
      hopeInfo,
      signWriter,
      saveDate
    } = req.body;

    // 희망사항 정보 파싱
    let parsedHopeInfo = {
      hopeType: '',
      hopeLocation: '',
      hopeSalary: '',
      hopeSalaryPaySort: '월',
      hopeRoles: '',
      hopeDepartment: '',
      hopeInsurance: '',
      hopeWelfare: ''
    };

    if (hopeInfo) {
      try {
        parsedHopeInfo = typeof hopeInfo === 'string' ? JSON.parse(hopeInfo) : hopeInfo;
      } catch (error) {
        console.error('hopeInfo 파싱 오류:', error);
      }
    }

    if (!userAccount || !name || !phone || !email) {
      return res.status(400).send({ 
        success: false, 
        error: '필수 입력 항목이 누락되었습니다. (이름, 휴대폰, 이메일)' 
      });
    }

    // 파일명 처리
    let profileImageName = '';
    if (req.file) {
      profileImageName = req.file.filename;
    }

    // JSON 문자열 파싱
    const educationItemsParsed = educationItems ? JSON.parse(educationItems) : [];
    const careerItemsParsed = careerItems ? JSON.parse(careerItems) : [];

    // 이력서 데이터 삽입
    const insertQuery = `
      INSERT INTO resumeData (
        userAccount, title, name, gender, birthYear, birthMonth, birthDay, ageText,
        phone, email, address, addressDetail, profileImage,
        educationItems, careerItems, hopeInfo,
        signWriter, saveDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userAccount,
      escapeQuotes(title || ''),
      escapeQuotes(name || ''),
      gender || '',
      birthYear || '',
      birthMonth || '',
      birthDay || '',
      ageText || '',
      phone || '',
      email || '',
      escapeQuotes(address || ''),
      escapeQuotes(addressDetail || ''),
      profileImageName,
      JSON.stringify(educationItemsParsed),
      JSON.stringify(careerItemsParsed),
      JSON.stringify(parsedHopeInfo),
      escapeQuotes(signWriter || ''),
      saveDate || new Date().toISOString().split('T')[0]
    ];

    resumedb.query(insertQuery, values, (error, result) => {
      if (error) {
        console.error('이력서 저장 오류:', error);
        // 업로드된 파일이 있으면 삭제
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).send({ 
          success: false, 
          error: '데이터베이스 저장에 실패했습니다.' 
        });
      }
      
      res.send({ 
        success: true, 
        resumeId: result.insertId 
      });
    });
  } catch (error) {
    console.error('이력서 저장 처리 오류:', error);
    // 업로드된 파일이 있으면 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    });
  }
});

// 이력서 수정
router.post('/updateresume', upload.single('profileImage'), (req, res) => {
  try {
    const {
      resumeId,
      userAccount,
      title,
      name,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      ageText,
      phone,
      email,
      address,
      addressDetail,
      educationItems,
      careerItems,
      hopeInfo,
      signWriter,
      saveDate
    } = req.body;

    // 희망사항 정보 파싱
    let parsedHopeInfo = {
      hopeType: '',
      hopeLocation: '',
      hopeSalary: '',
      hopeSalaryPaySort: '월',
      hopeRoles: '',
      hopeDepartment: '',
      hopeInsurance: '',
      hopeWelfare: ''
    };

    if (hopeInfo) {
      try {
        parsedHopeInfo = typeof hopeInfo === 'string' ? JSON.parse(hopeInfo) : hopeInfo;
      } catch (error) {
        console.error('hopeInfo 파싱 오류:', error);
      }
    }

    if (!resumeId || !userAccount) {
      return res.status(400).send({ 
        success: false, 
        error: '이력서 ID와 사용자 계정이 필요합니다.' 
      });
    }

    if (!name || !phone || !email) {
      return res.status(400).send({ 
        success: false, 
        error: '필수 입력 항목이 누락되었습니다. (이름, 휴대폰, 이메일)' 
      });
    }

    // JSON 문자열 파싱
    const educationItemsParsed = educationItems ? JSON.parse(educationItems) : [];
    const careerItemsParsed = careerItems ? JSON.parse(careerItems) : [];

    // 기존 이력서 정보 조회 (기존 이미지 파일명 확인용)
    resumedb.query(
      'SELECT profileImage FROM resumeData WHERE id = ? AND userAccount = ?',
      [resumeId, userAccount],
      (error, results) => {
        if (error) {
          console.error('이력서 조회 오류:', error);
          return res.status(500).send({ 
            success: false, 
            error: '이력서 조회에 실패했습니다.' 
          });
        }

        if (results.length === 0) {
          // 업로드된 파일이 있으면 삭제
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(404).send({ 
            success: false, 
            error: '이력서를 찾을 수 없습니다.' 
          });
        }

        const oldProfileImage = results[0].profileImage;
        let profileImageName = oldProfileImage; // 기본값은 기존 이미지

        // 새 이미지가 업로드된 경우
        if (req.file) {
          profileImageName = req.file.filename;
          // 기존 이미지 파일 삭제
          if (oldProfileImage) {
            const oldImagePath = `build/images/resume/profile/${oldProfileImage}`;
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }

        // 이력서 데이터 업데이트
        const updateQuery = `
          UPDATE resumeData SET 
            title = ?, name = ?, gender = ?, birthYear = ?, birthMonth = ?, birthDay = ?, ageText = ?,
            phone = ?, email = ?, address = ?, addressDetail = ?, profileImage = ?,
            educationItems = ?, careerItems = ?, hopeInfo = ?,
            signWriter = ?, saveDate = ?
          WHERE id = ? AND userAccount = ?
        `;

        const values = [
          escapeQuotes(title || ''),
          escapeQuotes(name || ''),
          gender || '',
          birthYear || '',
          birthMonth || '',
          birthDay || '',
          ageText || '',
          phone || '',
          email || '',
          escapeQuotes(address || ''),
          escapeQuotes(addressDetail || ''),
          profileImageName,
          JSON.stringify(educationItemsParsed),
          JSON.stringify(careerItemsParsed),
          JSON.stringify(parsedHopeInfo),
          escapeQuotes(signWriter || ''),
          saveDate || new Date().toISOString().split('T')[0],
          resumeId,
          userAccount
        ];

        resumedb.query(updateQuery, values, (updateError, updateResult) => {
          if (updateError) {
            console.error('이력서 수정 오류:', updateError);
            // 업로드된 새 파일이 있으면 삭제
            if (req.file && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(500).send({ 
              success: false, 
              error: '데이터베이스 수정에 실패했습니다.' 
            });
          }

          if (updateResult.affectedRows === 0) {
            // 업로드된 새 파일이 있으면 삭제
            if (req.file && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(404).send({ 
              success: false, 
              error: '수정할 이력서를 찾을 수 없습니다.' 
            });
          }

          res.send({ 
            success: true, 
            resumeId: resumeId 
          });
        });
      }
    );
  } catch (error) {
    console.error('이력서 수정 처리 오류:', error);
    // 업로드된 파일이 있으면 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    });
  }
});

// 사용자의 이력서 목록 조회
router.get('/getresumelist/:userAccount', (req, res) => {
  const userAccount = req.params.userAccount;
  
  if (!userAccount) {
    return res.status(400).send({ 
      success: false, 
      error: '사용자 계정이 필요합니다.' 
    });
  }

  const query = `
    SELECT id, userAccount, title, name, saveDate, updatedAt, createdAt
    FROM resumeData 
    WHERE userAccount = ?
    ORDER BY updatedAt DESC, id DESC
  `;

  resumedb.query(query, [userAccount], (error, result) => {
    if (error) {
      console.error('이력서 목록 조회 오류:', error);
      return res.status(500).send({ 
        success: false, 
        error: '이력서 목록 조회에 실패했습니다.' 
      });
    }
    
    // 결과를 ResumeList.tsx에서 사용하는 형식으로 변환
    const resumeList = result.map((row) => ({
      id: String(row.id),
      title: row.title || row.name || '제목 없음',
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('ko-KR') : 
                row.saveDate || new Date(row.createdAt).toLocaleDateString('ko-KR')
    }));

    res.send({ 
      success: true, 
      resumeList: resumeList 
    });
  });
});

// 이력서 상세 조회
router.get('/getresume/:resumeId', (req, res) => {
  const resumeId = req.params.resumeId;
  const userAccount = req.query.userAccount;

  if (!resumeId || !userAccount) {
    return res.status(400).send({ 
      success: false, 
      error: '이력서 ID와 사용자 계정이 필요합니다.' 
    });
  }

  const query = `
    SELECT * FROM resumeData 
    WHERE id = ? AND userAccount = ?
  `;

  resumedb.query(query, [resumeId, userAccount], (error, result) => {
    if (error) {
      console.error('이력서 조회 오류:', error);
      return res.status(500).send({ 
        success: false, 
        error: '이력서 조회에 실패했습니다.' 
      });
    }

    if (result.length === 0) {
      return res.status(404).send({ 
        success: false, 
        error: '이력서를 찾을 수 없습니다.' 
      });
    }

    const resume = result[0];
    
    // JSON 필드 파싱
    try {
      if (resume.educationItems) {
        resume.educationItems = JSON.parse(resume.educationItems);
      }
      if (resume.careerItems) {
        resume.careerItems = JSON.parse(resume.careerItems);
      }
      if (resume.hopeInfo) {
        const parsedHopeInfo = JSON.parse(resume.hopeInfo);
        // 기존 개별 필드 형식과의 호환성을 위해 개별 필드로도 설정
        resume.hopeType = parsedHopeInfo.hopeType || '';
        resume.hopeLocation = parsedHopeInfo.hopeLocation || '';
        resume.hopeSalary = parsedHopeInfo.hopeSalary || '';
        resume.hopeSalaryPaySort = parsedHopeInfo.hopeSalaryPaySort || '월';
        resume.hopeRoles = parsedHopeInfo.hopeRoles || '';
        resume.hopeDepartment = parsedHopeInfo.hopeDepartment || '';
        resume.hopeInsurance = parsedHopeInfo.hopeInsurance || '';
        resume.hopeWelfare = parsedHopeInfo.hopeWelfare || '';
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
    }

    res.send({ 
      success: true, 
      resume: resume 
    });
  });
});

// 이력서 삭제
router.post('/deleteresume', (req, res) => {
  const { resumeId, userAccount } = req.body;

  if (!resumeId || !userAccount) {
    return res.status(400).send({ 
      success: false, 
      error: '이력서 ID와 사용자 계정이 필요합니다.' 
    });
  }

  // 먼저 프로필 이미지 파일명 조회
  resumedb.query(
    'SELECT profileImage FROM resumeData WHERE id = ? AND userAccount = ?',
    [resumeId, userAccount],
    (error, results) => {
      if (error) {
        console.error('이력서 조회 오류:', error);
        return res.status(500).send({ 
          success: false, 
          error: '이력서 조회에 실패했습니다.' 
        });
      }

      if (results.length === 0) {
        return res.status(404).send({ 
          success: false, 
          error: '이력서를 찾을 수 없습니다.' 
        });
      }

      const profileImage = results[0].profileImage;

      // 이력서 삭제
      resumedb.query(
        'DELETE FROM resumeData WHERE id = ? AND userAccount = ?',
        [resumeId, userAccount],
        (deleteError, deleteResult) => {
          if (deleteError) {
            console.error('이력서 삭제 오류:', deleteError);
            return res.status(500).send({ 
              success: false, 
              error: '이력서 삭제에 실패했습니다.' 
            });
          }

          if (deleteResult.affectedRows === 0) {
            return res.status(404).send({ 
              success: false, 
              error: '이력서를 찾을 수 없습니다.' 
            });
          }

          // 프로필 이미지 파일 삭제
          if (profileImage) {
            const imagePath = `build/images/resume/profile/${profileImage}`;
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
              } catch (unlinkError) {
                console.error('이미지 파일 삭제 오류:', unlinkError);
              }
            }
          }

          res.send({ 
            success: true 
          });
        }
      );
    }
  );
});

module.exports = router;
