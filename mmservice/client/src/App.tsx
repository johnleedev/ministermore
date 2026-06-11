import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Main from './screens/main/Main';

import { RecoilRoot } from 'recoil';
import AppShell from './components/AppShell';
import ServiceRouter from './screens/service/ServiceRouter';
import MainRollbook from './screens/rollbook/MainRollbook';
import RetreatManage from './screens/retreat/pages/RetreatManage';
import RetreatEdit from './screens/retreat/pages/RetreatEdit';
import RetreatView from './screens/retreat/pages/RetreatView';
import ChurchAppManage from './screens/church-app/ChurchAppManage';
import AttendanceManage from './screens/attendance/AttendanceManage';
import IntroManage from './screens/intro/IntroManage';
import EventManage from './screens/event/EventManage';
import BookletDetailPage from './exceptbooklets/bookletNotice/BookletNoticeDetail';
import BookletEventDetailPage from './exceptbooklets/bookletEvent/BookletEventDetail';
import BookletRetreatDetailPage from './exceptbooklets/bookletretreat/BookletRetreatDetail';
import BulletinDetailPage from './exceptbooklets/bulletin/BulletinDetail';

function App() {
  return (
    <div className="App">
      <RecoilRoot>
        <div className="Main">
          <Routes>
            {/* 공개 전단지 — 관리자 헤더 없이 단독 표시 (bookletEvent와 동일) */}
            <Route path="/booklet" element={<BookletDetailPage />} />
            <Route path="/booklet-event" element={<BookletEventDetailPage />} />
            <Route path="/booklet-retreat" element={<BookletRetreatDetailPage />} />
            <Route path="/bulletin" element={<BulletinDetailPage />} />

            <Route element={<AppShell />}>
              <Route path="/" element={<Main />} />
              <Route path="/retreat" element={<RetreatManage />} />
              <Route path="/retreat/edit/:bookletId" element={<RetreatEdit />} />
              <Route path="/retreat/view" element={<RetreatView />} />
              <Route path="/church-app" element={<ChurchAppManage />} />
              <Route path="/attendance" element={<AttendanceManage />} />
              <Route path="/intro" element={<IntroManage />} />
              <Route path="/event" element={<EventManage />} />

              <Route path="/service/*" element={<ServiceRouter />} />
              <Route path="/rollbook/*" element={<MainRollbook />} />
            </Route>
          </Routes>
        </div>
      </RecoilRoot>
    </div>
  );
}

export default App;
