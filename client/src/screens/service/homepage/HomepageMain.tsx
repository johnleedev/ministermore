import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./HomepageMain.scss";

const HERO_BADGES = ["페이지별 선택", "샘플 10종", "모바일 중심", "교회 맞춤"];

const PROBLEM_CARDS = [
  {
    num: "01",
    title: "완전 커스텀은 부담이 큽니다",
    text: "기획부터 디자인, 개발까지 모두 새로 진행하면 비용과 일정 부담이 커져 도입 장벽이 높아집니다.",
  },
  {
    num: "02",
    title: "단일 템플릿은 유연성이 부족합니다",
    text: "교회 운영 흐름은 다른데 한 가지 템플릿만 쓰면 메인·게시판·주보·설교 전달 방식이 제한될 수 있습니다.",
  },
];

const TEMPLATE_SECTIONS = [
  { title: "메인 페이지", sub: "교회의 첫인상을 정리하는 핵심 화면" },
  { title: "게시판 페이지", sub: "공지사항, 교회소식, 행사안내 전달용" },
  { title: "주보 페이지", sub: "예배 순서와 광고를 담는 모바일 주보" },
  { title: "설교 페이지", sub: "최신 설교와 시리즈를 정리하는 아카이브" },
];

const PRICING_PILLS = ["페이지별 선택", "샘플 10종 제공", "모바일 최적화", "교회 운영 흐름 맞춤"];

const PRICING_LIST = [
  "메인·게시판·주보·설교 페이지를 각각 선택 가능",
  "페이지 유형별 샘플 템플릿 10종 제공",
  "교회 자료 반영 및 기본 수정 포함",
  "모바일 중심 UI/UX 최적화",
  "운영 시작 후 안내 및 기본 지원",
];

