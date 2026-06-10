import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';
import Login from '../login/Login';
import MainSiteURL from '../../MainSiteURL';
import { fetchDashboardSubscriptions } from '../../api/dashboardApi';
import {
  EMPTY_SERVICE_SUBSCRIPTIONS,
  SERVICE_CATALOG,
  type ServiceSubscriptions,
  type ServiceTypeKey,
} from '../../constants/serviceCatalog';
import './Main.scss';

function formatExpireLabel(expireDate: string | null) {
  if (!expireDate) return '만료일 없음';
  return `만료일 ${expireDate}`;
}

export default function Main() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);

  const [subscriptions, setSubscriptions] = useState<ServiceSubscriptions>(EMPTY_SERVICE_SUBSCRIPTIONS);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (userData?.userNickName) return `${userData.userNickName}님`;
    return '게스트';
  }, [userData?.userNickName]);

  const ministryInfo = useMemo(() => {
    const parts = [
      userData?.authChurch,
      userData?.authDepartment,
      userData?.authInstitution,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : '등록된 교회/사역자 정보가 없습니다.';
  }, [userData?.authChurch, userData?.authDepartment, userData?.authInstitution]);

  useEffect(() => {
    const userId = userData?.userAccount?.trim();
    if (!isLogin || !userId) {
      setSubscriptions(EMPTY_SERVICE_SUBSCRIPTIONS);
      return;
    }

    let cancelled = false;
    setLoadingSubs(true);
    setSubsError(null);

    fetchDashboardSubscriptions(userId)
      .then((data) => {
        if (!cancelled) setSubscriptions(data.subscriptions);
      })
      .catch((err) => {
        if (!cancelled) {
          setSubscriptions(EMPTY_SERVICE_SUBSCRIPTIONS);
          setSubsError(err instanceof Error ? err.message : '구독 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSubs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLogin, userData?.userAccount]);

  if (!isLogin) {
    return <Login />;
  }

  const goTo = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const openServiceApply = (serviceKey: ServiceTypeKey, url: string) => {
    if (serviceKey !== 'FLYER_RETREAT') {
      alert('준비중입니다');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const mainSiteBase = MainSiteURL.replace(/\/$/, '');

  return (
    <div className="service-admin">
      <section className="service-admin__hero">
        <div className="service-admin__container service-admin__hero-inner">
          <div className="service-admin__hero-text">
            <p className="service-admin__ministry-label">교회 / 사역자 정보</p>
            <p className="service-admin__ministry-value">{ministryInfo}</p>
            <h1>
              환영합니다, <span className="service-admin__highlight">{displayName}</span> 👋
            </h1>
            <p>보유하신 서비스 권한에 따라 관리 메뉴가 열립니다.</p>
            {loadingSubs ? (
              <p className="service-admin__subs-status">구독 정보를 불러오는 중…</p>
            ) : null}
            {subsError ? (
              <p className="service-admin__subs-status service-admin__subs-status--error">{subsError}</p>
            ) : null}
          </div>
          <div className="service-admin__hero-illust">
            <span className="service-admin__hero-illust-emoji">⛪</span>
          </div>
        </div>
      </section>

      <section className="service-admin__services">
        <div className="service-admin__container">
          <h2 className="service-admin__section-title">
            <span className="service-admin__title-bar" />
            내 서비스
          </h2>

          <div className="service-admin__service-grid service-admin__service-grid--five">
            {SERVICE_CATALOG.map((service) => {
              const access = subscriptions[service.key];
              const locked = !access.hasAccess;

              return (
                <article
                  key={service.key}
                  className={`service-admin__service-card ${service.cardClass}${
                    locked ? ' service-admin__service-card--locked' : ''
                  }`}
                >
                  <div className="service-admin__service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p className="service-admin__desc">{service.description}</p>
                  <p className="service-admin__expire">{formatExpireLabel(access.expireDate)}</p>
                  <div className="service-admin__service-stats">
                    {locked ? (
                      <>
                        <span className="service-admin__lock-label" aria-hidden>
                          🔒
                        </span>
                        <button
                          type="button"
                          className="service-admin__card-btn service-admin__card-btn--apply"
                          onClick={() => openServiceApply(service.key, service.applyUrl)}
                        >
                          서비스 신청하기
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="service-admin__card-btn"
                        onClick={() => goTo(service.path)}
                      >
                        바로 관리하기 →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
