import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ServiceMain.scss";

const SERVICES = [
  {
    emoji: "📍",
    titleLines: ["모바일 교회", "소개 전단지"],
    strong: "모바일 교회 전단지",
    description:
      "우리 교회를 소개하고 예배와 안내 내용을 모바일에서 간편하게 전달할 수 있는 전단지 서비스입니다.",
    path: "/service/notice",
  },
  {
    emoji: "📣",
    titleLines: ["모바일 행사", "안내 전단지"],
    strong: "모바일 행사 전단지",
    description:
      "교회 행사, 집회, 초청 소식을 모바일에서 보기 좋게 홍보할 수 있는 안내 서비스입니다.",
    path: "/service/event",
  },
  {
    emoji: "🏠",
    titleLines: ["홈인앱"],
    strong: "기존 홈페이지를 웹앱으로 연결",
    description:
      "지금 사용 중인 교회 홈페이지를 바탕으로 주보·설교·공지를 모바일에서 더 빠르게 전달하는 웹앱 서비스입니다.",
    path: "/service/homeinapp",
  },
  {
    emoji: "📲",
    titleLines: ["교회 전용 어플"],
    strong: "교회 브랜드 전용 앱",
    description:
      "교회명과 사역 흐름을 담은 전용 앱으로 공지, 설교, 부서 안내를 한곳에서 운영할 수 있습니다.",
    path: "/service/churchapp",
  },
  // {
  //   emoji: "🌐",
  //   titleLines: ["홈페이지 제작"],
  //   strong: "교회 맞춤 홈페이지 제작",
  //   description:
  //     "교회 정체성과 안내를 담은 웹사이트를 기획부터 제작까지 함께 구성해 드립니다.",
  //   path: "/service/homepage",
  // },
  // {
  //   emoji: "📖",
  //   titleLines: ["모바일 주보"],
  //   strong: "매주 업데이트되는 모바일 주보",
  //   description:
  //     "예배 순서, 교회 소식, 광고 내용을 종이 없이도 모바일에서 편하게 확인할 수 있습니다.",
  //   path: "/service/bulletin",
  // },
  
 
];

const WHY_ITEMS = [
  {
    icon: "🧩",
    title: "직관적인 구성",
    text: "누구나 쉽게 이해할 수 있도록 서비스 구성을 단순하고 명확하게 정리했습니다.",
  },
  {
    icon: "⚡",
    title: "빠르고 편리한 운영",
    text: "반복되는 안내와 공유 과정을 줄여 교회 운영을 더 효율적으로 돕습니다.",
  },
  {
    icon: "🛡️",
    title: "신뢰감 있는 디자인",
    text: "깔끔한 온라인 배경과 포인트로 안정감 있는 교회 인상을 전달합니다.",
  },
];

const STEPS = [
  { num: "1", title: "신청", desc: "서비스 도입 신청" },
  { num: "2", title: "설정", desc: "교회 맞춤 구성" },
  { num: "3", title: "오픈", desc: "모바일 배포" },
  { num: "4", title: "운영", desc: "공유 및 활용" },
];

const FAQ_ITEMS = [
  {
    q: "서비스별로 따로 제작할 수도 있나요?",
    a: "네, 한 가지 서비스만 단독으로 제작할 수도 있고 여러 서비스를 한 톤으로 묶어 구성할 수도 있습니다.",
  },
];

export default function ServiceMain() {
  const navigate = useNavigate();

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const goService = useCallback(
    (path: string) => {
      navigate(path);
      window.scrollTo(0, 0);
    },
    [navigate],
  );

  return (
    <div className="service-main">

      <section id="top" className="service-main__hero">
        <div className="service-main__container service-main__hero-inner">
          <h1>
            교회 모바일 서비스
            <br />
            한곳에 깔끔하게 모았습니다
          </h1>
          <p>
            더 스마트하고 편리한 사역을 위해 필요한 모바일 서비스를 쉽고 직관적인 구조로
            제공합니다.
          </p>
          <div className="service-main__hero-actions">
            <button
              type="button"
              className="service-main__btn service-main__btn--primary"
              onClick={() => scrollToId("services")}
            >
              서비스 둘러보기
            </button>
            {/* <button
              type="button"
              className="service-main__btn service-main__btn--secondary"
              onClick={() => scrollToId("contact")}
            >
              상담 신청
            </button> */}
          </div>
        </div>
      </section>

      <section id="services" className="service-main__service-overlap">
        <div className="service-main__container">
          <div className="service-main__service-grid">
            {SERVICES.map((s) => (
              <article
                key={s.path}
                className="service-main__service-card"
                onClick={() => goService(s.path)}
              >
                <div className="service-main__service-card-inner">
                  <div className="service-main__service-copy">
                    <h3>
                      {s.titleLines.map((line, i) => (
                        <span key={`${s.path}-${i}`}>
                          {i > 0 ? <br /> : null}
                          {line}
                        </span>
                      ))}
                    </h3>
                    <strong>{s.strong}</strong>
                    <p>{s.description}</p>
                  </div>
                  <div className="service-main__service-icon" aria-hidden>
                    {s.emoji}
                  </div>
                </div>
                <button
                  type="button"
                  className="service-main__service-go"
                  onClick={(e) => {
                    e.stopPropagation();
                    goService(s.path);
                  }}
                >
                  바로가기
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="service-main__why">
        <div className="service-main__container">
          <div className="service-main__section-title">
            <div className="service-main__badge">왜 모바일 사역 허브인가요?</div>
            <h2>
              필요한 기능은 더 명확하게
              <br />
              운영은 더 간편하게
            </h2>
            <p>
              교회 안내와 운영에 필요한 핵심 서비스를 모아 
              <br />
              더 빠르고 체계적으로 전달할 수 있도록 구성했습니다.
            </p>
          </div>
          <div className="service-main__why-grid">
            {WHY_ITEMS.map((w) => (
              <div key={w.title} className="service-main__why-item">
                <div className="service-main__why-icon">{w.icon}</div>
                <h4>{w.title}</h4>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="service-main__info-section">
        <div className="service-main__container">
          <div className="service-main__info-grid">
            <div className="service-main__panel">
              <h3>이용 절차</h3>
              <div className="service-main__steps">
                {STEPS.map((st) => (
                  <div key={st.num} className="service-main__step">
                    <div className="service-main__step-num">{st.num}</div>
                    <strong>{st.title}</strong>
                    <span>{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="faq" className="service-main__panel">
              <h3>FAQ</h3>
              <div className="service-main__faq-list">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.q} className="service-main__faq-item">
                    <summary>{item.q}</summary>
                    <div className="service-main__faq-answer">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div id="contact" className="service-main__cta-banner">
            <div>
              <h3>지금 바로 스마트한 사역을 시작해보세요!</h3>
              <p>교회에 꼭 맞는 모바일 서비스 구성을 함께 설계해드립니다.</p>
            </div>
            {/* <button
              type="button"
              className="service-main__btn service-main__btn--cta"
              onClick={() => navigate("/company/advertise")}
            >
              무료 상담 신청
            </button> */}
          </div>
        </div>
      </section>
    </div>
  );
}
