import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState } from '../../../RecoilStore';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import './RetreatMain.scss';
import mockupRetreat from '../../../images/bookletevent/mockups/mKljmC27.jpeg';
import kakaoSampleRetreat from '../../../images/bookletevent/kakaosample/4.jpg';

const SAMPLE_BOOKLET_ID = 4;

const HERO = {
  badge: '수련회',
  title: (
    <>
      수련회를
      <br />
      모바일 한 페이지로
    </>
  ),
  desc:
    '기간·장소, 준비물, 프로그램·조 안내까지 참가자가 현장 전에 필요한 정보를 한 번에 확인할 수 있습니다.',
  stats: [
    { strong: '기간·장소', span: '한 링크에 정리' },
    { strong: '모바일 최적화', span: '참가자 동선 안내' },
    { strong: '공지·알림', span: '변경 사항 전달' },
  ],
};

const VALUE_CARDS = [
  {
    icon: '📅',
    title: '행사 정보를 한곳에',
    text: '포스터·일시·장소·강사·준비물까지 참가자가 궁금해하는 내용을 모바일 한 페이지에 정리해 전달할 수 있습니다.',
  },
  {
    icon: '📝',
    title: '신청부터 관리까지',
    text: '맞춤 신청 양식, 인원 제한, 유료·무료 옵션 등 행사 운영에 필요한 접수 흐름을 디지털로 처리할 수 있습니다.',
  },
  {
    icon: '📣',
    title: '알림으로 참여를 돕습니다',
    text: '접수 확인, 행사 전 리마인더, 긴급 공지까지 알림으로 놓치기 쉬운 일정을 챙겨 줄 수 있습니다.',
  },
];

const PROCESS_STEPS = [
  {
    step: '1',
    title: '행사 페이지 접속',
    desc: '문자, 카카오톡, QR, 홈페이지 링크로 모바일 행사 전단지에 접속합니다.',
  },
  {
    step: '2',
    title: '정보 확인·신청',
    desc: '일정과 장소를 확인하고 필요 시 모바일에서 바로 신청·결제를 완료합니다.',
  },
  {
    step: '3',
    title: '알림 수신',
    desc: '접수 확인과 행사 전 알림으로 일정을 놓치지 않도록 안내받습니다.',
  },
  {
    step: '4',
    title: '현장 참여',
    desc: '현장에서는 QR 체크인 등으로 빠르게 입장하고, 이후에도 링크로 자료를 공유할 수 있습니다.',
  },
];

const PRICING_PILLS = ['일정/준비물 안내', '참가자 동선 지원', '공지 업데이트 용이', '모바일 현장 활용'];

const PRICING_ITEMS = [
  '기간·장소·프로그램·준비물 안내 구조 반영',
  '참가자 동선과 공지 전달에 맞춘 화면 구성',
  '문자/카카오/QR 공유 흐름 지원',
  '행사 전후 변경사항 반영을 위한 기본 수정 포함',
  '체크인/신청 연동은 범위에 따라 비용 조정',
];

