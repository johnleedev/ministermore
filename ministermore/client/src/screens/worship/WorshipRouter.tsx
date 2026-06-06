import { Routes, Route } from 'react-router-dom';
import PraiseList from './praise/PraiseList';
import PraiseDetail from './praise/PraiseDetail';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
// import ContiMain from './conti/ContiMain';
import ContiMaker from './conti/ContiMaker';

export default function WorshipRouter() {

  return (
    <div>
      <Header/>

      <Routes>
        <Route path="/" element={<PraiseList/>}/>
        <Route path="/detail" element={<PraiseDetail/>}/>
        <Route path="/conti" element={<ContiMaker/>}/>
        {/* <Route path="/conti/make" element={<ContiMaker/>}/> */}
      </Routes>

      <Footer/>
    </div>
  );
}
