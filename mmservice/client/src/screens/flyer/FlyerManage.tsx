import { useNavigate } from 'react-router-dom';
import '../main/Main.scss';
import './ServicePage.scss';

const DUMMY_FLYERS = [
  { id: 1, title: '2026 봄 사역 전단지', updatedAt: '2026-03-01' },
  { id: 2, title: '주일 예배 안내', updatedAt: '2026-02-18' },
];

export default function FlyerManage() {
  const navigate = useNavigate();

  return (
    <div className="service-admin">
      <div className="service-admin__container service-page">
        <button type="button" className="service-page__back" onClick={() => navigate('/')}>
          ← 대시보드
        </button>

        <header className="service-page__header">
          <h1>모바일 전단지 관리</h1>
          <p>모바일 전단지 제작 및 수정 공간입니다.</p>
        </header>

        <div className="service-page__toolbar">
          <button type="button" className="service-page__primary-btn">
            + 새 전단지 만들기
          </button>
        </div>

        <ul className="service-page__list">
          {DUMMY_FLYERS.map((item) => (
            <li key={item.id} className="service-page__list-item">
              <div>
                <strong>{item.title}</strong>
                <span className="service-page__meta">최근 수정 {item.updatedAt}</span>
              </div>
              <button type="button" className="service-page__ghost-btn">
                수정
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
