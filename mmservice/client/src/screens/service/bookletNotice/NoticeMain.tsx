import { useCallback } from "react";
import goToMmservice from "../../../goToMmservice";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./NoticeMain.scss";
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import "../../../exceptbooklets/bookletNotice/styles/NoticeCreate.scss";
import sampleMockupImage from "../../../images/booklet/samplemockup.jpeg";
import kakaosampleImage from "../../../images/booklet/kakaosample.png";

const VALUE_CARDS = [
  {
    icon: "📌",
    title: "정보를 한곳에",
    text: "교회 소개, 조직, 설교, 갤러리, 안내 정보를 흩어지지 않게 하나의 모바일 서비스 안에서 일관되게 제공할 수 있습니다.",
  },
  {
    icon: "💬",
    title: "처음 방문자도 쉽게",
    text: "복잡한 메뉴 구조 대신 직관적인 탭 구성으로, 처음 접속한 사람도 필요한 정보를 빠르게 찾을 수 있습니다.",
  },
  {
    icon: "✨",
    title: "교회 이미지를 더 좋게",
    text: "정돈된 디자인과 모바일 최적화 UI는 교회의 신뢰감과 따뜻한 브랜드 이미지를 함께 전달합니다.",
  },
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "서비스 접속",
    desc: "문자, SNS, 홈페이지, QR 등으로 모바일 링크에 접속합니다.",
  },
  {
    step: "2",
    title: "교회 정보 확인",
    desc: "예배시간, 위치, 교회 소개 등 핵심 정보를 빠르게 파악합니다.",
  },
  {
    step: "3",
    title: "설교/사역 탐색",
    desc: "설교 영상과 섬김이 소개를 보며 교회 성격을 이해합니다.",
  },
  {
    step: "4",
    title: "관심과 연결",
    desc: "갤러리와 문의 연결을 통해 실제 방문 또는 참여로 이어집니다.",
  },
];

const PRICING_PILLS = ["템플릿 기반 제작", "교회 맞춤 편집", "모바일 최적화", "운영 지원"];

const PRICING_LIST = [
  "교회 소개형 모바일 페이지 기본 구성 제공",
  "예배시간·오시는길·섬김이·설교 등 핵심 섹션 반영",
  "브랜드 컬러 및 기본 디자인 톤 맞춤 적용",
  "링크 공유/QR 안내 흐름 지원",
  "추가 기능 및 페이지 범위에 따라 비용 조정 가능",
];

