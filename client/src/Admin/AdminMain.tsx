
import './Admin.scss'; 
import { Routes, Route } from 'react-router-dom';
import Main from './Main';
import Login from './Login';

import Header from '../components/Header';
import Footer from '../components/Footer';
import RegisterRecruit from './recruit/RegisterRecruit';
import RecruitListManagePre from './recruit/RecruitListManagePre';
import AdminManege from './manage/AdminManege';
import CommunityManage from './CommunityManage';
import WorshipManage from './worship/WorshipManage';
import WorshipManageAdmin from './worship/WorshipManageAdmin';
import Backup from './Backup';
import AdminEmail from './email/AdminEmail';

export default function AdminMain( props: any) {

  return (
    <div className="AdminContainer">
      <Header />
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/main" element={<Main/>}/>
        <Route path="/registerrecruit" element={<RegisterRecruit/>}/>
        <Route path="/recruitlistmanagepre" element={<RecruitListManagePre/>}/>
        <Route path="/adminmanage" element={<AdminManege/>}/>
        <Route path="/communitymanage" element={<CommunityManage/>}/>
        <Route path="/worshipmanage" element={<WorshipManage/>}/> 
        <Route path="/backup" element={<Backup/>}/>
        <Route path="/worshipmanageadmin" element={<WorshipManageAdmin/>}/>
        <Route path="/emailmanage" element={<AdminEmail />}/>
      </Routes>
      <Footer />
    </div>
  );
}
