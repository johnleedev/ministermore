require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https'); 
const app = express();

const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

// ---------------------------------------------------------------------------------
// [글로벌 미들웨어 설정 영역] - 최상단 배치
// ---------------------------------------------------------------------------------
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());

// CORS 설정: www 및 로컬 도메인 완벽 대응
app.use(cors({
  origin: [
    'https://ministermore.co.kr', 
    'https://www.ministermore.co.kr', 
    'https://mmservice.co.kr',
    'https://www.mmservice.co.kr',
    'http://localhost:3000'
  ],
  credentials: true
}));

// ⚠️ 기존의 app.use(helmet()); 은 절대로 중복 선언하면 안 됩니다.
// 아래의 정교한 통합 CSP 방화벽 하나만 단독으로 실행되어야 합니다.
app.use(
  helmet({
    // COEP/COOP — 카카오 우편번호 팝업(iframe)이 로드되지 않아 비활성화
    // localhost(CRA)에는 이 헤더가 없어 정상 동작, 배포 환경에서만 차단됨
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: false, // 기본값(default-src 'self')이 설정을 덮어쓰지 못하도록 완전히 차단 ⭐️
      directives: {
        // 기본 폴백 정책
        "default-src": ["'self'", "https://*.kakao.com", "https://*.daum.net", "https://*.naver.com"],
        
        // 1. 스크립트 실행 허용 (네이버, 카카오 최신 인프라, TinyMCE 완벽 개방) ⭐️
        "script-src": [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://t1.daumcdn.net", 
          "https://*.daum.net",
          "https://*.kakao.com",          
          "https://*.kakaocdn.net",       
          "https://*.naver.com",          
          "https://*.ntruss.com",         
          "https://*.ncpcdn.com",         
          "https://*.pstatic.net",        
          "https://developers.kakao.com",  
          "https://static.nid.naver.com",
          "https://stlog1-local.kakao.com",
          "https://*.tinymce.com",     
          "https://*.tiny.cloud"
        ],
        "script-src-elem": [
          "'self'", 
          "'unsafe-inline'", 
          "https://t1.daumcdn.net", 
          "https://*.daum.net",
          "https://*.kakao.com",          
          "https://*.kakaocdn.net",       
          "https://*.naver.com",
          "https://*.ntruss.com",
          "https://*.ncpcdn.com",
          "https://*.pstatic.net",
          "https://developers.kakao.com",
          "https://static.nid.naver.com",
          "https://postcode.map.kakao.com", // ⚠️ 연결을 거부했던 검색팝업 도메인 직접 추가!
          "https://postcode.map.daum.net",
          "https://*.tinymce.com",
          "https://*.tiny.cloud"
        ],
        
        // 2. 외부 데이터 통신 허용 (카카오 로그 수집 주소 포함)
        "connect-src": [
          "'self'", 
          "https://mmservice.co.kr", 
          "https://www.mmservice.co.kr",
          "https://ministermore.co.kr", 
          "https://www.ministermore.co.kr",
          "https://*.baroservice.com",     
          "https://kauth.kakao.com",       
          "https://kapi.kakao.com",        
          "https://*.kakao.com",           
          "https://stlog1-local.kakao.com", 
          "https://nid.naver.com",         
          "https://*.naver.com",          
          "https://*.ntruss.com",         
          "https://*.navercorp.com",      
          "https://*.tinymce.com",     
          "https://*.tiny.cloud",
          "https://api.ipify.org",         
          "https://www.yeplat.com",       
          "https://yeplat.com"            
        ],
        
        // 3. UI 스타일시트 허용
        "style-src": [
          "'self'", 
          "'unsafe-inline'",           
          "https://*.tinymce.com", 
          "https://*.tiny.cloud"
        ],
        
        // 4. 아이프레임 및 주소창 팝업 허용 ⭐️
        "child-src": [
          "'self'",
          "https://*.daum.net",
          "https://*.kakao.com",
          "https://*.kakaocdn.net",
          "https://postcode.map.kakao.com",
          "https://postcode.map.daum.net",
          "https://nid.naver.com",
          "https://*.tinymce.com",
          "https://*.tiny.cloud",
        ],
        "frame-src": [
          "'self'", 
          "https://*.daum.net", 
          "https://*.kakao.com",
          "https://*.kakaocdn.net",
          "https://postcode.map.kakao.com", 
          "https://postcode.map.daum.net",  
          "https://nid.naver.com",        
          "https://*.tinymce.com",     
          "https://*.tiny.cloud"
        ],
        
        // 5. 모든 외부 이미지 리소스 규제 완전 해제 (웨일 클린웹 대응 완결)
        "img-src": [
          "'self'", 
          "data:", 
          "blob:",
          "https:*",                     
          "http:*",                      
          "https://*.naver.com",          
          "https://*.naveropenapi.com", 
          "https://*.maps.naver.com", 
          "https://*.ntruss.com",         
          "https://ssl.pstatic.net",
          "https://*.pstatic.net",        
          "https://*.tinymce.com",
          "https://*.tiny.cloud"
        ],
        
        // 6. 폰트 및 아이콘 허용
        "font-src": [
          "'self'", 
          "data:", 
          "https://*.tinymce.com", 
          "https://*.tiny.cloud"
        ]
      },
    },
  })
);

