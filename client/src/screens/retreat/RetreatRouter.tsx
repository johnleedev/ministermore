import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PlaceList from './place/PlaceList';
import PlaceDetail from './place/PlaceDetail';
import PlaceRequest from './place/PlaceRequest';
import CastingList from './casting/CastingList';
import CastingDetail from './casting/CastingDetail';
import CastingRequest from './casting/CastingRequest';
import ReviewList from './review/ReviewList';
import ReviewDetail from './review/ReviewDetail';
import ReviewPost from './review/ReviewPost';
import UpgradeList from './upgrade/UpgradeList';

export default function RetreatRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<PlaceList />} />
        <Route path="/place" element={<PlaceList />} />
        <Route path="/place/detail" element={<PlaceDetail />} />
        <Route path="/place/request" element={<PlaceRequest />} />
        <Route path="/casting" element={<CastingList />} />
        <Route path="/casting/detail" element={<CastingDetail />} />
        <Route path="/casting/request" element={<CastingRequest />} />
        <Route path="/review" element={<ReviewList />} />
        <Route path="/review/detail" element={<ReviewDetail />} />
        <Route path="/review/post" element={<ReviewPost />} />
        <Route path="/upgrade" element={<UpgradeList />} />
        <Route path="/grade" element={<UpgradeList />} />
      </Routes>
      <Footer />
    </div>
  );
}