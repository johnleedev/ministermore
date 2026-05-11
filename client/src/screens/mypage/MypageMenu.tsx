import { useNavigate, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { path: '/mypage', label: '프로필' },
  { path: '/mypage/postingmanage', label: '공고글 관리' },
  { path: '/mypage/resumemanage', label: '이력서 관리' },
  { path: '/mypage/servicemanage', label: '서비스 관리' },
] as const;

const SERVICE_SUB_ITEMS = [
  { path: '/mypage/servicemanage/mobile-church-notice', label: '모바일교회전단지' },
  { path: '/mypage/servicemanage/mobile-event-notice', label: '모바일행사전단지' },
  // { path: '/mypage/church-bulletin', label: '교회주보' },
  { path: '/mypage/homeinapp-notification', label: '홈인앱알림' },
] as const;

export default function MypageMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/mypage') {
      return location.pathname === '/mypage' || location.pathname === '/mypage/';
    }
    if (path === '/mypage/servicemanage') {
      return (
        location.pathname.startsWith('/mypage/servicemanage') ||
        location.pathname === '/mypage/church-bulletin' ||
        location.pathname === '/mypage/homeinapp-notification'
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="subpage__menu">
      <div className="subpage__menu__title">마이페이지</div>
      <div className="subpage__menu__list">
        {MENU_ITEMS.map(({ path, label }) => (
          <div key={path}>
            <div
              onClick={() => {
                const nextPath = path === '/mypage/servicemanage'
                  ? '/mypage/servicemanage/mobile-church-notice'
                  : path;
                navigate(nextPath);
                window.scrollTo(0, 0);
              }}
              className={`subpage__menu__item ${isActive(path) ? 'subpage__menu__item--on' : ''}`}
            >
              {label}
            </div>
            {path === '/mypage/servicemanage' && isActive(path) && (
              <div className="subpage__menu__sublist">
                {SERVICE_SUB_ITEMS.map((sub) => (
                  <div
                    key={sub.path}
                    onClick={() => {
                      navigate(sub.path);
                      window.scrollTo(0, 0);
                    }}
                    className={`subpage__menu__subitem ${
                      location.pathname === sub.path ? 'subpage__menu__subitem--on' : ''
                    }`}
                  >
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