const FAQ_ITEMS = [
  {
    q: "완전 커스텀 홈페이지인가요?",
    a: "처음부터 전부 새로 설계하는 방식이 아니라, 페이지별 샘플을 선택해 조합하는 반맞춤형 제작 방식입니다.",
  },
  {
    q: "한 가지 템플릿만 써야 하나요?",
    a: "아닙니다. 메인, 게시판, 주보, 설교를 각각 원하는 샘플로 선택해 조합할 수 있습니다.",
  },
  {
    q: "모바일에서도 잘 보이나요?",
    a: "교회 홈페이지의 모바일 방문 비중을 고려해 가독성과 정보 흐름을 모바일 중심으로 설계합니다.",
  },
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
      window.scrollTo(0, 0);
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="homepage-main">
      <main id="top">
        <section className="homepage-main__hero" aria-label="교회 홈페이지 서비스 소개">
          <div className="homepage-main__container homepage-main__hero-inner">
            <div className="homepage-main__eyebrow">
              <span className="homepage-main__eyebrow-dot" aria-hidden />
              교회에 맞게 고르고, 더 쉽게 시작하는 홈페이지
            </div>
            <h1 className="homepage-main__title">
              템플릿에서 페이지를 선택하는
              <br />
              <span className="homepage-main__accent">맞춤형 홈페이지 제작</span>
            </h1>
            <p className="homepage-main__hero-copy">
              메인, 게시판, 주보, 설교 페이지를 각각 준비된 샘플 템플릿에서 선택해 우리 교회 운영 방식에 맞는
              홈페이지를 제작합니다.
            </p>
            <div className="homepage-main__hero-actions">
              <button type="button" className="homepage-main__button homepage-main__button--primary" 
              onClick={()=>{
                alert("준비중입니다.");
              }}>
                제작하기
              </button>
              <button
                type="button"
                className="homepage-main__button homepage-main__button--secondary"
                onClick={() => scrollToId("templates")}
              >
                템플릿 구성 보기
              </button>
            </div>
            <div className="homepage-main__badge-strip" aria-label="요약 배지">
              {HERO_BADGES.map((b) => (
                <span key={b} className="homepage-main__mini-badge">
                  {b}
                </span>
              ))}
            </div>

            <div className="homepage-main__hero-mock" aria-hidden>
              <div className="homepage-main__mock-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="homepage-main__mock-hero">
                <div className="homepage-main__line homepage-main__line--w70" />
                <div className="homepage-main__line homepage-main__line--w48" />
              </div>
              <div className="homepage-main__mock-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="homepage-main__mini-panel">
                    <div className="homepage-main__line homepage-main__line--w48" />
                    <div className="homepage-main__line homepage-main__line--w100" />
                    <div className={`homepage-main__line ${i % 2 ? "homepage-main__line--w70" : "homepage-main__line--w84"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="homepage-main__section homepage-main__section--tight">
          <div className="homepage-main__container">
            <div className="homepage-main__section-head">
              <span className="homepage-main__section-kicker">Problem</span>
              <h2 className="homepage-main__section-title">
                심플하고 간단한
                <br />
                제작 방식
              </h2>
              <p className="homepage-main__section-desc">
                완전 커스텀의 부담과 단일 템플릿의 한계를 줄이고, 필요한 페이지를 필요한 만큼 선택하는 현실적인
                구조를 제안합니다.
              </p>
            </div>
            <div className="homepage-main__grid-2">
              {PROBLEM_CARDS.map((c) => (
                <article key={c.title} className="homepage-main__card">
                  <span className="homepage-main__card-num">{c.num}</span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="homepage-main__section">
          <div className="homepage-main__container">
            <div className="homepage-main__section-head">
              <span className="homepage-main__section-kicker">Template</span>
              <h2 className="homepage-main__section-title">
                메인, 게시판, 주보, 설교를
                <br />
                각각 선택하는 조합형 제작
              </h2>
            </div>
            <div className="homepage-main__grid-4">
              {TEMPLATE_SECTIONS.map((item) => (
                <article key={item.title} className="homepage-main__template-card">
                  <h3>{item.title}</h3>
                  <p>{item.sub}</p>
                  <div className="homepage-main__sample-list">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <span key={idx} className="homepage-main__sample-chip">
                        {(idx + 1).toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="homepage-main__section homepage-main__section--sm">
          <div className="homepage-main__container">
            <div className="homepage-main__section-head">
              <span className="homepage-main__section-kicker">FAQ</span>
              <h2 className="homepage-main__section-title">도입 전에 자주 묻는 질문</h2>
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

        <section id="pricing" className="homepage-main__section">
          <div className="homepage-main__container">
            <div className="homepage-main__pricing-shell">
              <div className="homepage-main__pricing-copy">
                <span className="homepage-main__section-kicker">Pricing</span>
                <h2 className="homepage-main__pricing-copy-title">
                  페이지 선택형 구조로
                  <br />
                  합리적으로 시작하세요
                </h2>
                <div className="homepage-main__pricing-support" aria-label="요금 섹션 신뢰 포인트">
                  {PRICING_PILLS.map((p) => (
                    <span key={p} className="homepage-main__support-pill">
                      <span className="homepage-main__support-dot" aria-hidden />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <aside className="homepage-main__pricing-card" aria-label="홈페이지 제작 비용 안내">
                <div>
                  <span className="homepage-main__pricing-label">홈페이지 제작 비용</span>
                  <p className="homepage-main__pricing-price">
                    ₩300,000 ~<span> (VAT 제외)</span>
                  </p>
                </div>
                <ul className="homepage-main__pricing-list">
                  {PRICING_LIST.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="homepage-main__pricing-actions">
                  <button
                    type="button"
                    className="homepage-main__button homepage-main__button--primary"
                    onClick={() => {
                      alert("준비중입니다.");
                    }}
                  >
                    제작하기
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="contact" className="homepage-main__section">
          <div className="homepage-main__container">
            <div className="homepage-main__final-cta">
              <h2 className="homepage-main__final-cta-title">
                우리 교회 운영 흐름에 맞는
                <br />
                홈페이지를 시작해 보세요
              </h2>
              <p className="homepage-main__section-desc">
                메인, 게시판, 주보, 설교 페이지를 조합해 필요한 구조로 구성하고 빠르게 오픈할 수 있습니다.
              </p>
              <div className="homepage-main__hero-actions">
                <button type="button" className="homepage-main__button homepage-main__button--primary" 
                onClick={()=>{
                  alert("준비중입니다.");
                }}>
                  제작하기
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
