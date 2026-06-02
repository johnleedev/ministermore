import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RecruitList from './common/RecruitList';
import RecruitDetail from './common/RecruitDetail';
import RecruitSimplePost from './common/RecruitSimplePost';
import RecruitMinisterPost from './recruit_minister/RecruitMinisterPost';
import {
  MINISTER_RECRUIT_CONFIG,
  CHURCH_RECRUIT_CONFIG,
  INSTITUTE_RECRUIT_CONFIG,
} from './common/recruitConfigs';

export default function RecruitRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<RecruitList config={MINISTER_RECRUIT_CONFIG} />} />
        <Route path="/recruitministerdetail" element={<RecruitDetail config={MINISTER_RECRUIT_CONFIG} />} />
        <Route path="/recruitministerpost" element={<RecruitMinisterPost />} />

        <Route path="/recruitchurchlist" element={<RecruitList config={CHURCH_RECRUIT_CONFIG} />} />
        <Route path="/recruitchurchdetail" element={<RecruitDetail config={CHURCH_RECRUIT_CONFIG} />} />
        <Route path="/recruitchurchpost" element={<RecruitSimplePost config={CHURCH_RECRUIT_CONFIG} />} />

        <Route path="/recruitinstitutelist" element={<RecruitList config={INSTITUTE_RECRUIT_CONFIG} />} />
        <Route path="/recruitinstitutedetail" element={<RecruitDetail config={INSTITUTE_RECRUIT_CONFIG} />} />
        <Route path="/recruitinstitutepost" element={<RecruitSimplePost config={INSTITUTE_RECRUIT_CONFIG} />} />
      </Routes>
      <Footer />
    </div>
  );
}
