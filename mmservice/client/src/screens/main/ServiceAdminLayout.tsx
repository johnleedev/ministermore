import { Outlet } from 'react-router-dom';
import MainSiteURL from '../../MainSiteURL';
import ServiceAdminNavbar from './ServiceAdminNavbar';
import './Main.scss';

export default function ServiceAdminLayout() {
  const mainSiteBase = MainSiteURL.replace(/\/$/, '');

  return (
    <div className="service-admin">
      <ServiceAdminNavbar />
      <div className="service-admin__list-shell">
        <Outlet />
      </div>
      <footer className="service-admin__footer">
        <div className="service-admin__container">
          © 2026 사역자모아 서비스관리자 ·{' '}
          <a href={mainSiteBase} target="_blank" rel="noopener noreferrer">
            ministermore.co.kr
          </a>{' '}
          · 문의 카카오톡 채널
        </div>
      </footer>
    </div>
  );
}
