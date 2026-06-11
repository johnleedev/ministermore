import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';
import Login from '../login/Login';
import MainSiteURL from '../../MainSiteURL';
import { fetchDashboardSubscriptions } from '../../api/dashboardApi';
import {
  EMPTY_SERVICE_SUBSCRIPTIONS,
  SERVICE_CATALOG,
  type ServiceCatalogItem,
  type ServiceSubscriptions,
  type ServiceTypeKey,
} from '../../constants/serviceCatalog';
import Loading from '../../components/Loading';
import './Main.scss';

function formatExpireLabel(expireDate: string | null) {
  if (!expireDate) return '만료일 없음';
  return `만료 ${expireDate}`;
}

function ServiceCardIcon({ serviceKey }: { serviceKey: ServiceTypeKey }) {
  const props = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (serviceKey) {
    case 'FLYER_RETREAT':
      return (
        <svg {...props}>
          <path d="M3 20l9-16 9 16H3z" />
          <path d="M12 4v16" />
          <path d="M7 20l5-9 5 9" />
        </svg>
      );
    case 'CHURCH_APP':
      return (
        <svg {...props}>
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case 'ATTENDANCE':
      return (
        <svg {...props}>
          <path d="M4 4h13a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z" />
          <line x1="4" y1="4" x2="4" y2="22" />
          <polyline points="9 11 11 13 15 9" />
        </svg>
      );
    case 'FLYER_INTRO':
      return (
        <svg {...props}>
          <path d="M3 21h18" />
          <path d="M5 21V9l7-5 7 5v12" />
          <path d="M12 4v3" />
          <path d="M10 4h4" />
          <rect x="9" y="13" width="6" height="8" />
        </svg>
      );
    case 'FLYER_EVENT':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
          <polygon points="12 13 13.2 15.5 16 16 14 18 14.5 20.8 12 19.4 9.5 20.8 10 18 8 16 10.8 15.5" />
        </svg>
      );
    default:
      return null;
  }
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

type ServiceCardProps = {
  service: ServiceCatalogItem;
  locked: boolean;
  expireDate: string | null;
  onManage: () => void;
  onApply: () => void;
};

function ServiceCard({ service, locked, expireDate, onManage, onApply }: ServiceCardProps) {
  const handleClick = () => {
    if (locked) {
      onApply();
      return;
    }
    onManage();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={`service-admin__card ${service.cardClass}${
        locked ? ' service-admin__card--locked' : ''
      }`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="service-admin__card-icon">
        <ServiceCardIcon serviceKey={service.key} />
      </div>
      <h3 className="service-admin__card-title">{service.title}</h3>
      <p className="service-admin__card-desc">{service.description}</p>
      <div className="service-admin__card-meta">
        {locked ? (
          <>
            <span className="service-admin__badge service-admin__badge--outline">미이용</span>
            <span className="service-admin__badge service-admin__badge--gray">신청 필요</span>
          </>
        ) : (
          <>
            <span className="service-admin__badge">이용 가능</span>
            <span className="service-admin__badge service-admin__badge--gray">
              {formatExpireLabel(expireDate)}
            </span>
          </>
        )}
      </div>
      <span className="service-admin__card-cta">
        {locked ? '서비스 신청하기' : '바로가기'}
        <ArrowIcon />
      </span>
    </article>
  );
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

  const [topServices, bottomServices] = useMemo(() => {
    const top = SERVICE_CATALOG.slice(0, 3);
    const bottom = SERVICE_CATALOG.slice(3);
    return [top, bottom] as const;
  }, []);

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

  if (loadingSubs) {
    return (
      <div className="service-admin service-admin--loading">
        <div className="service-admin__loading-screen">
          <Loading />
          <p className="service-admin__loading-text">구독 정보를 불러오는 중…</p>
        </div>
      </div>
    );
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

  const renderServiceCard = (service: ServiceCatalogItem) => {
    const access = subscriptions[service.key];
    const locked = !access.hasAccess;

    return (
      <ServiceCard
        key={service.key}
        service={service}
        locked={locked}
        expireDate={access.expireDate}
        onManage={() => goTo(service.path)}
        onApply={() => openServiceApply(service.key, service.applyUrl)}
      />
    );
  };

  return (
    <div className="service-admin">
      <section className="service-admin__hero">
        <div className="service-admin__hero-inner">
          <span className="service-admin__hero-eyebrow">
            <StarIcon />
            {displayName}, 환영합니다
          </span>
          <h1>어떤 서비스를 관리하시겠어요?</h1>
          <p>관리하실 서비스를 선택해주세요</p>
          {subsError ? (
            <p className="service-admin__subs-status service-admin__subs-status--error">{subsError}</p>
          ) : null}
        </div>
      </section>

      <main className="service-admin__main">
        <div className="service-admin__grid">{topServices.map(renderServiceCard)}</div>
        <div className="service-admin__grid-bottom">{bottomServices.map(renderServiceCard)}</div>
      </main>

      <footer className="service-admin__footer">
        © 2026 사역자모아 ·{' '}
        <a href={mainSiteBase} target="_blank" rel="noopener noreferrer">
          ministermore.co.kr
        </a>{' '}
        · 서비스 관리자
      </footer>
    </div>
  );
}
