import { Routes, Route, Navigate } from 'react-router-dom';
import Profile from './Profile';
import PostingManage from './PostingManage';
import ScrapManage from './ScrapManage';
import PostingEdit from './PostingEdit';
import ResumeManage from './ResumeManage';
import ResumeEdit from './ResumeEdit';
import ServiceManage from './ServiceManage';
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
        <Route path="/servicemanage" element={<ServiceManage/>}/>
        <Route path="/servicemanage/*" element={<Navigate to="/mypage/servicemanage" replace />}/>
      </Routes>
      <Footer />
    </div>
  )
}
