import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Header from '../../components/Header';
import ServiceMain from './ServiceMain';

import NoticeMain from './bookletNotice/NoticeMain';
import EventMain from './bookletEvent/EventMain';

import ChurchDetail from '../../exceptbooklets/bookletNotice/BookletNoticeDetail';

import Footer from '../../components/Footer';
import NoticeApplyPay from './bookletNotice/createNotice/NoticeApplyPay';
import NoticePayComplete from './bookletNotice/createNotice/NoticePayComplete';
import EventApplyPay from './bookletEvent/createEvent/EventApplyPay';
import EventPayComplete from './bookletEvent/createEvent/EventPayComplete';
import HomeinappMain from './homeinapp/HomeinappMain';
import HomeinappPayment from './homeinapp/HomeinappPayment';
import HomeinappComplete from './homeinapp/HomeinappComplete';
import ChurchappMain from './churchapp/ChurchappMain';
import ChurchappPayment from './churchapp/ChurchappPayment';
import ChurchappComplete from './churchapp/ChurchappComplete';
import MmserviceURL from '../../MmserviceURL';

function RedirectToMmservice() {
  const location = useLocation();

  useEffect(() => {
    const base = MmserviceURL.replace(/\/$/, '');
    window.location.replace(`${base}${location.pathname}${location.search}${location.hash}`);
  }, [location]);

  return null;
}

export default function ServiceRouter() {
  return (
    <div>
      <Header/>
      <Routes>
        <Route path="/" element={<ServiceMain/>}/>

        <Route path="/notice" element={<NoticeMain/>}/>
        <Route path="/event" element={<EventMain/>}/>

        <Route path="/churchdetail" element={<ChurchDetail/>}/>

        <Route path="/bookletnoticepay" element={<NoticeApplyPay/>}/>
        <Route path="/bookletnoticepay/complete" element={<NoticePayComplete/>}/>
        <Route path="/bookleteventpay" element={<EventApplyPay/>}/>
        <Route path="/bookleteventpay/complete" element={<EventPayComplete/>}/>
        <Route path="/bookletnoticecreate" element={<RedirectToMmservice/>}/>
        <Route path="/bookleteventcreate" element={<RedirectToMmservice/>}/>
        <Route path="/bookletnoticecomplete" element={<RedirectToMmservice/>}/>
        <Route path="/bookleteventcomplete" element={<RedirectToMmservice/>}/>

        <Route path="/homeinapp" element={<HomeinappMain/>}/>
        <Route path="/homeinapp/payment" element={<HomeinappPayment/>}/>
        <Route path="/homeinapp/complete" element={<HomeinappComplete/>}/>
        
        <Route path="/churchapp" element={<ChurchappMain/>}/>
        <Route path="/churchapp/payment" element={<ChurchappPayment/>}/>
        <Route path="/churchapp/payment/complete" element={<ChurchappComplete/>}/>

       
      </Routes>
      <Footer/>
    </div>
  );
}