export default function RetreatMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);

  const openSample = useCallback(() => {
    const url = `${window.location.origin}/event?id=${SAMPLE_BOOKLET_ID}&preview=1`;
    window.open(url, '_blank');
  }, []);

  const onApply = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      navigate('/service/bookletretreatpay');
    } else {
      alert('로그인이 필요합니다.');
    }
  }, [isLogin, navigate]);

  return (
    <div className="event-main retreat-main">
      <section id="top" className="event-main__hero">
        <div className="event-main__container event-main__hero-grid">
          <div className="event-main__hero-copy">
            <div className="event-main__badge">{HERO.badge}</div>
            <h1>{HERO.title}</h1>
            <p>{HERO.desc}</p>
            <div className="event-main__hero-actions">
              <button
                type="button"
                className="event-main__btn event-main__btn--primary"
                onClick={openSample}
              >
                샘플 보기
              </button>
              <button
                type="button"
                className="event-main__btn event-main__btn--secondary"
                onClick={onApply}
              >
                제작하기
              </button>
            </div>
            <div className="event-main__hero-stats">
              {HERO.stats.map((s) => (
                <div key={s.strong} className="event-main__stat">
                  <strong>{s.strong}</strong>
                  <span>{s.span}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="event-main__hero-phone">
            <img
              src={mockupRetreat}
              alt="수련회 모바일 행사 전단지 목업"
              className="event-main__hero-mockup-image"
            />
          </div>
        </div>
      </section>

      <section id="about" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__section-head">
            <div className="event-main__badge">왜 모바일 행사 전단지인가요?</div>
            <h2>행사 홍보와 참가 관리를 한 번에 정리합니다</h2>
            <p>
              종이 전단지·별도 폼·수기 명단으로 나뉘기 쉬운 행사 안내를 모바일 한곳으로 모으면,
              참가자는 편하고 운영진은 덜 바쁩니다.
            </p>
          </div>
          <div className="event-main__card-grid-3">
            {VALUE_CARDS.map((c) => (
              <div key={c.title} className="event-main__value-card">
                <div className="event-main__value-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="event-main__section event-main__section--sample-cta">
        <div className="event-main__container">
          <div className="event-main__sample-cta">
            <div className="event-main__badge">샘플</div>
            <h2 className="event-main__sample-cta-title">
              실제 수련회 전단지 화면을 확인해 보세요
            </h2>
            <p className="event-main__sample-cta-desc">샘플이 새 창(탭)에서 열립니다.</p>
            <button
              type="button"
              className="event-main__btn event-main__btn--primary event-main__btn--sample-large"
              onClick={openSample}
            >
              샘플 보기
            </button>
          </div>
        </div>
      </section>

      <section id="process" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__process-wrap">
            <div className="event-main__badge event-main__badge--on-dark">이용 흐름</div>
            <div className="event-main__section-head event-main__section-head--on-dark">
              <h2>참가자와 운영진이 함께 따라가기 쉬운 흐름</h2>
              <p>
                링크 하나로 행사 정보 확인부터 신청, 알림 수신, 현장 체크인까지 자연스럽게 이어지도록
                설계할 수 있습니다.
              </p>
            </div>
            <div className="event-main__process-content">
              <div className="event-main__process-grid">
                {PROCESS_STEPS.map((s) => (
                  <div key={s.step} className="event-main__process-step">
                    <div className="event-main__step-num">{s.step}</div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="event-main__process-preview">
                <img
                  src={kakaoSampleRetreat}
                  alt="수련회 카카오톡 공유 샘플 화면"
                  className="event-main__process-preview-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="event-main__section">
        <div className="event-main__container">
          <div className="event-main__pricing-shell">
            <div className="event-main__pricing-copy">
              <div className="event-main__badge">Pricing</div>
              <h2 className="event-main__pricing-copy-title">
                수련회 페이지를
                <br />
                운영 흐름에 맞게 제작하세요
              </h2>
              <div className="event-main__pricing-support" aria-label="비용 섹션 포인트">
                {PRICING_PILLS.map((p) => (
                  <span key={p} className="event-main__support-pill">
                    <span className="event-main__support-dot" aria-hidden />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <aside className="event-main__pricing-card" aria-label="수련회 서비스 비용 안내">
              <div>
                <span className="event-main__pricing-label">수련회 모바일 전단지 제작비</span>
                <p className="event-main__pricing-price">
                  ₩10,000 <span>(VAT 10% 별도)</span>
                </p>
              </div>
              <ul className="event-main__pricing-list">
                {PRICING_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="event-main__pricing-actions">
                <button type="button" className="event-main__btn event-main__btn--primary" onClick={onApply}>
                  제작하기
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="event-main__section">
        <div className="event-main__container event-main__benefit-grid">
          <div id="contact" className="event-main__cta-panel">
            <div className="event-main__badge" style={{ marginBottom: '20px' }}>
              문의
            </div>
            <h3>
              이번 수련회,
              <br />
              모바일 전단지로 준비하시겠어요?
            </h3>
            <p>
              수련회·부흥회·특별 집회·세미나 등 교회 행사에 맞춘 모바일 안내 페이지로 제작해 보세요.
            </p>
            <div className="event-main__cta-actions">
              <button type="button" className="event-main__btn event-main__btn--primary" onClick={onApply}>
                제작하기
              </button>
              <button type="button" className="event-main__btn event-main__btn--secondary" onClick={openSample}>
                샘플 보기
              </button>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
}
