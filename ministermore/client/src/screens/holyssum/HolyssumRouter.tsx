import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import HolyssumMain from './HolyssumMain';
import HolyssumDetail from './HolyssumDetail';
import HolyssumInput from './HolyssumInput';
import HolyssumMemo from './HolyssumMemo';
import HolyssumReview from './HolyssumReview';
import HolyssumReviewList from './HolyssumReviewList';

export default function HolyssumRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<HolyssumMain />} />
        <Route path="/detail/:id" element={<HolyssumDetail />} />
        <Route path="/input" element={<HolyssumInput />} />
        <Route path="/input/:id" element={<HolyssumInput />} />
        <Route path="/memo" element={<HolyssumMemo />} />
        <Route path="/review" element={<HolyssumReview />} />
        <Route path="/review/edit" element={<HolyssumReview isEdit />} />
        <Route path="/review/list" element={<HolyssumReviewList />} />
      </Routes>
      <Footer />
    </div>
  );
}
