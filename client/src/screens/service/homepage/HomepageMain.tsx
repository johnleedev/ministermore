import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./HomepageMain.scss";

const HERO_POINTS = [
  { title: "페이지별 선택", text: "메인 · 게시판 · 주보 · 설교를 따로 선택" },
  { title: "샘플 10종 제공", text: "각 페이지 유형마다 10개 템플릿 준비" },
  { title: "모바일 중심", text: "교회 운영 흐름에 맞춘 모바일 최적화 구조" },
];

const VALUE_CARDS = [
  {
    icon: "🧩",
    title: "페이지별 선택 구조",
    text: "메인·게시판·주보·설교 페이지를 각각 따로 선택해 우리 교회에 맞게 조합할 수 있습니다.",
  },
  {
    icon: "⚡",
    title: "빠르고 안정적인 제작",
    text: "검토된 템플릿 구조를 바탕으로 제작되어 일정 부담을 줄이고 빠르게 오픈할 수 있습니다.",
  },
  {
    icon: "📱",
    title: "모바일 중심 운영",
    text: "교회 소개, 주보, 설교, 공지 전달처럼 실제 운영 흐름에 맞춰 모바일 중심으로 구성됩니다.",
  },
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "상담 및 안내",
    desc: "교회 운영 방식과 필요한 페이지를 먼저 확인합니다.",
  },
  {
    step: "2",
    title: "템플릿 선택",
    desc: "메인, 게시판, 주보, 설교 페이지에서 원하는 샘플을 고릅니다.",
  },
  {
    step: "3",
    title: "자료 전달",
    desc: "로고, 교회 소개, 예배 시간, 연락처 등 필요한 자료를 전달받습니다.",
  },
  {
    step: "4",
    title: "홈페이지 제작",
    desc: "선택한 템플릿 조합을 기준으로 교회에 맞게 제작합니다.",
  },
  {
    step: "5",
    title: "검토 및 수정",
    desc: "제작 결과를 함께 확인하고 필요한 수정 사항을 반영합니다.",
  },
  {
    step: "6",
    title: "오픈 및 운영",
    desc: "최종 확인 후 오픈하고 운영 흐름에 맞춰 사용을 시작합니다.",
  },
];

const FAQ_ITEMS = [
  {
    q: "완전 자유롭게 디자인하는 방식인가요?",
    a: "처음부터 모든 것을 새로 설계하는 완전 커스텀 방식은 아니며, 페이지별 샘플 템플릿 선택 후 조합형으로 제작하는 방식입니다.",
  },
  {
    q: "하나의 템플릿만 사용하는 서비스인가요?",
    a: "아닙니다. 메인, 게시판, 주보, 설교 페이지를 각각 따로 선택할 수 있어 한 가지 템플릿만 사용하는 구조가 아닙니다.",
  },
  {
    q: "페이지별로 서로 다른 스타일을 고를 수 있나요?",
    a: "네. 각 페이지 유형마다 준비된 샘플 중 하나를 선택해 운영 방식에 맞춘 조합이 가능합니다.",
  },
  {
    q: "모바일에서도 잘 보이나요?",
    a: "교회 홈페이지는 모바일 방문 비중이 높기 때문에 모바일 가독성과 정보 흐름을 우선해 설계합니다.",
  },
];

const TEMPLATE_SECTIONS = [
  { title: "메인 페이지", sub: "교회의 첫인상을 정리하는 핵심 화면" },
  { title: "게시판 페이지", sub: "공지사항, 교회소식, 행사안내, 자료실 전달용" },
  { title: "주보 페이지", sub: "예배 순서, 광고, 교회 소식을 전달하는 모바일 주보" },
  { title: "설교 페이지", sub: "최신 설교, 시리즈 정리, 영상 중심 아카이브 구성" },
];

