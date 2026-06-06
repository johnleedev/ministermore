import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./ChurchappMain.scss";
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import church01 from "../../../images/appmockup/church_01_eunhye.jpeg";
import church02 from "../../../images/appmockup/church_02_sarang.jpeg";
import church03 from "../../../images/appmockup/church_03_yaksudong.jpeg";
import church04 from "../../../images/appmockup/church_04_samil.jpeg";
import church06 from "../../../images/appmockup/church_06_seonghyeon.jpeg";
import church07 from "../../../images/appmockup/church_07_junggye.jpeg";
import church09 from "../../../images/appmockup/church_09_imae.jpeg";
import church11 from "../../../images/appmockup/church_11_seobinggo.jpeg";
import church12 from "../../../images/appmockup/church_12_banghak.jpeg";
import church13 from "../../../images/appmockup/church_13_daechi.jpeg";
import church15 from "../../../images/appmockup/church_15_gaepo.jpeg";
import church16 from "../../../images/appmockup/church_16_mokdong.jpeg";
import church17 from "../../../images/appmockup/church_17_sangbong.jpeg";
import church18 from "../../../images/appmockup/church_18_suyu.jpeg";
import church19 from "../../../images/appmockup/church_19_hwagok.jpeg";
import pushAdminImage from "../../../images/service/pushadmin.png";

const CHURCH_MOCKUP_SLIDES: { src: string; alt: string }[] = [
  { src: church01, alt: "은혜교회 앱 목업" },
  { src: church02, alt: "사랑교회 앱 목업" },
  { src: church03, alt: "약수동교회 앱 목업" },
  { src: church04, alt: "삼일교회 앱 목업" },
  { src: church06, alt: "성현교회 앱 목업" },
  { src: church07, alt: "중계동교회 앱 목업" },
  { src: church09, alt: "이매동교회 앱 목업" },
  { src: church11, alt: "서빙고교회 앱 목업" },
  { src: church12, alt: "방학동교회 앱 목업" },
  { src: church13, alt: "대치교회 앱 목업" },
  { src: church15, alt: "개포교회 앱 목업" },
  { src: church16, alt: "목동교회 앱 목업" },
  { src: church17, alt: "상봉교회 앱 목업" },
  { src: church18, alt: "수유교회 앱 목업" },
  { src: church19, alt: "화곡교회 앱 목업" },
];

const MOCKUP_ROW1 = CHURCH_MOCKUP_SLIDES.slice(0, 8);
const MOCKUP_ROW2 = CHURCH_MOCKUP_SLIDES.slice(8);

const HERO_BADGES = ["브랜드 전용 앱", "앱스토어 등록", "푸시 알림", "사역 맞춤 구성"];

const DIFFERENCE_CARDS = [
  {
    title: "브랜드 전용 앱",
    text: "교회 이름과 정체성이 앱 첫 화면부터 더 명확하게 드러나도록 설계합니다.",
  },
  {
    title: "푸시 알림 중심",
    text: "공지, 예배 안내, 행사 알림을 더 직접적으로 전달하는 운영 흐름을 만듭니다.",
  },
  {
    title: "지속 운영 구조",
    text: "설교 아카이브, 부서 동선, 새가족 안내를 장기적으로 쌓아가는 앱 기반을 제안합니다.",
  },
];

const COMPARE_WEB = {
  label: "웹앱",
  title: "빠른 연결 중심",
  lead: "기존 사이트를 활용해 가볍게 시작하고, 진입 부담을 낮추는 데 유리합니다.",
  items: ["기존 홈페이지 활용", "도입 부담을 낮춘 시작", "간단한 모바일 진입 구조"],
};

const COMPARE_APP = {
  label: "전용 앱",
  title: "브랜드 채널 중심",
  lead: "교회 이름으로 운영되는 독립 앱과 푸시, 홈 화면 노출, 확장 운영에 더 적합합니다.",
  items: ["앱스토어 기반 브랜드 노출", "푸시 알림과 홈 화면 접점", "설교·공지·부서별 확장 운영"],
};

