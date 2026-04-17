import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { recoilLoginState } from "../../../RecoilStore";
import "./BulletinMain.scss";

const VALUE_CARDS = [
  {
    icon: "📱",
    title: "언제든 바로 확인",
    text: "예배 시작 전, 예배 중, 예배 후에도 휴대폰에서 주보를 쉽게 확인할 수 있어 접근성과 편의성이 크게 높아집니다.",
  },
  {
    icon: "🔄",
    title: "수정과 반영이 빠름",
    text: "행사 일정이나 광고 내용이 바뀌어도 빠르게 수정 반영할 수 있어 최신 정보를 정확하게 전달하기 좋습니다.",
  },
  {
    icon: "✨",
    title: "깔끔한 교회 이미지",
    text: "정돈된 모바일 UI로 예배 안내와 공지 사항을 전달하면 교회의 전문성과 신뢰감도 함께 높일 수 있습니다.",
  },
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "접속",
    desc: "QR코드, 문자, 카카오톡, 홈페이지 링크를 통해 모바일 주보에 접속합니다.",
  },
  {
    step: "2",
    title: "예배 순서 확인",
    desc: "현재 예배 흐름과 순서를 모바일에서 빠르게 확인합니다.",
  },
  {
    step: "3",
    title: "광고 및 안내 확인",
    desc: "교회 소식, 행사 안내, 헌금 정보, 새가족 안내를 함께 봅니다.",
  },
  {
    step: "4",
    title: "지속적 연결",
    desc: "예배 후에도 주보 링크를 통해 소식과 참여 정보를 계속 확인할 수 있습니다.",
  },
];

function OrderRows({
  rows,
}: {
  rows: { num: string; title: string; sub: string; right: string }[];
}) {
  return (
    <div className="bulletin-main__order-list">
      {rows.map((r) => (
        <div key={r.num} className="bulletin-main__order-item">
          <div className="bulletin-main__order-left">
            <div className="bulletin-main__order-num">{r.num}</div>
            <div className="bulletin-main__order-label">
              <b>{r.title}</b>
              <span>{r.sub}</span>
            </div>
          </div>
          <span>{r.right}</span>
        </div>
      ))}
    </div>
  );
}

