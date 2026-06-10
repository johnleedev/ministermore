import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { recoilLoginPath, recoilLoginState, recoilUserData } from '../RecoilStore';
import logoPng from '../images/logopng.png';
import {
  SERVICE_ADMIN_NAV_ITEMS,
  isServiceAdminNavActive,
  isServiceAdminNavEnabled,
  type ServiceAdminNavItem,
} from './serviceAdminNavItems';
import '../screens/main/Main.scss';
import './Header.scss';

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLogin = useRecoilValue(recoilLoginState);
  const loginPath = useRecoilValue(recoilLoginPath);
  const [userData, setUserData] = useRecoilState(recoilUserData);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = useMemo(() => {
    if (userData?.userNickName) return `${userData.userNickName}님`;
    return '게스트';
  }, [userData?.userNickName]);

  const avatarInitial = useMemo(() => {
    const name = userData?.userNickName?.trim();
    return name ? name.charAt(0) : 'G';
  }, [userData?.userNickName]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

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
    closeMenu();
    window.location.replace(loginPath || '/login');
  };

  const goTo = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
    closeMenu();
  };

  const handleNavClick = (item: ServiceAdminNavItem) => {
    if (!isServiceAdminNavEnabled(item)) {
      alert('준비중입니다');
      return;
    }
    if (item.path) goTo(item.path);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const prev = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverscroll: document.body.style.overscrollBehavior,
      htmlOverflow: document.documentElement.style.overflow,
      htmlHeight: document.documentElement.style.height,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
    };

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.left = prev.bodyLeft;
      document.body.style.right = prev.bodyRight;
      document.body.style.width = prev.bodyWidth;
      document.body.style.overscrollBehavior = prev.bodyOverscroll;
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.documentElement.style.height = prev.htmlHeight;
      document.documentElement.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  return (
    <div className="service-admin service-admin--header-only">
      <nav className="service-admin__navbar">
        <div className="service-admin__container service-admin__nav-inner">
          <button
            type="button"
            className="service-admin__nav-logo"
            onClick={() => goTo('/')}
          >
            <img src={logoPng} alt="사역자모아" className="service-admin__logo-img" />
            <span className="service-admin__logo-text">
              사역자모아{' '}
              <span className="service-admin__logo-accent service-admin__logo-accent--sub">
                서비스관리자
              </span>
            </span>
          </button>

          <ul className="service-admin__nav-menu service-admin__nav-menu--desktop">
            {SERVICE_ADMIN_NAV_ITEMS.map((item) => {
              const enabled = isServiceAdminNavEnabled(item);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={[
                      isServiceAdminNavActive(pathname, item) ? 'active' : '',
                      !enabled ? 'disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="service-admin__nav-right service-admin__nav-right--desktop">
            <div className="service-admin__user-info">
              <div className="service-admin__avatar">{avatarInitial}</div>
              <span className="service-admin__user-name">{displayName}</span>
            </div>
            {isLogin ? (
              <button type="button" className="service-admin__logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            ) : (
              <button
                type="button"
                className="service-admin__logout-btn"
                onClick={() => navigate('/login')}
              >
                로그인
              </button>
            )}
          </div>

          <div
            className={`service-admin__hamburger ${menuOpen ? 'service-admin__hamburger--open' : ''}`}
          >
            <button
              type="button"
              className="service-admin__hamburger-btn"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              <span className="service-admin__hamburger-icon" />
            </button>

            {menuOpen && (
              <button
                type="button"
                className="service-admin__mobile-overlay"
                aria-label="메뉴 닫기"
                onClick={closeMenu}
              />
            )}

            <div className="service-admin__mobile-panel">
              <div className="service-admin__mobile-panel-inner">
                <div className="service-admin__mobile-user">
                  <div className="service-admin__user-info">
                    <div className="service-admin__avatar">{avatarInitial}</div>
                    <span className="service-admin__user-name">{displayName}</span>
                  </div>
                  {isLogin ? (
                    <button
                      type="button"
                      className="service-admin__logout-btn"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="service-admin__logout-btn"
                      onClick={() => goTo('/login')}
                    >
                      로그인
                    </button>
                  )}
                </div>

                <button type="button" className="service-admin__mobile-notify" aria-label="알림">
                  🔔 알림
                  <span className="service-admin__badge" />
                </button>

                <ul className="service-admin__mobile-nav">
                  {SERVICE_ADMIN_NAV_ITEMS.map((item) => {
                    const enabled = isServiceAdminNavEnabled(item);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={[
                            isServiceAdminNavActive(pathname, item) ? 'active' : '',
                            !enabled ? 'disabled' : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined}
                          onClick={() => handleNavClick(item)}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
