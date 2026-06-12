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
// [글로벌 미들웨어 및 필수 보안 설정 영역] - 최상단 배치
// ---------------------------------------------------------------------------------
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());

// CORS 설정: www 버전을 포함하여 크롬/엣지/웨일 브라우저의 도메인 오인 차단 원천 봉쇄! ⭐️
app.use(cors({
  origin: [
    'https://ministermore.co.kr', 
    'https://www.ministermore.co.kr', 
    'https://mmservice.co.kr',
    'https://www.mmservice.co.kr',
    'http://localhost:3000' // 로컬 개발 환경 유지
  ],
  credentials: true
}));

// Helmet 통합 완결판 CSP 및 COEP/CORP 통합 방화벽 해제 정책 (웨일 오작동 대응)
// mmservice의 app.js 내 helmet 설정을 아래 내용으로 최종 업데이트하세요.
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: false, 
      directives: {
        "default-src": ["'self'"],
        // 1. 카카오 우편번호 스크립트 도메인 완전 허용 ⭐️
        "script-src": [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://t1.daumcdn.net", 
          "https://*.daum.net",
          "https://*.kakao.com",          // ⚠️ 카카오 전체 스크립트 허용
          "https://*.kakaocdn.net",       
          "https://*.naver.com",          
          "https://*.ntruss.com",         
          "https://*.ncpcdn.com",         
          "https://*.pstatic.net",        
          "https://developers.kakao.com",  
          "https://static.nid.naver.com",
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
          "https://postcode.map.kakao.com",
          "https://postcode.map.daum.net",
          "https://*.tinymce.com",
          "https://*.tiny.cloud"
        ],
        // 2. 카카오 내부 API 통신 허용
        "connect-src": [
          "'self'", 
          "https://mmservice.co.kr", 
          "https://www.mmservice.co.kr",
          "https://ministermore.co.kr", 
          "https://www.ministermore.co.kr",
          "https://*.baroservice.com",     
          "https://*.kakao.com",          // ⚠️ 카카오 관련 통신 전면 허용
          "https://kauth.kakao.com",       
          "https://kapi.kakao.com",        
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
        "style-src": [
          "'self'", 
          "'unsafe-inline'",           
          "https://*.tinymce.com", 
          "https://*.tiny.cloud"
        ],
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
// [라우터 설정 영역] - 오리지널 라우터 100% 보존
// ---------------------------------------------------------------------------------
const ChurchbookletbookletsRouter = require('./routers/service/bookletNotice/ChurchMain');
const NoticeCreateBookletRouter = require('./routers/service/bookletNotice/NoticeCreateBooklet');
const EventMainRouter = require('./routers/service/bookletEvent/EventMain');
const EventCreateBookletRouter = require('./routers/service/bookletEvent/EventCreateBooklet');
const HomeinappMainRouter = require('./routers/service/homeinapp/HomeinappMain');
const BibleRouter = require('./routers/service/homeinapp/Bible');
const ServiceApplyRouter = require('./routers/service/serviceapply');
const DashboardRouter = require('./routers/dashboard/Dashboard');
const PaymentWebhookRouter = require('./routers/payments/PaymentWebhook');
const RetreatRouter = require('./routers/retreat/RetreatRouter');

app.use('/api/payments', PaymentWebhookRouter);
app.use('/v1/payments', PaymentWebhookRouter);
app.use('/bookletnoticemain', ChurchbookletbookletsRouter);
app.use('/bookletnoticecreate', NoticeCreateBookletRouter);
app.use('/bookleteventmain', EventMainRouter);
app.use('/bookleteventcreate', EventCreateBookletRouter);
app.use('/homeinappmain', HomeinappMainRouter);
app.use('/homeinappbible', BibleRouter);
app.use('/serviceapply', ServiceApplyRouter);
app.use('/api/dashboard', DashboardRouter);
app.use('/api/retreat', RetreatRouter);

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
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});

// ---------------------------------------------------------------------------------
// [서버 구동]
// ---------------------------------------------------------------------------------
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`mmservice server is running on port ${PORT}`);
});