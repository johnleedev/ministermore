import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./HomeinappMain.scss";
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import heroHomeinappVisual from "../../../images/service/homeinappmain.jpeg";
import pushAdminImage from "../../../images/service/pushadmin.png";
import googleStoreBadge from "../../../images/service/googlestore.png";
import appStoreBadge from "../../../images/service/appstore.png";
import sample1Logo from "./sample1logo.png";

const PROBLEM_CARDS = [
  {
    num: "01",
    title: "공지 전달이 느립니다",
    text: "예배 시간 변경, 행사 안내, 부서 공지처럼 즉시 전달이 필요한 정보가 홈페이지 메뉴 깊숙이 묻히기 쉽습니다.",
  },
  {
    num: "02",
    title: "모바일 사용성은 점점 중요합니다",
    text: "검색보다 홈화면 바로가기, 간단한 메뉴, 빠른 이동을 더 선호하는 흐름에 맞춘 접근이 필요합니다.",
  },
];


const PRICING_FEATURES = [
  "실시간 교회 데이터 연동",
  "Playstore 등록",
  "Appstore 등록",
  "푸시메시지 무제한 발송 가능",
  "Pull to Refresh(당겨서 새고로침)",
  "Custom URL 지원",
  "Deeplink 지원",
  "무제한 MAU"
];

const BADGES = ["기존 홈페이지 활용", "새로 개발하지 않아도 됨", "빠른 도입", "교회 맞춤"];

const SAMPLE_APPSTORE_URL =
  "https://apps.apple.com/us/app/%EC%82%AC%EC%97%AD%EC%9E%90%EB%AA%A8%EC%95%84%EC%9B%B9%EC%95%B1/id6764722269";
const SAMPLE_PLAYSTORE_URL =
  "https://play.google.com/store/apps/details?id=com.ministermoreweb";

