import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Main from './screens/main/Main';

import { RecoilRoot } from 'recoil';
import ServiceRouter from './screens/service/ServiceRouter';
import MainRollbook from './screens/rollbook/MainRollbook';
import MainLogin from './screens/login/MainLogin';
import BookletDetailPage from './exceptbooklets/bookletNotice/BookletNoticeDetail';
import BookletEventDetailPage from './exceptbooklets/bookletEvent/BookletEventDetail';
import BulletinDetailPage from './exceptbooklets/bulletin/BulletinDetail';



function App() {

  return (
      <div className="App">

        <RecoilRoot>
        
          <div className='Main'>
            
            <Routes>
              <Route path="/" element={<Main/>}/>
              
              {/* <Route path="/minister/*" element={<MinisterRouter/>}/>
              <Route path="/ministerpage" element={<MinisterDetailPage/>}/>
               */}

              <Route path="/booklet" element={<BookletDetailPage/>}/>
              <Route path="/event" element={<BookletEventDetailPage/>}/>
              <Route path="/bulletin" element={<BulletinDetailPage/>}/>

              
              
              <Route path="/service/*" element={<ServiceRouter/>}/>             
              

              <Route path="/rollbook/*" element={<MainRollbook/>}/>

              <Route path="/login/*" element={<MainLogin/>}/>
              

              
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