const PRICING_PILLS = ["100만원부터 시작", "템플릿 기반 구성", "앱 내용에 따라 변동", "교회 맞춤 확장 가능"];

const PRICING_LIST = [
  "브랜드 전용 앱 템플릿을 기반으로 제작 시작",
  "앱 안에 들어가는 메뉴와 화면 수에 따라 범위 조정",
  "공지, 행사, 예배 안내를 위한 푸시 알림 구조 반영 가능",
  "설교 아카이브, 새가족 안내, 부서 동선 추가 여부에 따라 변동",
  "앱스토어 등록 및 운영 범위에 따라 상세 견적 안내",
];

export default function ChurchappMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);

  const goToChurchappPayment = useCallback(() => {
    if (isLogin) {
      navigate("/service/churchapp/payment");
      window.scrollTo(0, 0);
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="churchapp-main">
      <main id="top">
        <section className="churchapp-main__hero" aria-label="교회 전용 앱 소개">
          <div className="churchapp-main__container churchapp-main__hero-inner">
            <div className="churchapp-main__eyebrow">
              <span className="churchapp-main__eyebrow-dot" aria-hidden />
              앱스토어 · 교회 브랜드 · 푸시 알림
            </div>
            <h1 className="churchapp-main__title">
              우리 교회 이름으로
              <br />
              <span className="churchapp-main__accent">전용 앱을 시작하세요</span>
            </h1>
            <p className="churchapp-main__hero-copy">
              공지·설교·행사·새가족 안내를 하나의 앱 흐름 안에서 정리합니다.
            </p>
            <div className="churchapp-main__hero-actions">
              <button
                type="button"
                className="churchapp-main__button churchapp-main__button--primary"
                onClick={goToChurchappPayment}
              >
                제작하기
              </button>
            </div>
            <div className="churchapp-main__badge-strip" aria-label="핵심 배지">
              {HERO_BADGES.map((b) => (
                <span key={b} className="churchapp-main__mini-badge">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="churchapp-main__hero-mock-sliders" aria-label="교회 전용 앱 제작 사례 목업">
            <ChurchMockupMarqueeRow images={MOCKUP_ROW1} durationSec={30} reverse={false} />
            <ChurchMockupMarqueeRow images={MOCKUP_ROW2} durationSec={30} reverse />
          </div>
        </section>

        <section id="difference" className="churchapp-main__section churchapp-main__section--tight">
          <div className="churchapp-main__container">
            <div className="churchapp-main__section-head">
              <span className="churchapp-main__section-kicker">Difference</span>
              <h2 className="churchapp-main__section-title">
                전용 앱은 교회의
                <br />
                공식 채널이 됩니다
              </h2>
              <p className="churchapp-main__section-desc">
                빠르게 연결되는 웹앱과 달리, 전용 앱은 브랜드와 알림, 홈 화면 접점을 더 분명하게 만듭니다. 교회
                이름으로 제공되는 독립 채널이 필요한 공동체에 더 적합합니다.
              </p>
            </div>
            <div className="churchapp-main__grid-3">
              {DIFFERENCE_CARDS.map((c) => (
                <article key={c.title} className="churchapp-main__card">
                  <div className="churchapp-main__card-icon" />
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="compare" className="churchapp-main__section">
          <div className="churchapp-main__container">
            <div className="churchapp-main__section-head">
              <span className="churchapp-main__section-kicker">Compare</span>
              <h2 className="churchapp-main__section-title">
                웹앱과 전용 앱은
                <br />
                강조점이 다릅니다
              </h2>
              <p className="churchapp-main__section-desc">
                둘 다 모바일 중심이지만, 전용 앱은 더 독립적이고 공식적인 운영 채널을 만들 때 강점을 가집니다.
              </p>
            </div>
            <div className="churchapp-main__compare-shell">
              <article className="churchapp-main__compare-card">
                <span className="churchapp-main__compare-label">{COMPARE_WEB.label}</span>
                <h3>{COMPARE_WEB.title}</h3>
                <p>{COMPARE_WEB.lead}</p>
                <ul className="churchapp-main__compare-list">
                  {COMPARE_WEB.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
              <article className="churchapp-main__compare-card churchapp-main__compare-card--featured">
                <span className="churchapp-main__compare-label">{COMPARE_APP.label}</span>
                <h3>{COMPARE_APP.title}</h3>
                <p>{COMPARE_APP.lead}</p>
                <ul className="churchapp-main__compare-list">
                  {COMPARE_APP.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="feature" className="churchapp-main__section">
          <div className="churchapp-main__container">
            <div className="churchapp-main__section-head">
              <span className="churchapp-main__section-kicker">Admin Page</span>
              <h2 className="churchapp-main__section-title">
                쉽게 사용할 수 있는
                <br />
                관리자 페이지
              </h2>
            </div>
            <figure className="churchapp-main__feature-figure">
              <img
                src={pushAdminImage}
                alt="푸시 알림 관리자 페이지 예시"
                className="churchapp-main__feature-figure-img"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section id="pricing" className="churchapp-main__section">
          <div className="churchapp-main__container">
            <div className="churchapp-main__pricing-shell">
              <div className="churchapp-main__pricing-hero-grid">
                <div className="churchapp-main__pricing-copy">
                  <span className="churchapp-main__section-kicker">Pricing</span>
                  <h2 className="churchapp-main__pricing-copy-title">
                    기본 제작 비용은
                    <br />
                    100만원부터 시작합니다.
                  </h2>
                  <div className="churchapp-main__pricing-support" aria-label="비용 섹션 신뢰 포인트">
                    {PRICING_PILLS.map((p) => (
                      <span key={p} className="churchapp-main__support-pill">
                        <span className="churchapp-main__support-dot" aria-hidden />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <aside className="churchapp-main__pricing-card" aria-label="교회 전용 앱 비용 안내">
                  <div>
                    <span className="churchapp-main__pricing-label">교회앱 제작 비용</span>
                    <p className="churchapp-main__pricing-price">
                      ₩1,000,000 ~<span> (VAT 10% 별도)</span>
                    </p>
                  </div>
                  <ul className="churchapp-main__pricing-list">
                    {PRICING_LIST.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="churchapp-main__pricing-actions">
                    <button
                      type="button"
                      className="churchapp-main__button churchapp-main__button--primary"
                      onClick={goToChurchappPayment}
                    >
                      제작하기
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="churchapp-main__section">
          <div className="churchapp-main__container">
            <div className="churchapp-main__final-cta">
              <h2 className="churchapp-main__final-cta-title">
                우리 교회 홈페이지도
                <br />
                전용 앱으로 만들 수 있습니다
              </h2>
              <p className="churchapp-main__section-desc">
                기존 홈페이지 자산을 활용해 성도와 방문자에게 더 쉬운 모바일 접근 경험을 제공해 보세요.
              </p>
              <div className="churchapp-main__hero-actions">
                <button
                  type="button"
                  className="churchapp-main__button churchapp-main__button--primary"
                  onClick={goToChurchappPayment}
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

function ChurchMockupMarqueeRow({
  images,
  durationSec,
  reverse,
}: {
  images: { src: string; alt: string }[];
  durationSec: number;
  reverse?: boolean;
}) {
  const loop = [...images, ...images];
  return (
    <div className={`churchapp-main__mock-marquee${reverse ? " churchapp-main__mock-marquee--reverse" : ""}`}>
      <div
        className="churchapp-main__mock-marquee-track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loop.map((item, i) => (
          <div key={`${item.src}-${i}`} className="churchapp-main__mock-slide">
            <img src={item.src} alt={item.alt} className="churchapp-main__mock-slide-img" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
