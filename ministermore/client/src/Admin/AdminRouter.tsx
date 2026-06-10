
import './Admin.scss'; 
import { Routes, Route } from 'react-router-dom';
import Main from './Main';
import Login from './Login';
import AdminRequireAuth from './AdminRequireAuth';

import Header from '../components/Header';
import Footer from '../components/Footer';
import RegisterRecruit from './recruit/RegisterRecruit';
import RecruitListManagePre from './recruit/RecruitListManagePre';
import AdminStatistics from './statistics/AdminStatistics';
import BoardPostManage from './board/BoardPostManage';
import WorshipManage from './worship/WorshipManage';
import WorshipManageAdmin from './worship/WorshipManageAdmin';
import Backup from './Backup';
import AdminEmail from './email/AdminEmail';
import PushNotificationPage from './appmanage/PushNotificationPage';
import AppVersionPage from './appmanage/AppVersionPage';
import ServiceApplyList from './service/ServiceApplyList';
import AdminUser from './user/AdminUser';
import AdminInquiryManage from './user/AdminInquiryManage';

export default function AdminMain( props: any) {

  return (
    <div className="AdminContainer">
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/main" element={<AdminRequireAuth><Main/></AdminRequireAuth>}/>
        <Route path="/registerrecruit" element={<AdminRequireAuth><RegisterRecruit/></AdminRequireAuth>}/>
        <Route path="/recruitlistmanagepre" element={<AdminRequireAuth><RecruitListManagePre/></AdminRequireAuth>}/>
        <Route path="/adminmanage" element={<AdminRequireAuth><AdminStatistics /></AdminRequireAuth>}/>
        <Route path="/boardpostmanage" element={<AdminRequireAuth><BoardPostManage /></AdminRequireAuth>} />
        <Route path="/freeboardmanage" element={<AdminRequireAuth><BoardPostManage initialTab="free" /></AdminRequireAuth>} />
        <Route path="/eventsboardmanage" element={<AdminRequireAuth><BoardPostManage initialTab="events" /></AdminRequireAuth>} />
        <Route path="/usedboardmanage" element={<AdminRequireAuth><BoardPostManage initialTab="used" /></AdminRequireAuth>} />
        <Route path="/worshipmanage" element={<AdminRequireAuth><WorshipManage/></AdminRequireAuth>}/> 
        <Route path="/backup" element={<AdminRequireAuth><Backup/></AdminRequireAuth>}/>
        <Route path="/worshipmanageadmin" element={<AdminRequireAuth><WorshipManageAdmin/></AdminRequireAuth>}/>
        <Route path="/emailmanage" element={<AdminRequireAuth><AdminEmail /></AdminRequireAuth>}/>
        <Route path="/pushnotifi" element={<AdminRequireAuth><PushNotificationPage /></AdminRequireAuth>}/>
        <Route path="/appversion" element={<AdminRequireAuth><AppVersionPage /></AdminRequireAuth>}/>
        <Route path="/serviceapply" element={<AdminRequireAuth><ServiceApplyList /></AdminRequireAuth>}/>
        <Route path="/adminuser" element={<AdminRequireAuth><AdminUser /></AdminRequireAuth>}/>
        <Route path="/admininquiry" element={<AdminRequireAuth><AdminInquiryManage /></AdminRequireAuth>}/>
      </Routes>
      <Footer />
    </div>
  );
}
