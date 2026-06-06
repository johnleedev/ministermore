import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import MainSiteURL from '../../MainSiteURL';
import ServiceAdminNavbar from './ServiceAdminNavbar';
import './Main.scss';

const SERVICE_CARDS = [
  {
    id: 'card-1',
    icon: '📱',
    title: '모바일 전단지',
    desc: 'QR로 공유하는 모바일 최적화 전단지를 손쉽게 수정하고 배포하세요.',
    count: 3,
    path: '/service/notice',
  },
  {
    id: 'card-2',
    icon: '📣',
    title: '행사 전단지',
    desc: '교회 행사·집회 안내 전단지를 수정하고 공유하세요.',
    count: 1,
    path: '/service/event',
  },
  {
    id: 'card-3',
    icon: '⛪',
    title: '교회 전용 앱',
    desc: '교회 공지·주보·예배 영상까지 한 번에 관리하는 모바일 앱.',
    count: 2,
    path: '/service/churchapp',
  },
  {
    id: 'card-4',
    icon: '🌐',
    title: '웹앱(홈인앱)',
    desc: '교회 홈페이지형 웹앱과 푸시 알림을 관리하세요.',
    count: 2,
    path: '/service/homeinapp',
  },
] as const;

const HERO_TAGS = [
  { icon: '📱', label: '전단지 3' },
  { icon: '⛪', label: '교회앱 1' },
  { icon: '🌐', label: '웹앱 2' },
] as const;

const CHART_BARS = [
  { label: '월', value: '820', height: 45, highlight: false },
  { label: '화', value: '1.1k', height: 60, highlight: false },
  { label: '수', value: '980', height: 55, highlight: false },
  { label: '목', value: '1.6k', height: 85, highlight: true },
  { label: '금', value: '1.3k', height: 70, highlight: false },
  { label: '토', value: '1.8k', height: 90, highlight: false },
  { label: '일', value: '2.0k', height: 95, highlight: true },
] as const;

const ACTIVITIES = [
  { icon: '📱', text: '새 모바일 전단지가 발행되었습니다.', time: '10분 전' },
  { icon: '⛪', text: '교회 앱 공지사항이 업데이트되었습니다.', time: '2시간 전' },
  { icon: '💳', text: '정기결제가 정상 처리되었습니다.', time: '어제' },
] as const;

export default function Main() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);

  const displayName = useMemo(() => {
    if (userData?.userNickName) return `${userData.userNickName}님`;
    return '게스트';
  }, [userData?.userNickName]);

  const avatarInitial = useMemo(() => {
    const name = userData?.userNickName?.trim();
    return name ? name.charAt(0) : 'G';
  }, [userData?.userNickName]);

  const goTo = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const mainSiteBase = MainSiteURL.replace(/\/$/, '');

  return (
    <div className="service-admin">
      <ServiceAdminNavbar />

      <section className="service-admin__hero">
        <div className="service-admin__container service-admin__hero-inner">
          <div className="service-admin__hero-text">
            <h1>
              환영합니다, <span className="service-admin__highlight">{displayName}</span> 👋
            </h1>
            <p>사역자모아에서 제작하신 서비스를 한 곳에서 편리하게 관리하세요.</p>
            <div className="service-admin__hero-meta">
              {HERO_TAGS.map((tag) => (
                <span key={tag.label} className="service-admin__tag">
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          </div>
          <div className="service-admin__hero-illust">
            <span className="service-admin__hero-illust-emoji">👨‍💼</span>
          </div>
        </div>
      </section>

      <section className="service-admin__services">
        <div className="service-admin__container">
          <h2 className="service-admin__section-title">
            <span className="service-admin__title-bar" />
            내 서비스 관리
            <a
              href={`${mainSiteBase}/service`}
              className="service-admin__more"
              target="_blank"
              rel="noopener noreferrer"
            >
              전체보기 →
            </a>
          </h2>

          <div className="service-admin__service-grid">
            {SERVICE_CARDS.map((card) => (
              <div
                key={card.id}
                className={`service-admin__service-card ${card.id}${card.path ? '' : ' service-admin__service-card--disabled'}`}
                onClick={() => card.path && goTo(card.path)}
                onKeyDown={(e) => card.path && e.key === 'Enter' && goTo(card.path)}
                role={card.path ? 'button' : undefined}
                tabIndex={card.path ? 0 : undefined}
              >
                <div className="service-admin__service-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p className="service-admin__desc">{card.desc}</p>
                <div className="service-admin__service-stats">
                  <span className="service-admin__stats-num">
                    <strong>{card.count}</strong>개 운영중
                  </span>
                  <button
                    type="button"
                    className="service-admin__card-btn"
                    disabled={!card.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (card.path) goTo(card.path);
                    }}
                  >
                    {card.path ? '관리하기 →' : '준비 중'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="service-admin__container">
        <div className="service-admin__bottom-section">
          <div className="service-admin__panel">
            <h3 className="service-admin__panel-title">
              <span className="service-admin__icon-dot" />
              내 서비스 현황
            </h3>
            <div className="service-admin__status-grid">
              <div className="service-admin__status-item">
                <div className="service-admin__label">총 방문자</div>
                <div className="service-admin__value">
                  12,458<span className="service-admin__unit">명</span>
                </div>
                <div className="service-admin__change">▲ 8.2% 지난주 대비</div>
              </div>
              <div className="service-admin__status-item">
                <div className="service-admin__label">이번달 신규</div>
                <div className="service-admin__value">
                  5<span className="service-admin__unit">건</span>
                </div>
                <div className="service-admin__change">▲ 2건 추가</div>
              </div>
              <div className="service-admin__status-item service-admin__status-item--payment service-admin__status-item--full">
                <div>
                  <div className="service-admin__label">결제 정보</div>
                  <div className="service-admin__value">정기결제 / 매월 1일</div>
                </div>
                <button type="button" className="service-admin__pay-btn">
                  관리 →
                </button>
              </div>
            </div>
          </div>

          <div className="service-admin__panel">
            <h3 className="service-admin__panel-title">
              <span className="service-admin__icon-dot" />
              사용자 통계
            </h3>
            <div className="service-admin__chart-wrap">
              {CHART_BARS.map((bar) => (
                <div
                  key={bar.label}
                  className={`service-admin__bar${bar.highlight ? ' service-admin__bar--highlight' : ''}`}
                  style={{ height: `${bar.height}%` }}
                >
                  <span className="service-admin__bar-value">{bar.value}</span>
                  <span className="service-admin__bar-label">{bar.label}</span>
                </div>
              ))}
            </div>
            <div className="service-admin__chart-legend">
              <span>
                <span className="service-admin__dot" />
                주간 방문자 추이
              </span>
              <span className="service-admin__chart-trend">+18.4% ▲</span>
            </div>
          </div>

          <div className="service-admin__panel">
            <h3 className="service-admin__panel-title">
              <span className="service-admin__icon-dot" />
              최근 활동
            </h3>
            <ul className="service-admin__activity-list">
              {ACTIVITIES.map((item) => (
                <li key={item.text}>
                  <div className="service-admin__activity-icon">{item.icon}</div>
                  <div>
                    <div className="service-admin__activity-text">{item.text}</div>
                    <div className="service-admin__activity-time">{item.time}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="service-admin__support-btn">
              💬 고객지원 문의하기
            </button>
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
