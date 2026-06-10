require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());
app.use(helmet());
app.use(cors());

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

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`mmservice server is running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, '/build')));
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});
