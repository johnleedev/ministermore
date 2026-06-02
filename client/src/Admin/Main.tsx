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
import FinanceDashboard from './finance/FinanceDashboard';
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
  | 'finance'
  | 'adminmanage'
  | 'backup';

type MenuGroupKey = 'service-management' | 'board-management' | 'owner-only';

type MenuItem = {
  key: MenuKey;
  label: string;
  adminOnly?: boolean;
  superOnly?: boolean;
  icon: string;
};

type MenuGroup = {
  key: MenuGroupKey;
  label: string;
  icon: string;
  childKeys: MenuKey[];
  bottom?: boolean;
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
  { key: 'finance', label: '재무 관리', icon: '💰' },
  { key: 'backup', label: '백업', adminOnly: true, icon: '🗄️' },
];

const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'service-management',
    label: '서비스 관리',
    icon: '🧩',
    childKeys: ['serviceapply', 'servicedetail'],
  },
  {
    key: 'board-management',
    label: '게시판 관리',
    icon: '📝',
    childKeys: ['noticepost', 'boardpostmanage'],
  },
  {
    key: 'owner-only',
    label: '대표자 전용',
    icon: '🔒',
    childKeys: ['attendanceadmin', 'adminstaff', 'backup'],
    bottom: true,
  },
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
    case 'finance':
      return <FinanceDashboard />;
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
  const [openMenuGroups, setOpenMenuGroups] = useState<Record<MenuGroupKey, boolean>>({
    'service-management': false,
    'board-management': false,
    'owner-only': false,
  });

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

  useEffect(() => {
    const parentGroup = MENU_GROUPS.find((group) => group.childKeys.includes(activeMenu));
    if (!parentGroup) return;
    setOpenMenuGroups((prev) => ({ ...prev, [parentGroup.key]: true }));
  }, [activeMenu]);

  const visibleMenuMap = useMemo(
    () => new Map(visibleMenus.map((menu) => [menu.key, menu] as const)),
    [visibleMenus]
  );

  const groupedChildKeys = useMemo(
    () => new Set(MENU_GROUPS.flatMap((group) => group.childKeys)),
    []
  );

  const firstChildGroupMap = useMemo(() => {
    const map = new Map<MenuKey, MenuGroup>();
    MENU_GROUPS.forEach((group) => {
      const firstVisibleChild = group.childKeys.find((key) => visibleMenuMap.has(key));
      if (firstVisibleChild) map.set(firstVisibleChild, group);
    });
    return map;
  }, [visibleMenuMap]);

  const toggleMenuGroup = (groupKey: MenuGroupKey) => {
    setOpenMenuGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const normalVisibleMenus = useMemo(
    () => visibleMenus.filter((menu) => !MENU_GROUPS.some((group) => group.bottom && group.childKeys.includes(menu.key))),
    [visibleMenus]
  );

  const bottomGroups = useMemo(() => MENU_GROUPS.filter((group) => group.bottom), []);

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
            {normalVisibleMenus.map((menu) => {
              const group = firstChildGroupMap.get(menu.key);
              if (group) {
                const childMenus = group.childKeys
                  .map((key) => visibleMenuMap.get(key))
                  .filter((item): item is MenuItem => Boolean(item));
                if (childMenus.length === 0) return null;

                const isOpen = openMenuGroups[group.key];
                const isGroupActive = childMenus.some((child) => child.key === activeMenu);

                return (
                  <div key={group.key} className="admin-main-layout__menu-group">
                    <button
                      type="button"
                      className={`admin-main-layout__menu-btn admin-main-layout__menu-parent${
                        isGroupActive ? ' is-active' : ''
                      }`}
                      onClick={() => toggleMenuGroup(group.key)}
                    >
                      <span className="admin-main-layout__menu-icon" aria-hidden>{group.icon}</span>
                      <span>{group.label}</span>
                      <span className={`admin-main-layout__menu-caret${isOpen ? ' is-open' : ''}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="admin-main-layout__submenu">
                        {childMenus.map((childMenu) => (
                          <button
                            key={childMenu.key}
                            type="button"
                            className={`admin-main-layout__menu-btn admin-main-layout__submenu-btn${
                              activeMenu === childMenu.key ? ' is-active' : ''
                            }`}
                            onClick={() => {
                              window.scrollTo(0, 0);
                              setActiveMenu(childMenu.key);
                            }}
                          >
                            <span>{childMenu.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (groupedChildKeys.has(menu.key)) return null;

              return (
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
              );
            })}

            {bottomGroups.map((group) => {
              const childMenus = group.childKeys
                .map((key) => visibleMenuMap.get(key))
                .filter((item): item is MenuItem => Boolean(item));
              if (childMenus.length === 0) return null;

              const isOpen = openMenuGroups[group.key];
              const isGroupActive = childMenus.some((child) => child.key === activeMenu);

              return (
                <div key={group.key} className="admin-main-layout__menu-group admin-main-layout__menu-group--bottom">
                  <button
                    type="button"
                    className={`admin-main-layout__menu-btn admin-main-layout__menu-parent${
                      isGroupActive ? ' is-active' : ''
                    }`}
                    onClick={() => toggleMenuGroup(group.key)}
                  >
                    <span className="admin-main-layout__menu-icon" aria-hidden>{group.icon}</span>
                    <span>{group.label}</span>
                    <span className={`admin-main-layout__menu-caret${isOpen ? ' is-open' : ''}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="admin-main-layout__submenu">
                      {childMenus.map((childMenu) => (
                        <button
                          key={childMenu.key}
                          type="button"
                          className={`admin-main-layout__menu-btn admin-main-layout__submenu-btn${
                            activeMenu === childMenu.key ? ' is-active' : ''
                          }`}
                          onClick={() => {
                            window.scrollTo(0, 0);
                            setActiveMenu(childMenu.key);
                          }}
                        >
                          <span>{childMenu.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="admin-main-layout__content">
          <div className="admin-main-layout__content-body">
            <AdminMainContent activeMenu={activeMenu} adminSession={adminSession} />
          </div>
        </section>
      </div>
    </div>
  );
}
