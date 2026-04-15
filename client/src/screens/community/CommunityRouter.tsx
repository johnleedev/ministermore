import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

import NoticeBoard from './notice/NoticeBoard';
import NoticePost from './notice/NoticePost';
import NoticeDetail from './notice/NoticeDetail';
import UsedMarket from './used/UsedBoard';
import UsedPost from './used/UsedPost';
import UsedDetail from './used/UsedDetail';


export default function CommunityRouter() {
  return (
    <div>
      <Header/>
      <Routes>
      
        <Route path="/" element={<NoticeBoard/>}/>
        <Route path="/noticepost" element={<NoticePost/>}/>
        <Route path="/noticedetail" element={<NoticeDetail/>}/>

        <Route path="/usedmarket" element={<UsedMarket/>}/>
        <Route path="/usedpost" element={<UsedPost/>}/>
        <Route path="/useddetail" element={<UsedDetail/>}/>
      </Routes>
      <Footer />
    </div>
  )
}
