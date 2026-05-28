
import './Admin.scss'; 
import { Routes, Route } from 'react-router-dom';
import Main from './Main';
import Login from './Login';

import Header from '../components/Header';
import Footer from '../components/Footer';
import RegisterRecruit from './recruit/RegisterRecruit';
import RecruitListManagePre from './recruit/RecruitListManagePre';
import AdminManege from './manage/AdminManege';
import BoardPostManage from './board/BoardPostManage';
import WorshipManage from './worship/WorshipManage';
import WorshipManageAdmin from './worship/WorshipManageAdmin';
import Backup from './Backup';
import AdminEmail from './email/AdminEmail';
import PushNotificationAdmin from './pushNotifi/PushNotificationAdmin';
import ServiceApplyList from './service/ServiceApplyList';
import AdminUser from './user/AdminUser';

export default function AdminMain( props: any) {

  return (
    <div className="AdminContainer">
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/main" element={<Main/>}/>
        <Route path="/registerrecruit" element={<RegisterRecruit/>}/>
        <Route path="/recruitlistmanagepre" element={<RecruitListManagePre/>}/>
        <Route path="/adminmanage" element={<AdminManege/>}/>
        <Route path="/boardpostmanage" element={<BoardPostManage />} />
        <Route path="/freeboardmanage" element={<BoardPostManage initialTab="free" />} />
        <Route path="/eventsboardmanage" element={<BoardPostManage initialTab="events" />} />
        <Route path="/usedboardmanage" element={<BoardPostManage initialTab="used" />} />
        <Route path="/worshipmanage" element={<WorshipManage/>}/> 
        <Route path="/backup" element={<Backup/>}/>
        <Route path="/worshipmanageadmin" element={<WorshipManageAdmin/>}/>
        <Route path="/emailmanage" element={<AdminEmail />}/>
        <Route path="/pushnotifi" element={<PushNotificationAdmin />}/>
        <Route path="/serviceapply" element={<ServiceApplyList />}/>
        <Route path="/adminuser" element={<AdminUser />}/>
      </Routes>
      <Footer />
    </div>
  );
}
