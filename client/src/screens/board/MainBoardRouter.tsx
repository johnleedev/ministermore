import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BoardList from './BoardList';
import BoardPost from './BoardPost';
import BoardDetail from './BoardDetail';
import {
  FREE_BOARD_CONFIG,
  EVENTS_BOARD_CONFIG,
  USED_BOARD_CONFIG,
} from './boardConfigs';

export default function MainBoardRouter() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<BoardList config={FREE_BOARD_CONFIG} />} />
        <Route path="/freepost" element={<BoardPost config={FREE_BOARD_CONFIG} />} />
        <Route path="/freedetail" element={<BoardDetail config={FREE_BOARD_CONFIG} />} />


        <Route path="/events" element={<BoardList config={EVENTS_BOARD_CONFIG} />} />
        <Route path="/eventspost" element={<BoardPost config={EVENTS_BOARD_CONFIG} />} />
        <Route path="/eventsdetail" element={<BoardDetail config={EVENTS_BOARD_CONFIG} />} />


        <Route path="/used" element={<BoardList config={USED_BOARD_CONFIG} />} />
        <Route path="/usedpost" element={<BoardPost config={USED_BOARD_CONFIG} />} />
        <Route path="/useddetail" element={<BoardDetail config={USED_BOARD_CONFIG} />} />
      </Routes>
      <Footer />
    </div>
  );
}
