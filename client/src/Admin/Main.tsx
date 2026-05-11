import './Admin.scss';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterRecruit from './recruit/RegisterRecruit';
import RecruitListManagePre from './recruit/RecruitListManagePre';
import WorshipManage from './worship/WorshipManage';
import AdminEmail from './email/AdminEmail';
import PushNotificationAdmin from './pushNotifi/PushNotificationAdmin';
import ServiceApplyList from './service/ServiceApplyList';
import AdminManege from './manage/AdminManege';
import Backup from './Backup';

type MenuKey =
  | 'registerrecruit'
  | 'recruitlistmanagepre'
  | 'worshipmanage'
  | 'emailmanage'
  | 'pushnotifi'
  | 'serviceapply'
  | 'adminmanage'
  | 'backup';

type MenuItem = {
  key: MenuKey;
  label: string;
  adminOnly?: boolean;
  icon: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'registerrecruit', label: '사역게시판', icon: '📄' },
  { key: 'worshipmanage', label: '예배사역 관리', icon: '🎵' },
  { key: 'recruitlistmanagepre', label: '일괄 관리 (사역게시판)', adminOnly: true, icon: '🗂️' },
  { key: 'emailmanage', label: '메일전송관리', adminOnly: true, icon: '✉️' },
  { key: 'pushnotifi', label: '앱 푸쉬알림 관리', adminOnly: true, icon: '🔔' },
  { key: 'serviceapply', label: '서비스 결제/신청 내역', adminOnly: true, icon: '💳' },
  { key: 'adminmanage', label: '통계', adminOnly: true, icon: '📊' },
  { key: 'backup', label: '백업', adminOnly: true, icon: '🗄️' },
];

function AdminMainContent({ activeMenu }: { activeMenu: MenuKey }) {
  switch (activeMenu) {
    case 'registerrecruit':
      return <RegisterRecruit />;
    case 'recruitlistmanagepre':
      return <RecruitListManagePre />;
    case 'worshipmanage':
      return <WorshipManage />;
    case 'emailmanage':
      return <AdminEmail />;
    case 'pushnotifi':
      return <PushNotificationAdmin />;
    case 'serviceapply':
      return <ServiceApplyList />;
    case 'adminmanage':
      return <AdminManege />;
    case 'backup':
      return <Backup />;
    default:
      return <RegisterRecruit />;
  }
}

export default function Main(props: any) {
  const navigate = useNavigate();
  const userData = sessionStorage.getItem('user');
  const isSuperAdmin = userData === 'johnleedev';
  const [activeMenu, setActiveMenu] = useState<MenuKey>('registerrecruit');

  const visibleMenus = useMemo(
    () => MENU_ITEMS.filter((item) => !item.adminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  useEffect(() => {
    const activeMenuVisible = visibleMenus.some((menu) => menu.key === activeMenu);
    if (!activeMenuVisible && visibleMenus.length > 0) {
      setActiveMenu(visibleMenus[0].key);
    }
  }, [activeMenu, visibleMenus]);

  return (
    <div className="AdminContainer admin-main-shell">
      <header className="admin-main-shell__topbar">
        <div className="admin-main-shell__brand">Ministermore Admin</div>
        <div className="admin-main-shell__user">
          <button
            type="button"
            className="admin-main-shell__home-btn"
            onClick={() => navigate('/')}
          >
            홈
          </button>
          <span className="admin-main-shell__user-name">{userData || 'admin'}</span>
          <span className="admin-main-shell__user-role">관리자</span>
        </div>
      </header>

      <div className="admin-main-layout">
        <aside className="admin-main-layout__sidebar">
          <div className="admin-main-layout__sidebar-title">관리자 메뉴</div>
          <nav className="admin-main-layout__menu">
            {visibleMenus.map((menu) => (
              <button
                key={menu.key}
                type="button"
                className={`admin-main-layout__menu-btn${activeMenu === menu.key ? ' is-active' : ''}`}
                onClick={() => {
                  window.scrollTo(0, 0);
                  setActiveMenu(menu.key);
                }}
              >
                <span className="admin-main-layout__menu-icon" aria-hidden>{menu.icon}</span>
                <span>{menu.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="admin-main-layout__content">
          <div className="admin-main-layout__content-head">
            <div className="admin-main-layout__breadcrumb">관리자 / {visibleMenus.find((v) => v.key === activeMenu)?.label}</div>
            <h2>{visibleMenus.find((v) => v.key === activeMenu)?.label}</h2>
          </div>
          <div className="admin-main-layout__content-body">
            <AdminMainContent activeMenu={activeMenu} />
          </div>
        </section>
      </div>
    </div>
  );
}
