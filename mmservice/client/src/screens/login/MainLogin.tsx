import { Routes, Route } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Login from './Login';
import LoginSns from './LoginSns';
import Logister from './Logister';
import LogisterDetail from './LogisterDetail';


export default function MainLogin() {

  return (
    <div>
      <Header/>

      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/loginsns" element={<LoginSns/>}/>
        <Route path="/logister" element={<Logister/>}/>
        <Route path="/logisterDetail" element={<LogisterDetail/>}/>
      </Routes>

      <Footer/>
    </div>
  );
}
