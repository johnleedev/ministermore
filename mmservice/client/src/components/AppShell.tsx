import { Outlet } from 'react-router-dom';
import Header from './Header';

/** 전역 상단 네비 + 하위 라우트 */
export default function AppShell() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