export default function NoticeMain() {
  const isLogin = useRecoilValue(recoilLoginState);

  const openSample = useCallback(() => {
    const base = `${window.location.origin}/booklet?id=1`;
    const usePreview = typeof window !== "undefined" && window.innerWidth >= 800;
    const url = usePreview ? `${base}&preview=1` : base;
    window.open(url, "_blank");
  }, []);

  const onApply = useCallback(() => {
    if (isLogin) {
      window.scrollTo(0, 0);
      goToMmservice("/service/bookletnoticepay");
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin]);

  return (
    <div className="notice-main">
      <section id="top" className="notice-main__hero">
        <div className="notice-main__container notice-main__hero-grid">
          <div className="notice-main__hero-copy">
            <div className="notice-main__badge">
              모바일 교회소개 서비스
            </div>
            <h1>
              교회를 더 쉽고 따뜻하게 소개하는
              <br />
              모바일 서비스
            </h1>
            <p>
              교회 정보, 섬김이 소개, 설교 영상, 갤러리까지 한 곳에 담아 신규
              방문자와 성도들이 언제 어디서든 교회를 편하게 이해할 수 있도록
              돕는 모바일 중심 교회소개 서비스입니다.
            </p>
            <div className="notice-main__hero-actions">
              <button
                type="button"
                className="notice-main__btn notice-main__btn--primary"
                onClick={openSample}
              >
                샘플 보기
              </button>
              <button
                type="button"
                className="notice-main__btn notice-main__btn--secondary"
                onClick={onApply}
              >
                제작하기
              </button>
            </div>
            <div className="notice-main__hero-stats">
              <div className="notice-main__stat">
                <strong>4가지</strong>
                <span>핵심 탭 중심 구성</span>
              </div>
              <div className="notice-main__stat">
                <strong>모바일 최적화</strong>
                <span>누구나 쉽게 접근</span>
              </div>
              <div className="notice-main__stat">
                <strong>간편한 전달</strong>
                <span>링크 하나로 교회 소개</span>
              </div>
            </div>
          </div>

          <div className="notice-main__hero-phone">
            <img
              src={sampleMockupImage}
              alt="서비스 소개 샘플 목업"
              className="notice-main__hero-mockup-image"
            />
          </div>
        </div>
      </section>

      <section id="about" className="notice-main__section">
        <div className="notice-main__container">
          <div className="notice-main__section-head">
            <div className="notice-main__badge">왜 필요한가요?</div>
            <h2>교회 소개를 더 쉽고, 더 선명하게 전달합니다</h2>
            <p>
              교회에 처음 오는 분들은 예배시간, 위치, 사역 방향, 섬김이 정보, 최근 설교와 교회 분위기까지 한 번에 알고 싶어합니다. 
              <br />
              이 서비스는 그런 정보를 모바일에서 가장 보기 쉽게 정리해 전달합니다.
            </p>
          </div>
          <div className="notice-main__card-grid-3">
            {VALUE_CARDS.map((c) => (
              <div key={c.title} className="notice-main__value-card">
                <div className="notice-main__value-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="notice-main__section notice-main__section--sample-cta"
      >
        <div className="notice-main__container">
          <div className="notice-main__sample-cta">
            <div className="notice-main__badge">샘플</div>
            <h2 className="notice-main__sample-cta-title">
              실제 교회 소개 전단지 화면을 확인해 보세요
            </h2>
            <button
              type="button"
              className="notice-main__btn notice-main__btn--primary notice-main__btn--sample-large"
              onClick={openSample}
            >
              샘플 보기
            </button>
          </div>
        </div>
      </section>

      <section id="process" className="notice-main__section">
        <div className="notice-main__container">
          <div className="notice-main__process-wrap">
            <div className="notice-main__badge notice-main__badge--on-dark">
              이용 흐름
            </div>
            <div className="notice-main__section-head notice-main__section-head--on-dark">
              <h2>방문자가 교회를 이해하는 가장 자연스러운 흐름</h2>
              <p>
                링크 하나만 전달해도, 교회 정보 확인부터 설교 시청과 분위기
                파악까지 자연스럽게 이어지는 구조로 설계할 수 있습니다.
              </p>
            </div>
            <div className="notice-main__process-content">
              <div className="notice-main__process-grid">
                {PROCESS_STEPS.map((s) => (
                  <div key={s.step} className="notice-main__process-step">
                    <div className="notice-main__step-num">{s.step}</div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="notice-main__process-preview">
                <img
                  src={kakaosampleImage}
                  alt="카카오톡 공유 샘플 화면"
                  className="notice-main__process-preview-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" className="notice-main__section">
        <div className="notice-main__container">
          <div className="notice-main__pricing-shell">
            <div className="notice-main__pricing-copy">
              <div className="notice-main__badge">Pricing</div>
              <h2 className="notice-main__pricing-copy-title">
                교회 소개 페이지를
                <br />
                월 구독제로 사용해보세요
              </h2>
              <div className="notice-main__pricing-support" aria-label="비용 섹션 포인트">
                {PRICING_PILLS.map((p) => (
                  <span key={p} className="notice-main__support-pill">
                    <span className="notice-main__support-dot" aria-hidden />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <aside className="notice-main__pricing-card" aria-label="교회 소개 서비스 비용 안내">
              <div>
                <span className="notice-main__pricing-label">월간 구독</span>
                <p className="notice-main__pricing-price">
                  ₩10,000<span>/ 월 (VAT 10% 별도)</span>
                </p>
              </div>
              <ul className="notice-main__pricing-list">
                {PRICING_LIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="notice-main__pricing-actions">
                <button type="button" className="notice-main__btn notice-main__btn--primary" 
                  onClick={onApply}>
                  제작하기
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="notice-main__section">
        <div className="notice-main__container notice-main__benefit-grid">
          <div id="contact" className="notice-main__cta-panel">
            <div
              className="notice-main__badge"
              style={{ marginBottom: "20px" }}
            >
              문의
            </div>
            <h3>
              교회 소개를 위한
              <br />
              모바일 상세페이지가 필요하신가요?
            </h3>
            <p>
              교회의 분위기와 핵심 정보를 잘 전달할 수 있는 모바일 맞춤형 소개
              페이지로 제작해보세요.
            </p>
            <div className="notice-main__cta-actions">
              <button
                type="button"
                className="notice-main__btn notice-main__btn--primary"
                onClick={onApply}
              >
                제작하기
              </button>
              <button
                type="button"
                className="notice-main__btn notice-main__btn--secondary"
                onClick={openSample}
              >
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
