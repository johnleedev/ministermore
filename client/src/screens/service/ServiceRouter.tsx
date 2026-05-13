import { Routes, Route } from 'react-router-dom';

import Header from '../../components/Header';
import ServiceMain from './ServiceMain';

import NoticeMain from './bookletNotice/NoticeMain';
import EventMain from './bookletEvent/EventMain';
import BulletinMain from './bulletin/BulletinMain';

import ChurchDetail from '../../exceptbooklets/bookletNotice/BookletNoticeDetail';

import Footer from '../../components/Footer';
import NoticeCreate from './bookletNotice/createNotice/NoticeCreate';
import EventCreate from './bookletEvent/createEvent/EventCreate';
import NoticeApplyPay from './bookletNotice/createNotice/NoticeApplyPay';
import EventApplyPay from './bookletEvent/createEvent/EventApplyPay';
import NoticeComplete from './bookletNotice/createNotice/NoticeComplete';
import EventComplete from './bookletEvent/createEvent/EventComplete';
import BulletinApplyPay from './bulletin/createBulletin/BulletinApplyPay';
import BulletinComplete from './bulletin/createBulletin/BulletinComplete';
import HomepageMain from './homepage/HomepageMain';
import HomeinappMain from './homeinapp/HomeinappMain';
import HomeinappPayment from './homeinapp/HomeinappPayment';
import HomeinappComplete from './homeinapp/HomeinappComplete';
import ChurchappMain from './churchapp/ChurchappMain';
import ChurchappPayment from './churchapp/ChurchappPayment';

export default function ServiceRouter() {
  return (
    <div>
      <Header/>
      <Routes>
        <Route path="/" element={<ServiceMain/>}/>

        <Route path="/notice" element={<NoticeMain/>}/>
        <Route path="/event" element={<EventMain/>}/>
        <Route path="/bulletin" element={<BulletinMain/>}/>

        <Route path="/churchdetail" element={<ChurchDetail/>}/>

        <Route path="/bookletnoticepay" element={<NoticeApplyPay/>}/>
        <Route path="/bookleteventpay" element={<EventApplyPay/>}/>
        <Route path="/bookletnoticecreate" element={<NoticeCreate/>}/>
        <Route path="/bookleteventcreate" element={<EventCreate/>}/>
        <Route path="/bookleteventcomplete" element={<EventComplete/>}/>
        <Route path="/bookletnoticecomplete" element={<NoticeComplete/>}/>

        <Route path="/bookletbulletintemplates" element={<BulletinApplyPay/>}/>
        <Route path="/bookletbulletincomplete" element={<BulletinComplete/>}/>

        <Route path="/homepage" element={<HomepageMain/>}/>
        <Route path="/homeinapp" element={<HomeinappMain/>}/>
        <Route path="/homeinapp/payment" element={<HomeinappPayment/>}/>
        <Route path="/homeinapp/complete" element={<HomeinappComplete/>}/>
        
        <Route path="/churchapp" element={<ChurchappMain/>}/>
        <Route path="/churchapp/payment" element={<ChurchappPayment/>}/>

       
      </Routes>
      <Footer/>
    </div>
  );
}