export default function BulletinMain() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const openSample = useCallback(() => {
    navigate("/bulletin?id=1&preview=1");
  }, [navigate]);

  const onApply = useCallback(() => {
    if (isLogin) {
      navigate("/service/bookletbulletintemplates");
    } else {
      alert("로그인이 필요합니다.");
    }
  }, [isLogin, navigate]);

  return (
    <div className="bulletin-main">
      <header className="bulletin-main__page-header">
        <div className="bulletin-main__container bulletin-main__page-header-inner">
          <button
            type="button"
            className="bulletin-main__brand"
            onClick={() => scrollToId("top")}
          >
            <span className="bulletin-main__brand-mark">✦</span>
            <span>모바일 주보</span>
          </button>
          <nav className="bulletin-main__nav" aria-label="페이지 내 메뉴">
            <button type="button" onClick={() => scrollToId("about")}>
              서비스 소개
            </button>
            <button type="button" onClick={() => scrollToId("features")}>
              샘플
            </button>
            <button type="button" onClick={() => scrollToId("process")}>
              이용 흐름
            </button>
            <button type="button" onClick={() => scrollToId("contact")}>
              문의
            </button>
          </nav>
          <button
            type="button"
            className="bulletin-main__btn bulletin-main__btn--primary bulletin-main__btn--header"
            onClick={onApply}
          >
            제작하기
          </button>
        </div>
      </header>

      <section id="top" className="bulletin-main__hero">
        <div className="bulletin-main__container bulletin-main__hero-grid">
          <div className="bulletin-main__hero-copy">
            <div className="bulletin-main__badge">
              모바일 주보 서비스 · 상세페이지
            </div>
            <h1>
              종이 주보보다
              <br />
              더 쉽고 편리하게
              <br />
              예배 안내를 모바일로
            </h1>
            <p>
              예배 순서, 교회 소식, 광고, 헌금 안내, 새가족 안내까지 주보의 핵심
              정보를 모바일에 깔끔하게 담아 성도와 방문자가 언제든 쉽고 빠르게
              확인할 수 있는 서비스입니다.
            </p>
            <div className="bulletin-main__hero-actions">
              <button
                type="button"
                className="bulletin-main__btn bulletin-main__btn--primary"
                onClick={openSample}
              >
                샘플 보기
              </button>
              <button
                type="button"
                className="bulletin-main__btn bulletin-main__btn--secondary"
                onClick={onApply}
              >
                제작하기
              </button>
            </div>
            <div className="bulletin-main__hero-stats">
              <div className="bulletin-main__stat">
                <strong>주보 디지털화</strong>
                <span>종이 없이도 편리한 전달</span>
              </div>
              <div className="bulletin-main__stat">
                <strong>모바일 최적화</strong>
                <span>예배 전·중·후 바로 확인</span>
              </div>
              <div className="bulletin-main__stat">
                <strong>간편한 업데이트</strong>
                <span>매주 주보 수정도 쉽게</span>
              </div>
            </div>
          </div>

          <div className="bulletin-main__phone-wrap">
            <div className="bulletin-main__phone-shadow">
              <div className="bulletin-main__phone">
                <div className="bulletin-main__phone-top">
                  <div className="bulletin-main__notch" />
                </div>
                <div className="bulletin-main__phone-screen">
                  <div className="bulletin-main__app-hero">
                    <small>Sunday Worship Bulletin</small>
                    <h3>
                      모바일로 보는
                      <br />
                      이번 주 주보
                    </h3>
                    <p>예배 순서와 교회 소식을 한눈에 확인하세요</p>
                  </div>
                  <div className="bulletin-main__app-card">
                    <strong className="bulletin-main__app-card-title">
                      예배 순서
                    </strong>
                    <OrderRows
                      rows={[
                        {
                          num: "1",
                          title: "예배로 부름",
                          sub: "Call to Worship",
                          right: "09:00",
                        },
                        {
                          num: "2",
                          title: "찬양과 기도",
                          sub: "Praise & Prayer",
                          right: "09:10",
                        },
                        {
                          num: "3",
                          title: "말씀 선포",
                          sub: "Sermon Message",
                          right: "09:30",
                        },
                      ]}
                    />
                  </div>
                  <div className="bulletin-main__app-card">
                    <strong className="bulletin-main__app-card-title">
                      이번 주 안내
                    </strong>
                    <div className="bulletin-main__tag-row">
                      <div className="bulletin-main__tag">교회 소식</div>
                      <div className="bulletin-main__tag">행사 안내</div>
                      <div className="bulletin-main__tag">헌금 안내</div>
                      <div className="bulletin-main__tag">새가족</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bulletin-main__section">
        <div className="bulletin-main__container">
          <div className="bulletin-main__section-head">
            <div className="bulletin-main__badge">왜 모바일 주보인가요?</div>
            <h2>주보 전달은 더 간편하게, 예배 안내는 더 분명하게</h2>
            <p>
              매주 제작하는 주보는 중요하지만 종이 배포, 수정 반영, 접근성
              면에서 아쉬움이 있습니다. 모바일 주보 서비스는 예배와 교회 소식을
              더 빠르고 선명하게 전달할 수 있도록 도와줍니다.
            </p>
          </div>
          <div className="bulletin-main__card-grid-3">
            {VALUE_CARDS.map((c) => (
              <div key={c.title} className="bulletin-main__value-card">
                <div className="bulletin-main__value-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="bulletin-main__section bulletin-main__section--sample-cta"
      >
        <div className="bulletin-main__container">
          <div className="bulletin-main__sample-cta">
            <div className="bulletin-main__badge">샘플</div>
            <h2 className="bulletin-main__sample-cta-title">
              실제 모바일 주보 화면을 확인해 보세요
            </h2>
            <p className="bulletin-main__sample-cta-desc">
              샘플이 새 창(탭)에서 열립니다.
            </p>
            <button
              type="button"
              className="bulletin-main__btn bulletin-main__btn--primary bulletin-main__btn--sample-large"
              onClick={openSample}
            >
              샘플 보기
            </button>
          </div>
        </div>
      </section>

      <section id="process" className="bulletin-main__section">
        <div className="bulletin-main__container">
          <div className="bulletin-main__process-wrap">
            <div className="bulletin-main__badge bulletin-main__badge--on-dark">
              이용 흐름
            </div>
            <div className="bulletin-main__section-head bulletin-main__section-head--on-dark">
              <h2>예배 전부터 예배 후까지 자연스럽게 이어지는 모바일 주보</h2>
              <p>
                QR 또는 링크 접속만으로 예배 순서 확인, 광고 확인, 헌금 안내,
                새가족 연결까지 예배 현장에서 필요한 흐름을 모바일 안에 담을 수
                있습니다.
              </p>
            </div>
            <div className="bulletin-main__process-grid">
              {PROCESS_STEPS.map((s) => (
                <div key={s.step} className="bulletin-main__process-step">
                  <div className="bulletin-main__step-num">{s.step}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bulletin-main__section">
        <div className="bulletin-main__container bulletin-main__benefit-grid">
          <div id="contact" className="bulletin-main__cta-panel">
            <div
              className="bulletin-main__badge"
              style={{ marginBottom: "20px" }}
            >
              문의
            </div>
            <h3>
              매주 더 편리한
              <br />
              모바일 주보가 필요하신가요?
            </h3>
            <p>
              교회의 예배 안내와 소식 전달을 더 깔끔하게 정리할 수 있는 모바일
              주보 상세페이지로 제작해보세요.
            </p>
            <div className="bulletin-main__cta-actions">
              <button
                type="button"
                className="bulletin-main__btn bulletin-main__btn--primary"
                onClick={onApply}
              >
                제작하기
              </button>
              <button
                type="button"
                className="bulletin-main__btn bulletin-main__btn--secondary"
                onClick={openSample}
              >
                샘플 보기
              </button>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
