import { Routes, Route } from 'react-router-dom';
import Footer from '../../components/Footer';
import Login from './Login';
import LoginSns from './LoginSns';

export default function MainLogin() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/loginsns" element={<LoginSns />} />
      </Routes>
      <Footer />
    </div>
  );
}
