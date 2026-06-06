import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ChurchDetail from '../../exceptbooklets/bookletNotice/BookletNoticeDetail';
import ServiceAdminLayout from '../main/ServiceAdminLayout';

import NoticeCreate from './bookletNotice/createNotice/NoticeCreate';
import EventCreate from './bookletEvent/createEvent/EventCreate';
import NoticeComplete from './bookletNotice/createNotice/NoticeComplete';
import EventComplete from './bookletEvent/createEvent/EventComplete';
import BookletNoticeList from './BookletNoticeList';
import BookletEventList from './BookletEventList';
import HomeinappList from './homeinapp/HomeinappList';
import HomeinappNotificationMain from './homeinapp/HomeinappNotificationMain';
import ChurchappList from './churchapp/ChurchappList';

function LegacyServiceShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

export default function ServiceRouter() {
  return (
    <Routes>
      <Route element={<ServiceAdminLayout />}>
        <Route path="/notice" element={<BookletNoticeList />} />
        <Route path="/event" element={<BookletEventList />} />
        <Route path="/homeinapp" element={<HomeinappList />} />
        <Route path="/homeinapp/:churchId" element={<HomeinappNotificationMain />} />
        <Route path="/churchapp" element={<ChurchappList />} />
      </Route>

      <Route
        path="/churchdetail"
        element={
          <LegacyServiceShell>
            <ChurchDetail />
          </LegacyServiceShell>
        }
      />
      <Route
        path="/bookletnoticecreate"
        element={
          <LegacyServiceShell>
            <NoticeCreate />
          </LegacyServiceShell>
        }
      />
      <Route
        path="/bookleteventcreate"
        element={
          <LegacyServiceShell>
            <EventCreate />
          </LegacyServiceShell>
        }
      />
      <Route
        path="/bookleteventcomplete"
        element={
          <LegacyServiceShell>
            <EventComplete />
          </LegacyServiceShell>
        }
      />
      <Route
        path="/bookletnoticecomplete"
        element={
          <LegacyServiceShell>
            <NoticeComplete />
          </LegacyServiceShell>
        }
      />
    </Routes>
  );
}
