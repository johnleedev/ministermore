import './Admin.scss';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterRecruit from './recruit/RegisterRecruit';
import RecruitListManagePre from './recruit/RecruitListManagePre';
import WorshipManage from './worship/WorshipManage';
import AdminEmail from './email/AdminEmail';
import PushNotificationAdmin from './pushNotifi/PushNotificationAdmin';
import ServiceApplyList from './service/ServiceApplyList';
import ServiceDetailOverview from './service/ServiceDetailOverview';
import AdminManege from './manage/AdminManege';
import Backup from './Backup';
import BoardPostWrite from './board/BoardPostWrite';
import BoardPostManage from './board/BoardPostManage';
import RetreatManage from './retreat/RetreatManage';
import AdminUser from './user/AdminUser';
import AdminStaffManage from './staff/AdminStaffManage';
import AdminAttendance from './staff/AdminAttendance';
import TopbarAttendance from './staff/TopbarAttendance';
import AdminTodoManage from './todos/AdminTodoManage';
import { clearAdminSession, getAdminSession, isSuperAdmin } from './adminSession';

type MenuKey =
  | 'admintodos'
  | 'registerrecruit'
  | 'recruitlistmanagepre'
  | 'worshipmanage'
  | 'emailmanage'
  | 'pushnotifi'
  | 'serviceapply'
  | 'servicedetail'
  | 'noticepost'
  | 'boardpostmanage'
  | 'retreatmanage'
  | 'adminuser'
  | 'adminstaff'
  | 'attendanceadmin'
  | 'adminmanage'
  | 'backup';

type MenuItem = {
  key: MenuKey;
  label: string;
  adminOnly?: boolean;
  superOnly?: boolean;
  icon: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'admintodos', label: 'To-Do 관리', icon: '✅' },
  { key: 'attendanceadmin', label: '출퇴근 현황', icon: '📅', superOnly: true },
  { key: 'registerrecruit', label: '사역게시판', icon: '📄' },
  { key: 'worshipmanage', label: '예배사역 관리', icon: '🎵' },
  { key: 'recruitlistmanagepre', label: '일괄 관리 (사역게시판)', icon: '🗂️' },
  { key: 'emailmanage', label: '메일전송관리', icon: '✉️' },
  { key: 'pushnotifi', label: '앱 푸쉬알림 관리', icon: '🔔' },
  { key: 'serviceapply', label: '서비스 결제/신청 내역', icon: '💳' },
  { key: 'servicedetail', label: '서비스 상세현황', icon: '📋' },
  { key: 'noticepost', label: '게시판 글 작성', icon: '📢' },
  { key: 'boardpostmanage', label: '게시글 관리', icon: '📋' },
  { key: 'retreatmanage', label: '수련회 관리', icon: '🏕️' },
  { key: 'adminuser', label: '회원 관리', icon: '👤' },
  { key: 'adminstaff', label: '직원 관리', icon: '🛡️', superOnly: true },
  { key: 'adminmanage', label: '통계', icon: '📊' },
  { key: 'backup', label: '백업', adminOnly: true, icon: '🗄️' },
];

function canViewMenuItem(item: MenuItem, session: ReturnType<typeof getAdminSession>): boolean {
  if (item.superOnly) return isSuperAdmin(session);
  if (item.adminOnly) return isSuperAdmin(session);
  return true;
}

function AdminMainContent({
  activeMenu,
  adminSession,
}: {
  activeMenu: MenuKey;
  adminSession: ReturnType<typeof getAdminSession>;
}) {
  if (activeMenu === 'adminstaff' && !isSuperAdmin(adminSession)) {
    return (
      <p className="admin-main-layout__forbidden">관리자 승인 메뉴는 최종관리자만 이용할 수 있습니다.</p>
    );
  }

  switch (activeMenu) {
    case 'admintodos':
      return <AdminTodoManage />;
    case 'attendanceadmin':
      return <AdminAttendance />;
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
    case 'servicedetail':
      return <ServiceDetailOverview />;
    case 'noticepost':
      return <BoardPostWrite />;
    case 'boardpostmanage':
      return <BoardPostManage />;
    case 'retreatmanage':
      return <RetreatManage />;
    case 'adminuser':
      return <AdminUser />;
    case 'adminstaff':
      return <AdminStaffManage />;
    case 'adminmanage':
      return <AdminManege />;
    case 'backup':
      return <Backup />;
    default:
      return <AdminTodoManage />;
  }
}

export default function Main(props: any) {
  const navigate = useNavigate();
  const adminSession = getAdminSession();
  const userData = adminSession?.email ?? sessionStorage.getItem('user');
  const superAdmin = isSuperAdmin(adminSession);
  const [activeMenu, setActiveMenu] = useState<MenuKey>('admintodos');

  const visibleMenus = useMemo(
    () => MENU_ITEMS.filter((item) => canViewMenuItem(item, adminSession)),
    [adminSession]
  );

  useEffect(() => {
    const activeMenuVisible = visibleMenus.some((menu) => menu.key === activeMenu);
    if (!activeMenuVisible && visibleMenus.length > 0) {
      setActiveMenu(visibleMenus[0].key);
    }
  }, [activeMenu, visibleMenus]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin');
    window.scrollTo(0, 0);
  };

  return (
    <div className="AdminContainer admin-main-shell">
      <header className="admin-main-shell__topbar">
        <div className="admin-main-shell__brand">Ministermore Admin</div>
        <div className="admin-main-shell__user">
          <TopbarAttendance />
          <button
            type="button"
            className="admin-main-shell__home-btn"
            onClick={() => navigate('/')}
          >
            홈
          </button>
          <button
            type="button"
            className="admin-main-shell__home-btn admin-main-shell__logout-btn"
            onClick={handleLogout}
          >
            로그아웃
          </button>
          <span className="admin-main-shell__user-name">
            {adminSession?.name || userData || 'admin'}
          </span>
          <span className="admin-main-shell__user-role">
            {superAdmin ? '최종관리자' : '관리자'}
          </span>
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
            <AdminMainContent activeMenu={activeMenu} adminSession={adminSession} />
          </div>
        </section>
      </div>
    </div>
  );
}
