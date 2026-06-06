import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

import MinisterPageList from './pages/MinisterPageList';
import MinisterPageEdit from './pages/MinisterPageEdit';

// import RecruitDetailPreview from './pages/RecruitDetailPreview';



export default function MinisterRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<MinisterPageList/>}/>
        <Route path="/edit" element={<MinisterPageEdit/>}/>
      </Routes>
      <Footer />
    </div>
  )
}