export default function HomeinappMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onApply = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      navigate("/service/homeinapp/payment");
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  const goToHomeinappPayment = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      navigate("/service/homeinapp/payment");
    } else {
      alert("결제를 위해 로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="homeinapp-main">
      <main id="top">
        <section className="homeinapp-main__hero" aria-label="홈인앱 소개">
          <div className="homeinapp-main__container homeinapp-main__hero-inner">
            <div className="homeinapp-main__eyebrow">
              <span className="homeinapp-main__eyebrow-dot" aria-hidden />
              기존 홈페이지 그대로 · 교회 맞춤 웹앱
            </div>
            <h1 className="homeinapp-main__title">
              기존의 교회 홈페이지를
              <br />
              <span className="homeinapp-main__accent">앱으로 간편하게</span>
            </h1>
            <div className="homeinapp-main__badge-strip" aria-label="요약 배지">
              {BADGES.map((b) => (
                <span key={b} className="homeinapp-main__mini-badge">
                  {b}
                </span>
              ))}
            </div>
            <p className="homeinapp-main__hero-copy">
              새로 개발하지 않아도 됩니다. 지금 사용 중인 교회 홈페이지를 기반으로, 웹앱형 경험을 제안합니다.
            </p>
            <div className="homeinapp-main__store-badges" aria-label="스토어 배지">
              <img src={googleStoreBadge} alt="Google Play에서 보기" className="homeinapp-main__store-badge" loading="lazy" />
              <img src={appStoreBadge} alt="App Store에서 보기" className="homeinapp-main__store-badge" loading="lazy" />
            </div>
            <div className="homeinapp-main__hero-actions">
              <button type="button" className="homeinapp-main__button homeinapp-main__button--primary" onClick={onApply}>
                제작하기
              </button>
            </div>
           
            <figure className="homeinapp-main__hero-figure">
              <img
                src={heroHomeinappVisual}
                alt="교회 홈페이지와 모바일 웹앱이 연결되는 예시 화면"
                className="homeinapp-main__hero-figure-img"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section className="homeinapp-main__sample" aria-label="샘플보기">
          <div className="homeinapp-main__container">
            <div className="homeinapp-main__sample-card">
              <div className="homeinapp-main__sample-copy">
                <span className="homeinapp-main__section-kicker">Sample</span>
                <h2 className="homeinapp-main__sample-title">샘플보기</h2>
                <p className="homeinapp-main__section-desc">실제 사용자 화면을 스토어에서 확인해 보세요.</p>
              </div>

              <div className="homeinapp-main__sample-actions" aria-label="샘플 앱 스토어 링크">
                <div className="homeinapp-main__sample-app">
                  <img
                    src={sample1Logo}
                    alt="사역자모아 웹앱 아이콘"
                    className="homeinapp-main__sample-app-icon"
                    loading="lazy"
                  />
                  <div className="homeinapp-main__sample-app-meta">
                    <div className="homeinapp-main__sample-app-name">사역자모아 웹앱</div>
                    <div className="homeinapp-main__sample-app-sub">앱/웹앱 샘플</div>
                  </div>
                </div>

                <div className="homeinapp-main__store-links">
                  <a
                    className="homeinapp-main__store-link"
                    href={SAMPLE_PLAYSTORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Google Play에서 샘플보기"
                  >
                    <img
                      src={googleStoreBadge}
                      alt="Google Play에서 보기"
                      className="homeinapp-main__store-badge"
                      loading="lazy"
                    />
                  </a>
                  <a
                    className="homeinapp-main__store-link"
                    href={SAMPLE_APPSTORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="App Store에서 샘플보기"
                  >
                    <img
                      src={appStoreBadge}
                      alt="App Store에서 보기"
                      className="homeinapp-main__store-badge"
                      loading="lazy"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="homeinapp-main__section homeinapp-main__section--tight">
          <div className="homeinapp-main__container">
            <div className="homeinapp-main__section-head">
              <span className="homeinapp-main__section-kicker">Problem</span>
              <h2 className="homeinapp-main__section-title">
                왜 교회에는
                <br />
                웹앱형 서비스가 필요할까요
              </h2>
              <p className="homeinapp-main__section-desc">
                성도는 모바일에 익숙하고, 사역자는 더 빠른 전달이 필요합니다. 이미 홈페이지가 있어도 모바일
                접근성이 떨어지면 공지와 참여 동선이 약해질 수 있습니다.
              </p>
            </div>
            <div className="homeinapp-main__grid-2">
              {PROBLEM_CARDS.map((c) => (
                <article key={c.title} className="homeinapp-main__card">
                  <span className="homeinapp-main__card-num">{c.num}</span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="feature" className="homeinapp-main__section">
          <div className="homeinapp-main__container">
            <div className="homeinapp-main__section-head">
              <span className="homeinapp-main__section-kicker">Admin Page</span>
              <h2 className="homeinapp-main__section-title">
                쉽게 사용할 수 있는
                <br />
                관리자 페이지
              </h2>
            </div>

            <figure className="homeinapp-main__feature-figure">
              <img
                src={pushAdminImage}
                alt="푸시 알림 관리자 페이지 예시"
                className="homeinapp-main__feature-figure-img"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section id="pricing" className="homeinapp-main__section">
          <div className="homeinapp-main__container">
            <div className="homeinapp-main__pricing-shell">
              <div className="homeinapp-main__pricing-hero-grid">
                <div className="homeinapp-main__pricing-copy">
                  <span className="homeinapp-main__section-kicker">Pricing</span>
                  <h2>
                    앱을 만드는 초기 구축비 없이
                    <br />
                    월 구독제로 사용해보세요
                  </h2>
                  <div className="homeinapp-main__pricing-support" aria-label="요금 섹션 신뢰 포인트">
                    {BADGES.map((b) => (
                      <span key={b} className="homeinapp-main__support-pill">
                        <span className="homeinapp-main__support-dot" aria-hidden />
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <aside className="homeinapp-main__pricing-card" aria-label="사역자 멤버십 월간 플랜">
                  <p className="homeinapp-main__pricing-label">홈인앱 월간 플랜</p>
                  <div className="homeinapp-main__pricing-price-row">
                    <p className="homeinapp-main__pricing-price">₩30,000</p>
                    <div className="homeinapp-main__pricing-price-sub">/ 월 (VAT 10% 별도)</div>
                  </div>
                  <ul className="homeinapp-main__pricing-list">
                    {PRICING_FEATURES.map((t) => (
                      <li key={t}>
                        <span className="homeinapp-main__pricing-check" aria-hidden>
                          ✓
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="homeinapp-main__pricing-actions">
                    <button
                      type="button"
                      className="homeinapp-main__button homeinapp-main__button--primary"
                      onClick={goToHomeinappPayment}
                    >
                      제작하기
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="homeinapp-main__section">
          <div className="homeinapp-main__container">
            <div className="homeinapp-main__final-cta">
              <h2>
                우리 교회 홈페이지도
                <br />
                웹앱으로 만들 수 있습니다
              </h2>
              <p className="homeinapp-main__section-desc">
                기존 홈페이지 자산은 그대로 활용하고, 성도와 방문자에게는 더 쉬운 접근 경험을 제공해 보세요.
              </p>
              <div className="homeinapp-main__hero-actions">
                <button
                  type="button"
                  className="homeinapp-main__button homeinapp-main__button--primary"
                  onClick={onApply}
                >
                  제작하기
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ScrollToTopButton />
    </div>
  );
}
