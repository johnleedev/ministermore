import { Routes, Route } from 'react-router-dom';
import Company from './pages/Company';
import Advertise from './pages/Advertise';
import FAQ from './pages/FAQ';
import NoticeBoard from './pages/NoticeBoard';
import NoticeDetail from './pages/NoticeDetail';
import Header from '../../components/Header';
import Footer from '../../components/Footer';



export default function MainCompt() {

  return (
    <div>
      <Header/>
      <Routes>
        <Route path="/" element={<Company/>}/>
        <Route path="/advertise" element={<Advertise/>}/>
        <Route path="/faq" element={<FAQ/>}/>
        <Route path="/notice" element={<NoticeBoard/>}/>
        <Route path="/noticedetail" element={<NoticeDetail/>}/>
      </Routes>
      <Footer />
    </div>
  );
}

