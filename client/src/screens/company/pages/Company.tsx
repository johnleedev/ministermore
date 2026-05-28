import '../Company.scss';
import heroImage from '../../../images/company/6pUW2VKd.jpeg';
import serviceChurchAppImage from '../../../images/company/HpwbYom5.jpeg';
import serviceRetreatImage from '../../../images/company/LY8vuqw5.jpeg';
import serviceResourceImage from '../../../images/company/MVxtreGD.jpeg';
import serviceDigitalImage from '../../../images/company/VFlS33qD.jpeg';

export default function Company() {
  return (
    <div className="company company-page-v2">
      <nav className="company-page-v2__nav">
        <div className="company-page-v2__container">
          <ul className="company-page-v2__menu">
            <li>
              <a href="#intro">소개</a>
            </li>
            <li>
              <a href="#vision">비전</a>
            </li>
            <li>
              <a href="#values">핵심가치</a>
            </li>
            <li>
              <a href="#services">서비스안내</a>
            </li>
            <li>
              <a href="#contact">문의사항</a>
            </li>
          </ul>
        </div>
      </nav>

      <section id="intro" className="hero-section">
        <div className="company-page-v2__container hero-grid">
          <div className="hero-text">
            <h2>사역에 관한 모든 것, 사역자모아</h2>
            <h1>복음의 확장과 사역자들의 사역을 돕는 플랫폼</h1>
            <p>
              &apos;사역자모아&apos;는 이 세대를 하나님께 이끄는데 기여하고자 합니다. 교회는
              건강한 동역자를 만나고, 사역자는 사명에 집중할 수 있는 건강한 생태계를
              만들어갑니다. 사역자모아에서 보다 나은 사역 문화를 경험해보세요!
            </p>
          </div>
          <div className="hero-deco">
            <img src={heroImage} alt="사역자모아 서비스 소개" />
          </div>
        </div>
      </section>

      <section id="vision" className="vision-section">
        <div className="company-page-v2__container">
          <p className="vision-sub">Changing Culture, Changing World</p>
          <h3>우리는 문화를 바꾸고, 세상을 바꿉니다.</h3>
          <p>
            기독교 구인구직과 사역 지원의 디지털 혁신을 통해, 한국 교회의 사역 문화를 더
            투명하고 스마트하게 변화시키며 나아가 세상을 그리스도의 사랑으로 바꾸어 갑니다.
          </p>
        </div>
      </section>

      <section id="values">
        <div className="company-page-v2__container">
          <h2 className="section-title">핵심가치</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-num">01</div>
              <h3>복음의 확장</h3>
              <p>
                복음이 필요한 곳에 합당한 사역자가 세워지도록 청빙의 모든 과정을 돕고, 이
                세대를 하나님께로 이끌어가는 통로가 됩니다.
              </p>
            </div>
            <div className="value-card">
              <div className="value-num">02</div>
              <h3>사역자 지원</h3>
              <p>
                사역자들이 청빙 정보뿐만 아니라 예배 콘티, 수련회 준비 등 실무에 필요한
                리소스를 쉽게 얻고 사역에만 온전히 집중할 수 있도록 든든한 동반자가 됩니다.
              </p>
            </div>
            <div className="value-card">
              <div className="value-num">03</div>
              <h3>문화의 변화</h3>
              <p>
                교회와 사역자 사이에 신뢰를 기반으로 한 건강하고 상호 존중하는 사역 매칭
                문화를 선도합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="company-page-v2__container">
          <h2 className="section-title">서비스 안내</h2>
          <div className="services-container">
            <div className="service-item">
              <div className="service-text">
                <span className="service-tag">01. Smart Platform</span>
                <h3>사역자 청빙· 사역지 구직</h3>
                <p>
                  목회자, 교육 전도사, 찬양대, 교회 행정직원 등 교회가 필요로 하는 사역자를
                  가장 빠르고 정확하게 연결합니다. 사역자는 자신에게 맞는 사역지를
                  직관적으로 찾을 수 있습니다.
                </p>
              </div>
              <div className="service-visual">
                <img src={serviceChurchAppImage} alt="스마트 청빙 서비스 화면" />
              </div>
            </div>

            <div className="service-item">
              <div className="service-text">
                <span className="service-tag">02. One-Stop System</span>
                <h3>수련회 지원</h3>
                <p>
                  전국 교회 수련회 장소 검색부터 실제 이용자들의 생생한 리뷰, 검증된 수련회
                  강사 정보까지 까다롭고 복잡한 수련회 준비를 한 번에 해결해 드립니다.
                </p>
              </div>
              <div className="service-visual">
                <img src={serviceResourceImage} alt="수련회 지원 서비스 화면" />
              </div>
            </div>

            <div className="service-item">
              <div className="service-text">
                <span className="service-tag">03. Core Resource</span>
                <h3>예배콘티 및 사역 리소스</h3>
                <p>
                  주일 예배 및 집회에 바로 적용할 수 있는 찬양 콘티 작성 기능과 사역에 필요한
                  다양한 실무 자료를 제공하여 사역자의 고민을 덜어드립니다.
                </p>
              </div>
              <div className="service-visual">
                <img src={serviceRetreatImage} alt="예배콘티 및 리소스 서비스 화면" />
              </div>
            </div>

            <div className="service-item">
              <div className="service-text">
                <span className="service-tag">04. Digital Transformation</span>
                <h3>
                  교회의 디지털화
                  <br />
                  (홈인앱/모바일 전단지)
                </h3>
                <p>
                  모바일 시대에 발맞추어 교회를 효과적으로 알릴 수 있는 교회 전용
                  어플리케이션 제작 및 행사 홍보용 모바일 전단지 서비스를 지원합니다.
                </p>
              </div>
              <div className="service-visual">
                <img src={serviceDigitalImage} alt="교회 디지털화 서비스 화면" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="company-page-v2__container">
          <div className="contact-grid">
            <div className="contact-left">
              <h2>문의사항</h2>
              <p>
                사역자모아는 언제나 여러분의 목소리에 귀를 기울입니다. 플랫폼 이용 중 불편한
                점이 있으시거나 제휴, 광고, 교회 어플 제작 등 협업이 필요하시다면 언제든
                편하게 연락해 주세요. 사역을 돕기 위해 가장 빠르게 답변해 드리겠습니다.
              </p>
            </div>
            <div className="contact-right">
              <div className="info-row">
                <div className="info-label">이메일 문의</div>
                <div className="info-value">yeplat@naver.com</div>
              </div>
              <div className="info-row">
                <div className="info-label">카카오톡 채널</div>
                <div className="info-value"
                  style={{cursor: 'pointer'}}
                  onClick={()=>{
                    window.open('http://pf.kakao.com/_Xzwrn', '_blank');
                  }}
                >@사역자모아</div>
              </div>
              <div className="info-row">
                <div className="info-label">운영 시간</div>
                <div className="info-value">평일 10:00 ~ 18:00 (토/일/공휴일 휴무)</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

