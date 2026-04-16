import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Main from './screens/main/Main';
import AdminMain from './Admin/AdminMain';
import { RecoilRoot } from 'recoil';
import MainCompt from './screens/company/MainCompt';
import ServiceRouter from './screens/service/ServiceRouter';
import CommunityRouter from './screens/community/CommunityRouter';
import MypageMain from './screens/mypage/MypageMain';
import MainRollbook from './screens/rollbook/MainRollbook';
import WorshipRouter from './screens/worship/WorshipRouter';
import MainLogin from './screens/login/MainLogin';
import RecruitRouter from './screens/recruit/RecruitRouter';
import MinisterRouter from './screens/minister/MinisterRouter';

import MinisterDetailPage from './exceptbooklets/minister/MinisterDetail';
import BookletDetailPage from './exceptbooklets/bookletNotice/BookletNoticeDetail';
import BookletEventDetailPage from './exceptbooklets/bookletEvent/BookletEventDetail';
import BulletinDetailPage from './exceptbooklets/bulletin/BulletinDetail';
import HolyssumRouter from './screens/holyssum/HolyssumRouter';


function App() {

  return (
      <div className="App">

        <RecoilRoot>
        
          <div className='Main'>
            
            <Routes>
              <Route path="/" element={<Main/>}/>
              <Route path="/recruit/*" element={<RecruitRouter/>}/>

              <Route path="/minister/*" element={<MinisterRouter/>}/>
              <Route path="/ministerpage" element={<MinisterDetailPage/>}/>

              <Route path="/booklet" element={<BookletDetailPage/>}/>
              <Route path="/event" element={<BookletEventDetailPage/>}/>
              <Route path="/bulletin" element={<BulletinDetailPage/>}/>

              <Route path="/worship/*" element={<WorshipRouter/>}/>
              
              <Route path="/community/*" element={<CommunityRouter/>}/>
              
              <Route path="/company/*" element={<MainCompt/>}/>
              
              <Route path="/service/*" element={<ServiceRouter/>}/>             
              

              <Route path="/rollbook/*" element={<MainRollbook/>}/>

              <Route path="/mypage/*" element={<MypageMain/>}/>
              <Route path="/login/*" element={<MainLogin/>}/>
              <Route path="/admin/*" element={<AdminMain/>}/>

              
              {/* <Route path="/holyssum/*" element={<HolyssumRouter/>}/> */}
              {/* <Route path="/store/*" element={<CommunityMain/>}/> */}
              
              
              
              
              {/* <Route path="/custom/*" element={<BannerCustom/>}/> */}

              
              
            </Routes>
          </div>
        </RecoilRoot>

      </div>
  );
}

export default App;
