import { useNavigate } from 'react-router-dom';
import {
  FaMusic,
  FaCheck,
  FaArrowRight,
  FaHourglassHalf,
  FaUsers,
  FaFolderOpen,
  FaFilter,
  FaShareAlt,
  FaCog,
  FaMagic,
  FaListOl,
  FaTachometerAlt,
  FaBook,
  FaCalendarCheck,
  FaLightbulb,
  FaListUl,
  FaPenSquare,
  FaFileAlt,
  FaMicrophoneAlt,
  FaDesktop,
  FaCopyright,
  FaLayerGroup,
} from 'react-icons/fa';
import './ContiMain.scss';

export default function ContiMain() {
  const navigate = useNavigate();

  return (
    <div className="conti-intro">
      {/* Section 1: Hero (1.html) */}
      <section className="conti-intro__hero">
        <div className="conti-intro__hero-inner">
          <div className="conti-intro__hero-left">
            <div className="conti-intro__logo">
              <FaMusic />
              <span>PraiseMaker</span>
            </div>
            <div className="conti-intro__accent-bar" />
            <h2 className="conti-intro__hero-sub">Worship Service Helper</h2>
            <h1 className="conti-intro__hero-title">
              예배를 더 준비되게,
              <br />
              <span className="conti-intro__hero-title-accent">더 빠르게.</span>
            </h1>
            <p className="conti-intro__hero-desc">
              교회 사역자(목사·전도사)를 위한
              <br />
              <strong>스마트 찬양 콘티 생성 도구</strong>입니다.
            </p>
            <ul className="conti-intro__hero-features">
              <li>
                <span className="conti-intro__hero-feature-icon"><FaCheck /></span>
                <span>곡 수, 템포, Key, 주제만 선택하세요</span>
              </li>
              <li>
                <span className="conti-intro__hero-feature-icon"><FaCheck /></span>
                <span>&apos;만들기&apos; 버튼 한 번으로 콘티 완성</span>
              </li>
              <li>
                <span className="conti-intro__hero-feature-icon"><FaCheck /></span>
                <span>악보 포함 자동 생성 및 팀 공유</span>
              </li>
            </ul>
            <button
              type="button"
              className="conti-intro__cta"
              onClick={() => navigate('/worship/conti/make')}
            >
              <span>지금 시작하기</span>
              <FaArrowRight />
            </button>
          </div>
          <div className="conti-intro__hero-right">
            <div className="conti-intro__hero-right-overlay" />
            <div className="conti-intro__hero-right-note">
              <FaMusic />
            </div>
            <div className="conti-intro__hero-right-verse">
              <p>&quot;Sing to the Lord a new song&quot;</p>
              <span>Psalm 96:1</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why / Pain vs Solution (2.html) */}
      <section className="conti-intro__why">
        <div className="conti-intro__section-inner">
          <div className="conti-intro__title-bar" />
          <h2 className="conti-intro__section-title">왜 &apos;찬양 콘티 제작 서비스&apos;인가</h2>
          <p className="conti-intro__section-sub">비효율적인 준비 과정은 줄이고, 예배의 본질에 집중하세요</p>
          <div className="conti-intro__why-grid">
            <div className="conti-intro__panel conti-intro__panel--left">
              <div className="conti-intro__panel-header conti-intro__panel-header--left">
                <FaCog />
                <span>기존의 어려움 (Pain Points)</span>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--left">
                  <FaHourglassHalf />
                </div>
                <div className="conti-intro__text-content">
                  <h4>곡 선정과 조합에 시간 소모</h4>
                  <p>매주 주제에 맞는 곡을 찾고 흐름을 고민하는 데 지나치게 많은 에너지가 소비됩니다.</p>
                </div>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--left">
                  <FaUsers />
                </div>
                <div className="conti-intro__text-content">
                  <h4>팀원 간 버전 관리 혼란</h4>
                  <p>카톡, 이메일로 주고받는 콘티 수정본들로 인해 최종 버전이 무엇인지 헷갈립니다.</p>
                </div>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--left">
                  <FaFolderOpen />
                </div>
                <div className="conti-intro__text-content">
                  <h4>악보, 가사, 키 변경 자료 흩어짐</h4>
                  <p>악보 사이트, 가사 파일, 조옮김 프로그램 등 여러 도구를 오가며 작업해야 합니다.</p>
                </div>
              </div>
            </div>
            <div className="conti-intro__arrow-connector">
              <FaArrowRight />
            </div>
            <div className="conti-intro__panel conti-intro__panel--right">
              <div className="conti-intro__panel-header conti-intro__panel-header--right">
                <FaMagic />
                <span>PraiseMaker의 해결책 (Solution)</span>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--right">
                  <FaFilter />
                </div>
                <div className="conti-intro__text-content">
                  <h4>필터 기반 추천으로 신속한 곡 구성</h4>
                  <p>주제, 분위기, 템포만 고르면 AI가 최적의 흐름을 추천하여 준비 시간을 획기적으로 단축합니다.</p>
                </div>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--right">
                  <FaShareAlt />
                </div>
                <div className="conti-intro__text-content">
                  <h4>콘티·악보 일괄 생성과 공유 링크</h4>
                  <p>하나의 링크로 모든 팀원에게 실시간 공유되며 수정 사항이 즉시 반영되어 혼선을 방지합니다.</p>
                </div>
              </div>
              <div className="conti-intro__list-item">
                <div className="conti-intro__icon-box conti-intro__icon-box--right">
                  <FaCog />
                </div>
                <div className="conti-intro__text-content">
                  <h4>키/템포 즉시 편집, 재생산성 향상</h4>
                  <p>원하는 키(Key)로 즉시 전조된 악보를 생성하고 지난 콘티를 불러와 재사용할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Key Features (3.html) */}
      <section className="conti-intro__features">
        <div className="conti-intro__section-inner">
          <div className="conti-intro__title-bar" />
          <h2 className="conti-intro__section-title">주요 기능 한눈에 보기</h2>
          <p className="conti-intro__section-sub">간편한 필수 설정부터 디테일한 전문 기능까지</p>
          <div className="conti-intro__features-grid">
            <div className="conti-intro__features-col conti-intro__features-col--essential">
              <h3 className="conti-intro__features-col-title">
                <FaCog />
                <span>필수 선택 (Basic Inputs)</span>
              </h3>
              <div className="conti-intro__card-grid">
                <div className="conti-intro__feature-card conti-intro__feature-card--essential">
                  <div className="conti-intro__feature-card-icon">
                    <FaListOl />
                  </div>
                  <h4>곡 수 설정</h4>
                  <p>예배 시간에 맞춰 3~6곡까지 자유롭게 범위를 지정하세요.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--essential">
                  <div className="conti-intro__feature-card-icon">
                    <FaTachometerAlt />
                  </div>
                  <h4>템포(BPM)</h4>
                  <p>빠른 찬양, 느린 경배곡, 혹은 자연스러운 믹스 구성을 선택합니다.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--essential">
                  <div className="conti-intro__feature-card-icon">
                    <FaMusic />
                  </div>
                  <h4>Key(조성)</h4>
                  <p>원곡 Key 또는 인도자의 보컬 음역대에 맞춘 자동 전조를 지원합니다.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--essential">
                  <div className="conti-intro__feature-card-icon">
                    <FaBook />
                  </div>
                  <h4>주제/테마</h4>
                  <p>감사, 회복, 성령, 사순절 등 절기와 설교 주제에 맞는 곡을 찾습니다.</p>
                </div>
              </div>
            </div>
            <div className="conti-intro__features-col conti-intro__features-col--extended">
              <h3 className="conti-intro__features-col-title conti-intro__features-col-title--extended">
                <FaListUl />
                <span>확장 기능 (Extended Features)</span>
              </h3>
              <div className="conti-intro__card-grid">
                <div className="conti-intro__feature-card conti-intro__feature-card--extended">
                  <div className="conti-intro__feature-card-icon conti-intro__feature-card-icon--extended">
                    <FaFilter />
                  </div>
                  <h4>난이도 필터</h4>
                  <p>회중 친숙도와 연주 난이도를 고려하여 누구나 부르기 쉬운 곡을 추천합니다.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--extended">
                  <div className="conti-intro__feature-card-icon conti-intro__feature-card-icon--extended">
                    <FaCalendarCheck />
                  </div>
                  <h4>본문/교회력 연동</h4>
                  <p>설교 본문이나 이번 주 교회력에 매칭되는 찬양을 자동으로 제안합니다.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--extended">
                  <div className="conti-intro__feature-card-icon conti-intro__feature-card-icon--extended">
                    <FaShareAlt />
                  </div>
                  <h4>팀 공유/내보내기</h4>
                  <p>팀원들에게 링크 공유, PDF 인쇄, ProPresenter용 가사 송출 파일까지.</p>
                </div>
                <div className="conti-intro__feature-card conti-intro__feature-card--extended">
                  <div className="conti-intro__feature-card-icon conti-intro__feature-card-icon--extended">
                    <FaMagic />
                  </div>
                  <h4>스마트 가이드</h4>
                  <p>곡과 곡 사이의 연결 멘트, 자연스러운 전조, BPM 가이드를 제공합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Process (4.html) */}
      <section className="conti-intro__process">
        <div className="conti-intro__section-inner">
          <div className="conti-intro__title-bar" />
          <h2 className="conti-intro__section-title">콘티 제작 프로세스</h2>
          <p className="conti-intro__section-sub">복잡한 준비 과정을 6단계의 스마트한 워크플로우로 단축했습니다</p>
          <div className="conti-intro__process-timeline">
            <div className="conti-intro__process-line-bg" />
            <div className="conti-intro__process-steps">
              {[
                { num: '01', title: '기본 설정', desc: '곡 수, 템포, Key, 주제를 선택하여 방향을 잡습니다.', icon: FaCog },
                { num: '02', title: '곡 추천/검색', desc: '라이브러리 및 AI 추천으로 최적의 곡을 구성합니다.', icon: FaLightbulb },
                { num: '03', title: '미리보기', desc: '오프닝부터 결단까지 전체 예배의 흐름을 확인합니다.', icon: FaListUl },
                { num: '04', title: '편집', desc: '원하는 Key로 전조하고, 멘트와 반복 구조를 조정합니다.', icon: FaPenSquare },
                { num: '05', title: '생성', desc: '\'만들기\' 버튼을 눌러 악보가 포함된 콘티를 완성합니다.', icon: FaMagic, highlight: true },
                { num: '06', title: '배포', desc: '팀원에게 링크 공유, PDF 및 ProPresenter 내보내기.', icon: FaShareAlt },
              ].map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.num} className={`conti-intro__step-unit ${step.highlight ? 'conti-intro__step-unit--highlight' : ''}`}>
                    <div className="conti-intro__step-text">
                      <span className="conti-intro__step-num">Step {step.num}</span>
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                    <div className="conti-intro__step-icon">
                      <StepIcon />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="conti-intro__process-cta">
            <button
              type="button"
              className="conti-intro__cta conti-intro__cta--large"
              onClick={() => navigate('/worship/conti/make')}
            >
              <span>지금 시작하기</span>
              <FaArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* 결과물 기능 소개 (기능 카드 6개) */}
      <section className="conti-intro__result-features">
        <div className="conti-intro__section-inner">
          <div className="conti-intro__title-bar" />
          <h2 className="conti-intro__section-title">결과물 예시 (악보 포함)</h2>
          <p className="conti-intro__section-sub">악보, 가사, 멘트 가이드까지 완벽하게 통합된 콘티</p>
          <div className="conti-intro__result-features-grid">
            {[
              { icon: FaFileAlt, title: '통합 악보 생성', desc: '모든 곡의 악보가 하나의 PDF 파일로 합쳐져 생성되어 관리가 편리합니다.' },
              { icon: FaMusic, title: '자동 조옮김 (Transposition)', desc: '원하는 Key로 즉시 변환된 코드 악보를 제공하여 연주자들의 수고를 덜어줍니다.' },
              { icon: FaMicrophoneAlt, title: '인도자 가이드 멘트', desc: '곡 사이의 연결 멘트, 기도 제목, BPM 변화 포인트가 함께 표기됩니다.' },
              { icon: FaDesktop, title: '다양한 포맷 내보내기', desc: '인쇄용 PDF, 웹 공유용 이미지(PNG), 자막 송출용 텍스트 파일을 지원합니다.' },
              { icon: FaCopyright, title: '저작권 표기 자동화', desc: 'CCLI 라이선스 번호와 저작권 정보가 하단에 자동으로 표기되어 안심할 수 있습니다.' },
              { icon: FaLayerGroup, title: '섹션 구분 및 태그', desc: 'Verse, Chorus, Bridge 등 노래의 구조를 시각적으로 명확하게 구분해줍니다.' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="conti-intro__result-feature-card">
                  <div className="conti-intro__result-feature-icon">
                    <Icon />
                  </div>
                  <div className="conti-intro__result-feature-content">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
