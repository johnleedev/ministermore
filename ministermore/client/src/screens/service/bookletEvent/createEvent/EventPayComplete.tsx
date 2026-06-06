import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import goToMmservice from '../../../../goToMmservice';
import MmserviceURL from '../../../../MmserviceURL';
import './EventPayComplete.scss';

type EventPayCompleteState = {
  eventMainId?: number;
  ordererName?: string;
  ordererPhone?: string;
  visibleTabs?: string[];
};

export default function EventPayComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as EventPayCompleteState;

  const adminCreatePath = useMemo(() => {
    const id = state.eventMainId;
    if (id == null || Number.isNaN(Number(id))) return '/service/event';
    const q = new URLSearchParams({ id: String(id) });
    if (Array.isArray(state.visibleTabs) && state.visibleTabs.length > 0) {
      q.set('visibleTabs', JSON.stringify(state.visibleTabs));
    }
    if (state.ordererName) q.set('ordererName', state.ordererName);
    if (state.ordererPhone) q.set('ordererPhone', state.ordererPhone);
    return `/service/bookleteventcreate?${q.toString()}`;
  }, [state.eventMainId, state.ordererName, state.ordererPhone, state.visibleTabs]);

  const adminBase = MmserviceURL.replace(/\/$/, '');

  const handleGoAdmin = () => {
    goToMmservice(adminCreatePath);
  };

  return (
    <div className="event-pay-complete">
      <div className="event-pay-complete__inner">
        <div className="event-pay-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="event-pay-complete__title">행사 전단지 결제가 완료되었습니다</h1>
        <p className="event-pay-complete__desc">
          결제가 정상 승인되었습니다. 전단지 제작은 아래 버튼을 눌러
        </p>
        <p className="event-pay-complete__highlight">서비스관리자 페이지에서 진행해 주세요.</p>

        <div className="event-pay-complete__info">
          <p>
            <strong>서비스관리자</strong>는 결제하신 행사 전단지를 편집·배포하는 전용 관리 화면입니다.
          </p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            관리자 주소: <span style={{ wordBreak: 'break-all' }}>{adminBase}</span>
          </p>
        </div>

        <div className="event-pay-complete__btns">
          <button
            type="button"
            className="event-pay-complete__btn event-pay-complete__btn--primary"
            onClick={handleGoAdmin}
          >
            서비스관리자에서 제작하기
          </button>
          <button
            type="button"
            className="event-pay-complete__btn event-pay-complete__btn--secondary"
            onClick={() => {
              navigate('/service/event');
              window.scrollTo(0, 0);
            }}
          >
            서비스 소개로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
