import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { recoilRetreatAuth } from '../../RecoilStore';
import { loginRetreat } from '../../api/retreatApi';
import MainSiteURL from '../../MainSiteURL';
import {
  SERVICE_CATALOG,
  type ServiceCatalogItem,
  type ServiceTypeKey,
} from '../../constants/serviceCatalog';
import './Main.scss';

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
  onManage: () => void;
  onApply: () => void;
};

function ServiceCard({ service, locked, onManage, onApply }: ServiceCardProps) {
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
        locked ? ' service-admin__card--locked' : ' service-admin__card--active'
      }`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {!locked ? <span className="service-admin__card-status">이용 중</span> : null}
      <div className="service-admin__card-icon">
        <ServiceCardIcon serviceKey={service.key} />
      </div>
      <h3 className="service-admin__card-title">{service.title}</h3>
      <p className="service-admin__card-desc">{service.description}</p>
      <div className="service-admin__card-meta">
        {locked ? (
          <>
            <span className="service-admin__badge service-admin__badge--locked">미이용</span>
            <span className="service-admin__badge service-admin__badge--gray">신청 필요</span>
          </>
        ) : (
          <>
            <span className="service-admin__badge service-admin__badge--success">이용 가능</span>
            <span className="service-admin__badge service-admin__badge--gray">로그인됨</span>
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
  const retreatAuth = useRecoilValue(recoilRetreatAuth);
  const [, setRetreatAuth] = useRecoilState(recoilRetreatAuth);

  const [churchNameInput, setChurchNameInput] = useState('');
  const [passwdInput, setPasswdInput] = useState('');
  const [ownerpwInput, setOwnerpwInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const heroMessage = useMemo(() => {
    if (!retreatAuth.loggedIn) return '로그인이 필요합니다';
    if (retreatAuth.churchName) {
      const roleLabel = retreatAuth.role === 'admin' ? '관리자' : '';
      return `${retreatAuth.churchName}${roleLabel ? ` (${roleLabel})` : ''}님, 환영합니다`;
    }
    return '환영합니다';
  }, [retreatAuth]);

  const [topServices, bottomServices] = useMemo(() => {
    const top = SERVICE_CATALOG.slice(0, 3);
    const bottom = SERVICE_CATALOG.slice(3);
    return [top, bottom] as const;
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const churchName = churchNameInput.trim();
    const passwd = passwdInput.trim();
    const ownerpw = ownerpwInput.trim();

    if (!churchName || !passwd) {
      setLoginError('교회 이름과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const result = await loginRetreat({
        churchName,
        passwd,
        ...(ownerpw ? { ownerpw } : {}),
      });
      setRetreatAuth({
        loggedIn: true,
        churchName: result.churchName,
        passwd,
        ownerpw: result.role === 'admin' ? ownerpw : '',
        role: result.role,
      });
      setOwnerpwInput('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

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
    const locked = service.key === 'FLYER_RETREAT' ? !retreatAuth.loggedIn : true;

    return (
      <ServiceCard
        key={service.key}
        service={service}
        locked={locked}
        onManage={() => {
          if (service.key === 'FLYER_RETREAT' && !retreatAuth.loggedIn) {
            setLoginError('수련회 전단지 관리를 위해 먼저 로그인해 주세요.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          goTo(service.path);
        }}
        onApply={() => openServiceApply(service.key, service.applyUrl)}
      />
    );
  };

  return (
    <div className="service-admin">
      <section className="service-admin__hero">
        <div className="service-admin__hero-inner">
          <span
            className={`service-admin__hero-eyebrow${
              !retreatAuth.loggedIn ? ' service-admin__hero-eyebrow--login-required' : ''
            }`}
          >
            {retreatAuth.loggedIn ? <StarIcon /> : null}
            {heroMessage}
          </span>
          <h1>어떤 서비스를 관리하시겠어요?</h1>
          <p>관리하실 서비스를 선택해주세요</p>

          {!retreatAuth.loggedIn ? (
            <form className="service-admin__login" onSubmit={handleLogin}>
              <p className="service-admin__login-lead">
                결제 시 안내받은 교회 이름과 비밀번호로 로그인하세요.
              </p>
              <div className="service-admin__login-grid">
                <label className="service-admin__login-field">
                  <span>교회 이름</span>
                  <input
                    type="text"
                    value={churchNameInput}
                    onChange={(e) => setChurchNameInput(e.target.value)}
                    placeholder="예) ○○교회"
                    autoComplete="organization"
                  />
                </label>
                <label className="service-admin__login-field">
                  <span>비밀번호 (사역자모아 '마이페이지'에서 확인하세요)</span>
                  <input
                    type="password"
                    value={passwdInput}
                    onChange={(e) => setPasswdInput(e.target.value)}
                    placeholder="결제 완료 시 안내된 비밀번호"
                    autoComplete="current-password"
                  />
                </label>
                <label className="service-admin__login-field">
                  <span>관리자 비밀번호 (관리자만)</span>
                  <input
                    type="password"
                    value={ownerpwInput}
                    onChange={(e) => setOwnerpwInput(e.target.value)}
                    placeholder="관리자 로그인 시에만 입력"
                    autoComplete="new-password"
                  />
                </label>
              </div>
              {loginError ? (
                <p className="service-admin__login-error" role="alert">
                  {loginError}
                </p>
              ) : null}
              <button
                type="submit"
                className="service-admin__login-btn"
                disabled={loginLoading}
              >
                {loginLoading ? '로그인 중…' : '로그인'}
              </button>
            </form>
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
