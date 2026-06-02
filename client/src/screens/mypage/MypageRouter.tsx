import { Routes, Route, Navigate } from 'react-router-dom';
import Profile from './Profile';
import PostingManage from './PostingManage';
import ScrapManage from './ScrapManage';
import PostingEdit from './PostingEdit';
import ResumeManage from './ResumeManage';
import ResumeEdit from './ResumeEdit';
import ServiceManage from './ServiceManage';
import ChurchBulletinManageMain from './bulletinComponent/ChurchBulletinManageMain';
import HomeinappNotificationMain from './homeinappComponent/HomeinappNotificationMain';
import HomeinappNotificationList from './homeinappComponent/HomeinappNotificationList';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function MypageRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Profile/>}/>
        <Route path="/scrapmanage" element={<ScrapManage/>}/>
        <Route path="/postingmanage" element={<PostingManage/>}/>
        <Route path="/postingedit" element={<PostingEdit/>}/>
        <Route path="/resumemanage" element={<ResumeManage/>}/>
        <Route path="/resumeedit" element={<ResumeEdit/>}/>
        <Route path="/church-bulletin" element={<ChurchBulletinManageMain/>}/>
        <Route path="/homeinapp-notification/:churchId" element={<HomeinappNotificationMain />} />
        <Route path="/homeinapp-notification" element={<HomeinappNotificationList />} />
        <Route
          path="/servicemanage/church-bulletin"
          element={<Navigate to="/mypage/church-bulletin" replace/>}
        />
        <Route
          path="/servicemanage/homeinapp-notification"
          element={<Navigate to="/mypage/homeinapp-notification" replace/>}
        />
        <Route path="/servicemanage" element={<ServiceManage/>}/>
        <Route path="/servicemanage/:serviceType" element={<ServiceManage/>}/>
      </Routes>
      <Footer />
    </div>
  )
}