// ---------------------------------------------------------------------------------
// [라우터 설정 영역]
// ---------------------------------------------------------------------------------
const LoginRouter = require('./routers/common/login');
const MypageRouter = require('./routers/common/Mypage');
const InquiryRouter = require('./routers/common/inquiry');
const PushNotificationRouter = require('./routers/common/pushNotification');
const AppControlRouter = require('./routers/common/appcontrol');
app.use('/login', LoginRouter);
app.use('/mypage', MypageRouter);
app.use('/inquiry', InquiryRouter);
app.use('/pushnotifi', PushNotificationRouter);
app.use('/appcontrol', AppControlRouter);

const ApiKakaonotifiRouter = require('./routers/api/KakaoNotifi');
app.use('/apikakaonotifi', ApiKakaonotifiRouter);

const RecruitMinisterRouter = require('./routers/recruit/RecruitMinister');
const RecruitChurchRouter = require('./routers/recruit/RecruitChurch');
const RecruitInstituteRouter = require('./routers/recruit/RecruitInstitute');
const RecruitWork = require('./routers/recruit/RecruitWork');
app.use('/recruitminister', RecruitMinisterRouter);
app.use('/recruitchurch', RecruitChurchRouter);
app.use('/recruitinstitute', RecruitInstituteRouter);
app.use('/recruitwork', RecruitWork);

const MinisterRouter = require('./routers/minister/Minister');
app.use('/minister', MinisterRouter);

const MinisterEditRouter = require('./routers/minister/MinisterEdit');
app.use('/ministeredit', MinisterEditRouter);

const SongsRouter = require('./routers/worship/Songs');
app.use('/worshipsongs', SongsRouter);
const SongWorkRouter = require('./routers/worship/SongWork');
app.use('/worshipsongswork', SongWorkRouter);

const ResumeRouter = require('./routers/resume/Resume');
app.use('/resume', ResumeRouter);

const RetreatPlaceRouter = require('./routers/retreat/Place');
const RetreatReviewRouter = require('./routers/retreat/Review');
const RetreatUpgradeRouter = require('./routers/retreat/Upgrade');
const RetreatCastingRouter = require('./routers/retreat/Casting');
app.use('/retreat', RetreatPlaceRouter);
app.use('/retreatreview', RetreatReviewRouter);
app.use('/retreatupgrade', RetreatUpgradeRouter);
app.use('/retreatcasting', RetreatCastingRouter);

const NoticeBoardRouter = require('./routers/board/NoticeBoard');
const UsedBoardRouter = require('./routers/board/UsedBoard');
const FreeBoardRouter = require('./routers/board/FreeBoard');
const EventsBoardRouter = require('./routers/board/EventsBoard');
app.use('/noticeboard', NoticeBoardRouter);
app.use('/usedboard', UsedBoardRouter);
app.use('/freeboard', FreeBoardRouter);
app.use('/eventsboard', EventsBoardRouter);

const ChurchesRouter = require('./routers/rollbook/Churches');
const DepartmentsRouter = require('./routers/rollbook/Departments');
const SmallgroupsRouter = require('./routers/rollbook/Smallgroups');
const LeadersRouter = require('./routers/rollbook/Leaders');
const AttendanceRouter = require('./routers/rollbook/Attendance');
app.use('/rollbookchurch', ChurchesRouter);
app.use('/rollbookdepart', DepartmentsRouter);
app.use('/rollbookgroup', SmallgroupsRouter);
app.use('/rollbookleaders', LeadersRouter);
app.use('/rollbookattendance', AttendanceRouter);

const AdminStatisticsRouter = require('./routers/admin/AdminStatistics');
const AdminUserRouter = require('./routers/admin/AdminUser');
app.use('/admin', AdminStatisticsRouter);
app.use('/adminuser', AdminUserRouter);

const PortoneBillingRouter = require('./routers/payment/PortoneBilling');
const PortoneRequestPayRouter = require('./routers/payment/PortoneRequestPay');
const PaymentRecordRouter = require('./routers/payment/PaymentRecord');
const ServiceApplyRouter = require('./routers/service/serviceapply');
app.use('/paymentbilling', PortoneBillingRouter);
app.use('/paymentrequestpay', PortoneRequestPayRouter);
app.use('/payment', PaymentRecordRouter);
app.use('/serviceapply', ServiceApplyRouter);

// 네이버 지도 스크립트 프록시 라우터
app.get('/naver-maps.js', (req, res) => {
  const query = req.url.includes('?') ? req.url.split('?')[1] : '';
  const targetUrl = `https://oapi.map.naver.com/openapi/v3/maps.js${query ? `?${query}` : ''}`;
  res.setHeader('Content-Type', 'application/javascript');
  https.get(targetUrl, (upstream) => {
    if (upstream.statusCode && upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      https.get(upstream.headers.location, (redirected) => { redirected.pipe(res); })
           .on('error', (err) => { res.status(502).end(`// Error: ${err.message}`); });
      return;
    }
    upstream.pipe(res);
  }).on('error', (err) => { res.status(502).end(`// Error: ${err.message}`); });
});

// ---------------------------------------------------------------------------------
// [리액트 정적 파일 빌드 연결 영역]
// ---------------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '/build')));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

app.listen(8000, () => {
  console.log('ministermore server is running on port 8000');
});