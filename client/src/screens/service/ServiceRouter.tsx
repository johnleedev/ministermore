import { Routes, Route } from 'react-router-dom';

import Header from '../../components/Header';
import ServiceMain from './ServiceMain';

import NoticeMain from './bookletNotice/NoticeMain';
import EventMain from './bookletEvent/EventMain';
import BulletinMain from './churchBulletin/BulletinMain';

import ChurchDetail from '../../exceptbooklets/bookletNotice/BookletNoticeDetail';

import Footer from '../../components/Footer';
import NoticeCreate from './bookletNotice/createNotice/NoticeCreate';
import EventCreate from './bookletEvent/createEvent/EventCreate';
import NoticeTemplateSelect from './bookletNotice/createNotice/NoticeTemplateSelect';
import EventTemplateSelect from './bookletEvent/createEvent/EventTemplateSelect';
import NoticeComplete from './bookletNotice/createNotice/NoticeComplete';
import EventComplete from './bookletEvent/createEvent/EventComplete';
import BulletinTemplateSelect from './churchBulletin/createBulletin/BulletinTemplateSelect';
import BulletinCreate from './churchBulletin/createBulletin/BulletinCreate';
import BulletinComplete from './churchBulletin/createBulletin/BulletinComplete';


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

        <Route path="/bookletnoticetemplates" element={<NoticeTemplateSelect/>}/>
        <Route path="/bookleteventtemplates" element={<EventTemplateSelect/>}/>
        <Route path="/bookletnoticecreate" element={<NoticeCreate/>}/>
        <Route path="/bookleteventcreate" element={<EventCreate/>}/>
        <Route path="/bookleteventcomplete" element={<EventComplete/>}/>
        <Route path="/bookletnoticecomplete" element={<NoticeComplete/>}/>

        <Route path="/bookletbulletintemplates" element={<BulletinTemplateSelect/>}/>
        <Route path="/bookletbulletincreate" element={<BulletinCreate/>}/>
        <Route path="/bookletbulletincomplete" element={<BulletinComplete/>}/>

       
      </Routes>
      <Footer/>
    </div>
  );
}
