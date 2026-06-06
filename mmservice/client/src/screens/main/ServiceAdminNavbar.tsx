import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { recoilLoginState, recoilLoginPath, recoilUserData } from '../../RecoilStore';
import {
  SERVICE_ADMIN_NAV_ITEMS,
  isServiceAdminNavActive,
} from './serviceAdminNavItems';
import './Main.scss';

export default function ServiceAdminNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLogin = useRecoilValue(recoilLoginState);
  const loginPath = useRecoilValue(recoilLoginPath);
  const [userData, setUserData] = useRecoilState(recoilUserData);

  const displayName = useMemo(() => {
    if (userData?.userNickName) return `${userData.userNickName}님`;
    return '게스트';
  }, [userData?.userNickName]);

  const avatarInitial = useMemo(() => {
    const name = userData?.userNickName?.trim();
    return name ? name.charAt(0) : 'G';
  }, [userData?.userNickName]);

  const handleLogout = () => {
    localStorage.clear();
    setUserData({
      userAccount: '',
      userNickName: '',
      userSort: '',
      userDetail: '',
      grade: '',
      authInstitution: '',
      authChurch: '',
      authDepartment: '',
      authGroup: '',
    });
    window.location.replace(loginPath || '/login');
  };

  const goTo = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <nav className="service-admin__navbar">
      <div className="service-admin__container service-admin__nav-inner">
        <button
          type="button"
          className="service-admin__nav-logo"
          onClick={() => goTo('/')}
        >
          <div className="service-admin__logo-icon">MM</div>
          <span>
            사역자모아 <span className="service-admin__logo-accent">서비스관리자</span>
          </span>
        </button>

        <ul className="service-admin__nav-menu">
          {SERVICE_ADMIN_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={isServiceAdminNavActive(pathname, item) ? 'active' : undefined}
                onClick={() => item.path && goTo(item.path)}
                disabled={!item.path}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="service-admin__nav-right">
          <button type="button" className="service-admin__icon-btn" aria-label="알림">
            🔔
            <span className="service-admin__badge" />
          </button>
          <div className="service-admin__user-info">
            <div className="service-admin__avatar">{avatarInitial}</div>
            <span className="service-admin__user-name">{displayName}</span>
          </div>
          {isLogin ? (
            <button type="button" className="service-admin__logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          ) : (
            <button type="button" className="service-admin__logout-btn" onClick={() => navigate('/login')}>
              로그인
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
