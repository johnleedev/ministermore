import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RecruitMinisterList from './recruit_minister/RecruitMinisterList';
import RecruitMinisterDetail from './recruit_minister/RecruitMinisterDetail';
import RecruitMinisterPost from './recruit_minister/RecruitMinisterPost';
import RecruitChurchList from './recruit_church/RecruitChurchList';
import RecruitChurchDetail from './recruit_church/RecruitChurchDetail';
import RecruitChurchPost from './recruit_church/RecruitChurchPost';
import RecruitInstituteList from './recruit_institute/RecruitInstituteList';
import RecruitInstituteDetail from './recruit_institute/RecruitInstituteDetail';
import RecruitInstitutePost from './recruit_institute/RecruitInstitutePost';


export default function RecruitRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<RecruitMinisterList/>}/>
        <Route path="/recruitministerdetail" element={<RecruitMinisterDetail/>}/>
        <Route path="/recruitministerpost" element={<RecruitMinisterPost/>}/>
        <Route path="/recruitchurchlist" element={<RecruitChurchList/>}/>
        <Route path="/recruitchurchdetail" element={<RecruitChurchDetail/>}/>
        <Route path="/recruitchurchpost" element={<RecruitChurchPost/>}/>
        <Route path="/recruitinstitutelist" element={<RecruitInstituteList/>}/>
        <Route path="/recruitinstitutedetail" element={<RecruitInstituteDetail/>}/>
        <Route path="/recruitinstitutepost" element={<RecruitInstitutePost/>}/>
      </Routes>
      <Footer />
    </div>
  )
}
