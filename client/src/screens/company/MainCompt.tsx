import { Routes, Route } from 'react-router-dom';
import Company from './pages/Company';
import Advertise from './pages/Advertise';
import FAQ from './pages/FAQ';
import Header from '../../components/Header';
import Footer from '../../components/Footer';



export default function MainCompt() {

  return (
    <div>
      <Header/>
      <Routes>
        <Route path="/" element={<Company/>}/>
        <Route path="/advertise" element={<Advertise/>}/>
        <Route path="/faq" element={<FAQ/>}/>
      </Routes>
      <Footer />
    </div>
  );
}

