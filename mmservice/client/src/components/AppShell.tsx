import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

/** 전역 상단 네비 + 하위 라우트 */
export default function AppShell() {
  const { pathname } = useLocation();
  const hideHeader = /^\/retreat\/edit\//.test(pathname);

  return (
    <>
      {!hideHeader ? <Header /> : null}
      <Outlet />
    </>
  );
}