export default function HomepageMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const [openedFaq, setOpenedFaq] = useState<number | null>(0);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onApply = useCallback(() => {
    if (isLogin) {
      navigate("/service");
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="homepage-main">
      <header className="homepage-main__header">
        <div className="homepage-main__container homepage-main__header-inner">
          <button type="button" className="homepage-main__brand" onClick={() => scrollToId("top")}>
            <span className="homepage-main__brand-badge">✝</span>
            <span>교회 홈페이지 제작 서비스</span>
          </button>
          <nav className="homepage-main__nav" aria-label="주요 메뉴">
            <button type="button" onClick={() => scrollToId("about")}>서비스 소개</button>
            <button type="button" onClick={() => scrollToId("templates")}>템플릿 선택</button>
            <button type="button" onClick={() => scrollToId("process")}>제작 절차</button>
            <button type="button" onClick={() => scrollToId("faq")}>FAQ</button>
            <button type="button" onClick={() => scrollToId("contact")}>문의</button>
          </nav>
          <button
            type="button"
            className="homepage-main__btn homepage-main__btn--primary homepage-main__btn--header"
            onClick={() => scrollToId("contact")}
          >
            제작 상담 신청
          </button>
        </div>
      </header>

      <section id="top" className="homepage-main__hero">
        <div className="homepage-main__container homepage-main__hero-grid">
          <div>
            <div className="homepage-main__eyebrow">교회에 맞게 고르고, 더 쉽게 시작하는 홈페이지</div>
            <h1>
              완전 커스텀도 아니고,
              <br />
              단일 템플릿도 아닌
              <br />
              <span>반맞춤형 홈페이지 제작</span>
            </h1>
            <p>
              메인, 게시판, 주보, 설교 페이지를 각각 준비된 샘플 템플릿 중에서
              선택해 우리 교회에 맞는 홈페이지를 제작하는 서비스입니다.
            </p>
            <div className="homepage-main__btn-group">
              <button
                type="button"
                className="homepage-main__btn homepage-main__btn--primary"
                onClick={() => scrollToId("contact")}
              >
                제작 상담 신청하기
              </button>
              <button
                type="button"
                className="homepage-main__btn homepage-main__btn--secondary"
                onClick={() => scrollToId("templates")}
              >
                템플릿 구성 보기
              </button>
            </div>
            <div className="homepage-main__hero-points">
              {HERO_POINTS.map((point) => (
                <div key={point.title} className="homepage-main__hero-point">
                  <strong>{point.title}</strong>
                  <span>{point.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="homepage-main__hero-card" aria-hidden="true">
            <div className="homepage-main__mock-browser">
              <div className="homepage-main__mock-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="homepage-main__mock-screen">
                <div className="homepage-main__screen-hero">
                  <div className="homepage-main__line homepage-main__line--dark homepage-main__line--w74" />
                  <div className="homepage-main__line homepage-main__line--w92" />
                  <div className="homepage-main__line homepage-main__line--w70" />
                </div>
                <div className="homepage-main__screen-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="homepage-main__screen-card">
                      <div className="homepage-main__line homepage-main__line--dark homepage-main__line--w68" />
                      <div className="homepage-main__line homepage-main__line--w100" />
                      <div className="homepage-main__line homepage-main__line--w86" />
                      <div className="homepage-main__line homepage-main__line--w62" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="homepage-main__section">
        <div className="homepage-main__container">
          <div className="homepage-main__section-head">
            <div className="homepage-main__eyebrow">왜 이 서비스가 필요한가요?</div>
            <h2>너무 어렵지도, 너무 똑같지도 않은 현실적인 교회 홈페이지 제작 방식</h2>
            <p>
              완전 커스텀의 부담과 단일 템플릿의 한계를 줄이고,
              필요한 만큼 선택할 수 있는 중간형 제작 구조입니다.
            </p>
          </div>
          <div className="homepage-main__grid-3">
            {VALUE_CARDS.map((card) => (
              <article key={card.title} className="homepage-main__card">
                <div className="homepage-main__icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="homepage-main__section homepage-main__section--sm">
        <div className="homepage-main__container">
          <div className="homepage-main__section-head">
            <div className="homepage-main__eyebrow">페이지별 템플릿 선택 방식</div>
            <h2>메인, 게시판, 주보, 설교를 각각 선택하는 조합형 제작</h2>
            <p>각 페이지 유형별 샘플을 선택해 교회 운영 흐름에 맞는 구성을 만듭니다.</p>
          </div>
          <div className="homepage-main__template-grid">
            {TEMPLATE_SECTIONS.map((item) => (
              <article key={item.title} className="homepage-main__template-card">
                <div className="homepage-main__template-head">
                  <h3>{item.title}</h3>
                  <p>{item.sub}</p>
                </div>
                <div className="homepage-main__sample-list">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div key={idx} className="homepage-main__sample-item">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="homepage-main__section">
        <div className="homepage-main__container">
          <div className="homepage-main__section-head">
            <div className="homepage-main__eyebrow">제작 프로세스</div>
            <h2>선택은 간단하게, 제작은 체계적으로 진행합니다</h2>
          </div>
          <div className="homepage-main__steps">
            {PROCESS_STEPS.map((step) => (
              <article key={step.step} className="homepage-main__step">
                <div className="homepage-main__step-number">{step.step}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="homepage-main__section homepage-main__section--sm">
        <div className="homepage-main__container">
          <div className="homepage-main__section-head">
            <div className="homepage-main__eyebrow">자주 묻는 질문</div>
            <h2>도입 전에 많이 궁금해하시는 내용을 정리했습니다</h2>
          </div>
          <div className="homepage-main__faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const opened = openedFaq === idx;
              return (
                <article key={item.q} className={`homepage-main__faq-item ${opened ? "is-open" : ""}`}>
                  <button type="button" className="homepage-main__faq-q" onClick={() => setOpenedFaq(opened ? null : idx)}>
                    <span>{item.q}</span>
                    <span>{opened ? "−" : "+"}</span>
                  </button>
                  <div className="homepage-main__faq-a">{item.a}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="homepage-main__section">
        <div className="homepage-main__container">
          <div className="homepage-main__cta-panel">
            <h2>우리 교회에 맞는 홈페이지 구성이 필요하신가요?</h2>
            <p>
              메인, 게시판, 주보, 설교 페이지를 각각 원하는 스타일로 선택하고,
              교회 운영 방식에 맞는 구조로 홈페이지를 시작해 보세요.
            </p>
            <div className="homepage-main__btn-group">
              <button type="button" className="homepage-main__btn homepage-main__btn--light" onClick={onApply}>
                제작 신청
              </button>
              <button
                type="button"
                className="homepage-main__btn homepage-main__btn--ghost"
                onClick={() => scrollToId("templates")}
              >
                템플릿 다시 보기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
