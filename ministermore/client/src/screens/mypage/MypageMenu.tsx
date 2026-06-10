import { useNavigate, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { path: '/mypage', label: '프로필' },
  { path: '/mypage/scrapmanage', label: '스크랩 관리' },
  { path: '/mypage/postingmanage', label: '공고글 관리' },
  { path: '/mypage/resumemanage', label: '이력서 관리' },
  { path: '/mypage/servicemanage', label: '서비스 관리' },
] as const;

export default function MypageMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/mypage') {
      return location.pathname === '/mypage' || location.pathname === '/mypage/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="subpage__menu">
      <div className="subpage__menu__title">마이페이지</div>
      <div className="subpage__menu__list">
        {MENU_ITEMS.map(({ path, label }) => (
          <div
            key={path}
            onClick={() => {
              navigate(path);
              window.scrollTo(0, 0);
            }}
            className={`subpage__menu__item ${isActive(path) ? 'subpage__menu__item--on' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
