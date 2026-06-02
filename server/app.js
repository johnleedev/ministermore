const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const { commondb } = require('./routers/dbdatas/commondb');

var bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
var cors = require('cors');

// 라우터들
const LoginRouter = require('./routers/common/login');
const MypageRouter = require('./routers/common/Mypage');
const PushNotificationRouter = require('./routers/common/pushNotification');
app.use('/login', LoginRouter);
app.use('/mypage', MypageRouter);
app.use('/pushnotifi', PushNotificationRouter);

// const HolyssumRouter = require('./routers/holyssum/holyssum');
// app.use('/holyssum', HolyssumRouter);

const RecruitMinisterRouter = require('./routers/recruit/RecruitMinister');
const RecruitChurchRouter = require('./routers/recruit/RecruitChurch');
const RecruitInstituteRouter = require('./routers/recruit/RecruitInstitute');
const RecruitWorkRouter = require('./routers/recruit/RecruitWork');
app.use('/recruitminister', RecruitMinisterRouter);
app.use('/recruitchurch', RecruitChurchRouter);
app.use('/recruitinstitute', RecruitInstituteRouter);
app.use('/recruitwork', RecruitWorkRouter);


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


var NoticeBoardRouter = require('./routers/board/NoticeBoard');
var UsedBoardRouter = require('./routers/board/UsedBoard');
var FreeBoardRouter = require('./routers/board/FreeBoard');
var EventsBoardRouter = require('./routers/board/EventsBoard');
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


const ChurchbookletbookletsRouter = require('./routers/service/bookletNotice/ChurchMain');
const NoticeCreateBookletRouter = require('./routers/service/bookletNotice/NoticeCreateBooklet');
const EventMainRouter = require('./routers/service/bookletEvent/EventMain');
const EventCreateBookletRouter = require('./routers/service/bookletEvent/EventCreateBooklet');
const BulletinMainRouter = require('./routers/service/bulletin/BulletinMain');
const BulletinCreateRouter = require('./routers/service/bulletin/BulletinCreate');
const HomeinappMainRouter = require('./routers/service/homeinapp/HomeinappMain');
const BibleRouter = require('./routers/service/homeinapp/Bible');
const ServiceApplyRouter = require('./routers/service/serviceapply');
const PortoneBillingRouter = require('./routers/payment/PortoneBilling');
const PortoneRequestPayRouter = require('./routers/payment/PortoneRequestPay');
app.use('/bookletnoticemain', ChurchbookletbookletsRouter);
app.use('/bookletnoticecreate', NoticeCreateBookletRouter);
app.use('/bookleteventmain', EventMainRouter);
app.use('/bookleteventcreate', EventCreateBookletRouter);
app.use('/bulletinmain', BulletinMainRouter);
app.use('/bulletincreate', BulletinCreateRouter);
app.use('/homeinappmain', HomeinappMainRouter);
app.use('/homeinappbible', BibleRouter);
app.use('/serviceapply', ServiceApplyRouter);

app.use('/paymentbilling', PortoneBillingRouter);
app.use('/paymentrequestpay', PortoneRequestPayRouter);


const AdminStatisticsRouter = require('./routers/admin/AdminStatistics');
const AdminUserRouter = require('./routers/admin/AdminUser');
const AdminTodosRouter = require('./routers/admin/AdminTodos');
const FinanceRouter = require('./routers/admin/FinanceRouter');
const {
  employeeRouter: AdminAttendanceEmployeeRouter,
  adminRouter: AdminAttendanceAdminRouter,
} = require('./routers/admin/AdminAttendance');
const { startFinanceRecurringScheduler } = require('./routers/admin/financeRecurringScheduler');
app.use('/admin', AdminStatisticsRouter);
app.use('/adminuser', AdminUserRouter);
app.use('/admintodos', AdminTodosRouter);
app.use('/api', FinanceRouter);
app.use('/api/admin', AdminTodosRouter);
app.use('/api/admin', AdminAttendanceAdminRouter);
app.use('/api/attendance', AdminAttendanceEmployeeRouter);

startFinanceRecurringScheduler();

app.use(express.static('build'));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());
app.use(helmet());
app.use(cors());
// Proxy Naver Maps script to serve from same-origin to satisfy strict CSP
app.get('/naver-maps.js', (req, res) => {
  const query = req.url.includes('?') ? req.url.split('?')[1] : '';
  const targetUrl = `https://oapi.map.naver.com/openapi/v3/maps.js${query ? `?${query}` : ''}`;

  res.setHeader('Content-Type', 'application/javascript');

  https
    .get(targetUrl, (upstream) => {
      if (upstream.statusCode && upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
        // Handle redirects just in case
        https.get(upstream.headers.location, (redirected) => {
          redirected.pipe(res);
        }).on('error', (err) => {
          res.status(502).end(`// Failed to fetch redirected script: ${err.message}`);
        });
        return;
      }
      upstream.pipe(res);
    })
    .on('error', (err) => {
      res.status(502).end(`// Failed to fetch script: ${err.message}`);
    });
});

app.listen(8000, ()=>{
  console.log('server is running')
});





// 리액트 연결하기 ----------------------------------------------------------------- //

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


